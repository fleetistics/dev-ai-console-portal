import { useMemo } from "react";
import { LoginPage } from "@/app.Impl/userSession/login";
import { BaseInitPageLayout } from "@/uiLayout/base-page/BaseInitLayout";
import { RouterErrorPage } from "@/uiLayout/base-page/RouterErrorPage";
import { RouterProvider, createBrowserRouter } from "react-router";

export function NoAuthUI(props: {
    reloadSessionFunc?: () => void
}) {
    const router = useMemo(() => createBrowserRouter([{
        path: '/',
        element: <BaseInitPageLayout />,
        errorElement: <RouterErrorPage />,
        children: [
            {
                index: true,
                element: <LoginPage reloadSessionFunc={props.reloadSessionFunc} />,
            }
        ]
    }]), [props.reloadSessionFunc]);

    return (
        <RouterProvider router={router} />
    );
}