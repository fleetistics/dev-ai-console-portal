import type { ReactNode } from 'react';
import { Center } from '@mantine/core';
import classes from './init-app-background.module.css';

export function InitAppBackground(props: { children?: ReactNode }) {
  return <Center className={classes.background}>{props.children}</Center>;
}
