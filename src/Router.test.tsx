import { installApiMock, jsonResponse, renderApp, screen } from '@test-utils';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from './Router';

/**
 * Drives the real route tree (not a copy) through createMemoryRouter, so this
 * proves the router's lazy() entry for /users actually resolves its dynamic
 * import and renders — the thing Users.page.test.tsx (which imports UsersPage
 * directly) cannot exercise.
 */
describe('Router', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the home page at /', async () => {
    installApiMock({});
    const router = createMemoryRouter(routes, { initialEntries: ['/'] });

    renderApp(<RouterProvider router={router} />);

    expect(await screen.findByText('this guide')).toBeInTheDocument();
  });

  it('lazily loads and renders the Users route on navigation', async () => {
    installApiMock({ 'GET /api/users': () => jsonResponse([]) });
    const router = createMemoryRouter(routes, { initialEntries: ['/users'] });

    renderApp(<RouterProvider router={router} />);

    // No synchronous element for /users exists in the route tree — this only
    // resolves if lazy()'s dynamic import actually completes and the router
    // renders the returned Component.
    expect(await screen.findByRole('heading', { name: 'Users' })).toBeInTheDocument();
  });
});
