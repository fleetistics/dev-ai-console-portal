import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { log, reportCrash } from '@/app.Impl/flightRecorder';
import { Button } from '@/components/ui/button';

export function RouterErrorPage() {
  const error = useRouteError() as Error | undefined;

  // Render errors inside routes surface here rather than at window.onerror,
  // so this page is a crash-report trigger of its own (throttled in the uploader).
  useEffect(() => {
    log.error('router', error?.message || 'Route error', { error });
    reportCrash('route-error');
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">ERROR</h1>
        <p>{error?.message || 'Some Error'}</p>
        <Button onClick={() => window.location.replace('/')}>Go to homepage</Button>
      </div>
    </div>
  );
}
