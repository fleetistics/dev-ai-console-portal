import { createBrowserRouter, RouterProvider, type RouteObject } from 'react-router';
import { HomePage } from './pages/Home.page';
import { BasePageLayout } from './uiLayout/base-page/BasePageLayout';
import { RouterErrorPage } from './uiLayout/base-page/RouterErrorPage';

// Exported separately from the browser router instance so a test can drive the
// exact same route tree through createMemoryRouter (browser history APIs aren't
// available in jsdom).
export const routes: RouteObject[] = [
  {
    element: <BasePageLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
      {
        path: '/users',
        // Code-split: mantine-react-table + libphonenumber-js only load when a
        // user actually navigates here, instead of bloating the initial bundle.
        // BasePageLayout shows a top progress bar via useNavigation() while this
        // chunk (and any future ones) is fetched.
        lazy: () => import('./pages/Users.page').then((m) => ({ Component: m.UsersPage })),
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function Router() {
  return <RouterProvider router={router} />;
}
