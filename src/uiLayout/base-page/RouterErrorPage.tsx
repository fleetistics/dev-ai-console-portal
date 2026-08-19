import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { useRouteError } from 'react-router';

export function RouterErrorPage() {
  const error = useRouteError() as Error | undefined;

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
