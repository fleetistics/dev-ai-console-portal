import { useMemo } from 'react';
import { RouterProvider, createBrowserRouter } from 'react-router';
import { LoginPage } from '@/app.Impl/userSession/login';
import { BaseInitPageLayout } from '@/uiLayout/base-page/BaseInitLayout';
import { RouterErrorPage } from '@/uiLayout/base-page/RouterErrorPage';

export function NoAuthUI(props: { reloadSessionFunc?: () => void }) {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/',
          element: <BaseInitPageLayout />,
          errorElement: <RouterErrorPage />,
          children: [
            {
              index: true,
              element: <LoginPage reloadSessionFunc={props.reloadSessionFunc} />,
            },
          ],
        },
      ]),
    [props.reloadSessionFunc]
  );

  return <RouterProvider router={router} />;
}
