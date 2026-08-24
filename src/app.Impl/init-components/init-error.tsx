import { Button, Stack, Text } from '@mantine/core';
import { InitAppBackground } from './init-app-background';

export function InitError(props: { title?: string; errorMsg?: string; retryFunc?: () => void }) {
  return (
    <InitAppBackground>
      <Stack align="center" gap="sm">
        <Text c="red" fw={700}>
          {props.title ?? 'Operation failed'}
        </Text>
        {props.errorMsg && <Text>{props.errorMsg}</Text>}
        {props.retryFunc && <Button onClick={props.retryFunc}>Try again</Button>}
      </Stack>
    </InitAppBackground>
  );
}
