import type { ReactNode } from 'react';
import { Loader, Stack, Text } from '@mantine/core';
import { InitAppBackground } from './init-app-background';

export type InitWaiterProps = {
  children?: ReactNode;
  loadingLabel?: string;
  error?: string;
};

export function InitWaiter(props: InitWaiterProps) {
  if (props.error) {
    return (
      <InitAppBackground>
        <Text c="red">{props.error}</Text>
      </InitAppBackground>
    );
  }

  if (props.loadingLabel) {
    return (
      <InitAppBackground>
        <Stack align="center" gap="sm">
          <Loader />
          <Text>{props.loadingLabel}</Text>
        </Stack>
      </InitAppBackground>
    );
  }

  return <>{props.children}</>;
}
