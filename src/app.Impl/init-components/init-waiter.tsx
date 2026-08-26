import type { ReactNode } from 'react';
import { IconLoader2 } from '@tabler/icons-react';
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
        <p className="text-red-600">{props.error}</p>
      </InitAppBackground>
    );
  }

  if (props.loadingLabel) {
    return (
      <InitAppBackground>
        <div className="flex flex-col items-center gap-2">
          <IconLoader2 className="animate-spin" size={28} />
          <p>{props.loadingLabel}</p>
        </div>
      </InitAppBackground>
    );
  }

  return <>{props.children}</>;
}
