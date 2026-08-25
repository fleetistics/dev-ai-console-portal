import { useEffect } from 'react';
import { setOnAuthLost } from '@/app.Commons/dataLayer/apiSlice';
import { InitError } from '@/app.Impl/init-components/init-error';
import { InitWaiter } from '@/app.Impl/init-components/init-waiter';
import { NoAuthUI } from '@/app.Impl/userSession/noauth-ui';
import { UserSession_ValidSession } from './userSession_ValidSession';
import { useCheckSessionQuery } from './userSessionApi';

const statusOf = (error: unknown): number | undefined => {
  const status = (error as { status?: unknown })?.status;
  return typeof status === 'number' ? status : undefined;
};

const messageOf = (error: unknown): string => {
  const err = error as { status?: unknown; error?: string; data?: { message?: string } };
  if (typeof err?.status === 'number') {
    return err.data?.message ?? `Request failed with status ${err.status}`;
  }
  // FETCH_ERROR / TIMEOUT_ERROR and similar carry a description in `error`.
  return err?.error ?? 'Unknown error';
};

export function UserSessionProvider(props: { children: React.ReactNode }) {
  const { data, isLoading, isError, error, refetch } = useCheckSessionQuery();

  // When apiSlice exhausts its refresh path, re-check the session so the UI drops
  // back to the login screen instead of sitting on stale, unauthorized data.
  useEffect(() => {
    setOnAuthLost(() => {
      void refetch();
    });
    return () => setOnAuthLost(null);
  }, [refetch]);

  if (isLoading) {
    return <InitWaiter loadingLabel="Checking user session..." />;
  }
  if (isError) {
    if (statusOf(error) === 401) {
      return <NoAuthUI reloadSessionFunc={refetch} />;
    }
    return (
      <InitError title="Session check failed" errorMsg={messageOf(error)} retryFunc={refetch} />
    );
  }
  if (data === undefined) {
    return <InitError errorMsg="Session check failed: no data returned" retryFunc={refetch} />;
  }
  return (
    <UserSession_ValidSession userId={data.userId} sessionId={data.sessionId}>
      {props.children}
    </UserSession_ValidSession>
  );
}
