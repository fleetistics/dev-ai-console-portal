import { useEffect } from 'react';
import { getErrorMessage, getErrorStatus } from '@/app.Commons/dataLayer/apiError';
import { setOnAuthLost } from '@/app.Commons/dataLayer/apiSlice';
import { InitError } from '@/app.Impl/init-components/init-error';
import { InitWaiter } from '@/app.Impl/init-components/init-waiter';
import { NoAuthUI } from '@/app.Impl/userSession/noauth-ui';
import { UserSession_ValidSession } from './userSession_ValidSession';
import { useCheckSessionQuery } from './userSessionApi';

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
    if (getErrorStatus(error) === 401) {
      return <NoAuthUI reloadSessionFunc={refetch} />;
    }
    return (
      <InitError
        title="Session check failed"
        errorMsg={getErrorMessage(error)}
        retryFunc={refetch}
      />
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
