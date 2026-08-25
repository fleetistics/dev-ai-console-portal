import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { log, reportCrash } from '@/app.Impl/flightRecorder';

export function RouterErrorPage() {
  const error = useRouteError() as Error | undefined;

  // Render errors inside routes surface here rather than at window.onerror,
  // so this page is a crash-report trigger of its own (throttled in the uploader).
  useEffect(() => {
    log.error('router', error?.message || 'Route error', { error });
    reportCrash('route-error');
  }, [error]);

  return (
    <Center mih="100vh">
      <Stack align="center" gap="sm">
        <Title order={1}>ERROR</Title>
        <Text>{error?.message || 'Some Error'}</Text>
        <Button onClick={() => window.location.replace('/')}>Go to homepage</Button>
      </Stack>
    </Center>
  );
}
