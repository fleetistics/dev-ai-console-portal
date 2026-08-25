import { FlightLogger } from './logger';
import { formatArgs } from './safeSerialize';
import { LogLevel } from './types';

/* oxlint-disable no-console -- this module is the console-capture layer; it must touch the real console */
/**
 * Console methods as they were before patching. Internal recorder code (and anything
 * that must never re-enter the capture pipeline) logs through these.
 */
export const nativeConsole: Pick<Console, 'debug' | 'log' | 'info' | 'warn' | 'error'> = {
  debug: console.debug.bind(console),
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

let consolePatched = false;

/**
 * Mirrors console.* into the recorder while preserving original behavior (DevTools
 * output is untouched). This is the supplementary channel for third-party noise;
 * first-party code should prefer the structured facade.
 */
export function patchConsole(logger: FlightLogger): void {
  if (consolePatched) {
    return;
  }
  consolePatched = true;

  const levels: Array<[keyof typeof nativeConsole, LogLevel]> = [
    ['debug', 'debug'],
    ['log', 'info'],
    ['info', 'info'],
    ['warn', 'warn'],
    ['error', 'error'],
  ];

  for (const [method, level] of levels) {
    console[method] = (...args: unknown[]) => {
      nativeConsole[method](...args);
      try {
        logger[level]('console', formatArgs(args));
      } catch {
        // Capturing must never break console output.
      }
    };
  }
}

/**
 * Uncaught errors and unhandled promise rejections. onFatal is the auto-upload hook;
 * it is fired after the entry is recorded, and its own failures are swallowed.
 */
export function attachGlobalErrorHandlers(logger: FlightLogger, onFatal: () => void): void {
  window.addEventListener('error', (event) => {
    logger.error('global', event.message || 'Uncaught error', {
      error: event.error,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    try {
      onFatal();
    } catch {
      /* noop */
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('global', 'Unhandled promise rejection', { reason: event.reason });
    try {
      onFatal();
    } catch {
      /* noop */
    }
  });
}
