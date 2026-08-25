import { createBrowserRouter, RouterProvider } from 'react-router';
import { HomePage } from './pages/Home.page';
import { UsersPage } from './pages/Users.page';
import { BasePageLayout } from './uiLayout/base-page/BasePageLayout';
import { RouterErrorPage } from './uiLayout/base-page/RouterErrorPage';

const router = createBrowserRouter([
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
        element: <UsersPage />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
