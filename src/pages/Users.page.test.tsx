import {
  installApiMock,
  jsonResponse,
  renderApp,
  screen,
  userEvent,
  waitFor,
  within,
} from '@test-utils';
import type { User } from '@/app.DataLayer/user/userDto';
import { UsersPage } from './Users.page';

/**
 * Sample UI/UX tests for a connected page.
 *
 * The pattern:
 *  - installApiMock() decides what the "server" returns (no real network, no MSW dep),
 *  - renderApp() mounts the page with Mantine + a fresh Redux store per test,
 *  - interactions go through userEvent (real click/typing semantics, not fireEvent),
 *  - queries prefer accessible roles/names — the test fails if a control loses its
 *    accessible name, which is a UX regression worth catching.
 */

const alice: User = {
  Id: 1,
  DisplayName: 'Alice',
  FullName: 'Alice Anderson',
  Phone: '8135550100',
  Email: 'alice@example.test',
};

const bob: User = {
  Id: 2,
  DisplayName: 'Bob',
  FullName: 'Bob Brown',
  Phone: '8135550199',
  Email: 'bob@example.test',
};

beforeAll(() => {
  // fetchBaseQuery builds absolute URLs from AppConfig.BASE_URL; a real origin keeps
  // `new Request(url)` valid under Node's fetch implementation.
  vi.stubEnv('VITE_BASE_URL', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllGlobals(); // removes the fetch mock installed by installApiMock()
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('UsersPage', () => {
  it('loads users from the API and renders them as rows', async () => {
    const api = installApiMock({ 'GET /api/users': () => jsonResponse([alice, bob]) });
    renderApp(<UsersPage />);

    // findBy* waits out the loading state — no manual waits needed.
    expect(await screen.findByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob Brown')).toBeInTheDocument();
    expect(screen.getByText('bob@example.test')).toBeInTheDocument();

    // Every request carries W3C trace context so the server continues the trace.
    expect(api.requests[0].traceparent).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
  });

  it('formats phone numbers in US national format', async () => {
    installApiMock({ 'GET /api/users': () => jsonResponse([alice]) });
    renderApp(<UsersPage />);

    expect(await screen.findByText('(813) 555-0100')).toBeInTheDocument();
  });

  it('filters rows from the search box and restores them with the clear button', async () => {
    installApiMock({ 'GET /api/users': () => jsonResponse([alice, bob]) });
    const user = userEvent.setup();
    renderApp(<UsersPage />);
    await screen.findByText('Alice');

    // Row-level queries instead of getByText: the table highlights the matched
    // substring by wrapping it in <mark>, which splits cell text into several nodes.
    // A row's accessible name is its concatenated cell text, so it stays stable.
    await user.type(screen.getByPlaceholderText('Filter users...'), 'alice');
    await waitFor(() => {
      expect(screen.queryByRole('row', { name: /bob brown/i })).not.toBeInTheDocument();
    });
    expect(screen.getByRole('row', { name: /alice anderson/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filter' }));
    expect(await screen.findByRole('row', { name: /bob brown/i })).toBeInTheDocument();
  });

  it('opens the edit modal prefilled, with Save disabled until something changes', async () => {
    installApiMock({ 'GET /api/users': () => jsonResponse([alice]) });
    const user = userEvent.setup();
    renderApp(<UsersPage />);
    await screen.findByText('Alice');

    await user.click(screen.getByRole('button', { name: 'Edit user' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Edit user')).toBeInTheDocument();
    const displayName = within(dialog).getByRole('textbox', { name: /display name/i });
    expect(displayName).toHaveValue('Alice');

    // UX contract: no accidental no-op saves.
    const saveButton = within(dialog).getByRole('button', { name: 'Save' });
    expect(saveButton).toBeDisabled();

    await user.type(displayName, 'X');
    expect(saveButton).toBeEnabled();
  });

  it('saves an edited user and shows the updated value in the table', async () => {
    // Stateful mock: the PUT mutates `current`, and RTK Query's tag invalidation
    // makes the page refetch the list — the UI must end up showing the new name.
    let current = [alice, bob];
    const api = installApiMock({
      'GET /api/users': () => jsonResponse(current),
      'PUT /api/users/1': (_request, recorded) => {
        const updated = recorded.body as User;
        current = current.map((u) => (u.Id === updated.Id ? updated : u));
        return jsonResponse(updated);
      },
    });
    const user = userEvent.setup();
    renderApp(<UsersPage />);
    await screen.findByText('Alice');

    await user.click(screen.getAllByRole('button', { name: 'Edit user' })[0]);
    const dialog = await screen.findByRole('dialog');
    const displayName = within(dialog).getByRole('textbox', { name: /display name/i });
    await user.clear(displayName);
    await user.type(displayName, 'Alicia');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('Alicia')).toBeInTheDocument();

    const put = api.requests.find((r) => r.method === 'PUT');
    expect(put?.pathname).toBe('/api/users/1');
    expect((put?.body as User).DisplayName).toBe('Alicia');
  });

  it('validates the add-user form and does not submit invalid input', async () => {
    const api = installApiMock({ 'GET /api/users': () => jsonResponse([]) });
    const user = userEvent.setup();
    renderApp(<UsersPage />);

    await user.click(await screen.findByRole('button', { name: 'Add user' }));
    const dialog = await screen.findByRole('dialog');

    await user.type(within(dialog).getByRole('textbox', { name: /username/i }), 'jdoe');
    await user.type(within(dialog).getByRole('textbox', { name: /display name/i }), 'John');
    await user.type(within(dialog).getByRole('textbox', { name: /email/i }), 'not-an-email');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect(await within(dialog).findByText('Invalid email')).toBeInTheDocument();
    expect(api.requests.some((r) => r.method === 'POST')).toBe(false);
  });

  it('shows an error alert when loading users fails', async () => {
    // 400: a definitive client error — the api layer retries only 5xx/network failures,
    // so this fails immediately instead of stalling the test through backoff retries.
    installApiMock({ 'GET /api/users': () => jsonResponse({ message: 'bad request' }, 400) });
    renderApp(<UsersPage />);

    expect(await screen.findByText('Failed to load users')).toBeInTheDocument();
  });
});
