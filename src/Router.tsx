import { createBrowserRouter, RouterProvider } from 'react-router';
import { HomePage } from './pages/Home.page';
import { BaseInitPageLayout } from './uiLayout/base-page/BaseInitLayout';
import { RouterErrorPage } from './uiLayout/base-page/RouterErrorPage';
import { BasePageLayout } from './uiLayout/base-page/BasePageLayout';

const router = createBrowserRouter([
  {
    element: <BasePageLayout />,
    errorElement: <RouterErrorPage />,
    children: [
      {
        path: '/',
        element: <HomePage />,
      },
    ],
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
