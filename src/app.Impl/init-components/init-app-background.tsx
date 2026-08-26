import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import classes from './init-app-background.module.css';

export function InitAppBackground(props: { children?: ReactNode }) {
  return (
    <div className={cn(classes.background, 'flex items-center justify-center')}>
      {props.children}
    </div>
  );
}
