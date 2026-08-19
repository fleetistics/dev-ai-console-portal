import { AppConfig } from "@/app.Impl/configs/AppConfig";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { FetchError, ofetch } from "ofetch";
import { AuthToken, setOnAuthLost } from "@/app.Commons/dataLayer/apiSlice";
import { AppVersionInfo, UserSessionCheckResponse } from "./userSessionDto";
import { InitWaiter } from "@/app.Impl/init-components/init-waiter";
import { InitError } from "@/app.Impl/init-components/init-error";

import { NoAuthUI } from "@/app.Impl/userSession/noauth-ui";
import { USER_SESSION_CHECK_SESSION_URI } from "./userSessionConst";
import { UserSession_ValidSession } from "./userSession_ValidSession";



export function UserSessionProvider(props: { children: React.ReactNode }) {

    const api = ofetch.create({
        baseURL: AppConfig.BASE_URL,
        credentials: 'include'
    });

    const { data, isPending, isError, error, refetch } = useQuery({
        queryKey: ['userSession'],
        queryFn: async () => {
            const session = await api<UserSessionCheckResponse>(USER_SESSION_CHECK_SESSION_URI, {
                method: 'POST',
                body: {
                    appVersionInfo: {
                        AppUid: AppConfig.APP_UID,
                        AppVersion: AppConfig.APP_VERSION
                    } as AppVersionInfo
                },
            });
            // Seed the bearer token used by every RTK Query request.
            AuthToken.set(session.accessToken);
            return session;
        },
        staleTime: Infinity,
        retry: (failureCount, error) => {
            const status = (error as FetchError).status;
            if (status === 401) return false;         // no session — retrying won't help, go straight to login
            if (status !== undefined) return false;    // other HTTP errors (500 etc.) — surface immediately too, don't mask a real server bug behind silent retries
            return failureCount < 2;                   // status undefined = network/timeout — worth a couple retries
        },
    });

    // When apiSlice exhausts its refresh path, re-check the session so the UI drops
    // back to the login screen instead of sitting on stale, unauthorized data.
    useEffect(() => {
        setOnAuthLost(() => { void refetch(); });
        return () => setOnAuthLost(null);
    }, [refetch]);

    if (isPending) {
        return (<InitWaiter loadingLabel='Checking user session...' />);
    }
    else if (isError) {
        console.log('UserSessionProvider - (error as FetchError)', (error as FetchError));
        if ((error as FetchError).status === 401) return (<NoAuthUI reloadSessionFunc={refetch} />);
        else return (<InitError title="Session check failed" errorMsg={(error as FetchError)?.message} retryFunc={refetch} />);
    }
    else if (data === undefined) return (<InitError errorMsg={"Session check failed: no data returned"} retryFunc={refetch} />);
    else return (<UserSession_ValidSession userId={data.userId} sessionId={data.sessionId}>
        {props.children}
    </UserSession_ValidSession>);
}