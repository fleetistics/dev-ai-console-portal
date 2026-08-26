import { installApiMock, jsonResponse, renderApp, screen, userEvent, waitFor } from '@test-utils';
import i18next from 'i18next';
import { UserSession_ValidSession } from '@/app.Commons/userSession/userSession_ValidSession';
import { LanguageSwitcher } from './LanguageSwitcher';

beforeAll(() => {
  vi.stubEnv('VITE_BASE_URL', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
  void i18next.changeLanguage('en');
});

afterAll(() => {
  vi.unstubAllEnvs();
});

// LanguageSwitcher only ever renders inside the authenticated route tree in the
// real app (see BasePageLayout), so tests wrap it the same way to give it a real
// userId instead of the context's -1 default.
function renderSwitcher() {
  return renderApp(
    <UserSession_ValidSession userId={7} sessionId={42}>
      <LanguageSwitcher />
    </UserSession_ValidSession>
  );
}

describe('LanguageSwitcher', () => {
  it('renders nothing when no other language is enabled yet', async () => {
    installApiMock({ 'GET /api/languages': () => jsonResponse([]) });
    renderSwitcher();

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(screen.queryByRole('button', { name: 'Change language' })).not.toBeInTheDocument();
  });

  it('lists English plus every enabled language, switching persists the choice locally and syncs it to the server', async () => {
    const api = installApiMock({
      'GET /api/languages': () =>
        jsonResponse([
          { Code: 'es', EnglishName: 'Spanish', NativeName: 'Español', IsEnabled: true },
        ]),
      'PATCH /api/users/7': (_req, recorded) => jsonResponse(recorded.body),
    });
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(await screen.findByRole('button', { name: 'Change language' }));
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Español' })).toBeInTheDocument();

    await user.click(screen.getByRole('menuitemradio', { name: 'Español' }));

    expect(localStorage.getItem('language')).toBe('es');
    expect(i18next.language).toBe('es');

    await waitFor(() => {
      const patch = api.requests.find((r) => r.method === 'PATCH' && r.pathname === '/api/users/7');
      expect(patch).toBeDefined();
      expect(patch?.body).toEqual({ PreferredLanguage: 'es' });
    });
  });

  it('shows English only once even if the server returns a bad "en"-coded row', async () => {
    installApiMock({
      'GET /api/languages': () =>
        jsonResponse([
          { Code: 'EN', EnglishName: 'English', NativeName: 'English', IsEnabled: true },
          { Code: 'es', EnglishName: 'Spanish', NativeName: 'Español', IsEnabled: true },
        ]),
    });
    const user = userEvent.setup();
    renderSwitcher();

    await user.click(await screen.findByRole('button', { name: 'Change language' }));

    expect(screen.getAllByRole('menuitemradio', { name: 'English' })).toHaveLength(1);
    expect(screen.getByRole('menuitemradio', { name: 'Español' })).toBeInTheDocument();
  });
});
