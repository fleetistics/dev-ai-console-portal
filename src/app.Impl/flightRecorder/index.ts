import { setTraceRecorder } from '@/app.Commons/dataLayer/traceContext';
import { attachGlobalErrorHandlers, nativeConsole, patchConsole } from './captureGlobals';
import { createLogSink } from './logDb';
import { FlightLogger } from './logger';
import { LogUploader } from './uploader';

export type { LogEntry, LogLevel } from './types';
export type { UploadTrigger } from './uploader';

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_ROWS = 50000;
const PURGE_INTERVAL_MS = 60 * 60 * 1000;
const KILL_SWITCH_KEY = 'flightRecorder.disabled';

const sessionId: string =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sink = createLogSink();

/**
 * The app-wide structured logger. Usable before initFlightRecorder() runs — entries
 * simply buffer through the normal batching path.
 *
 *   log.info('checkout', 'payment submitted', { orderId });
 */
export const log = new FlightLogger({ sessionId, sink });

const uploader = new LogUploader(log, sink, sessionId);

/**
 * Manual "Report a problem" path: uploads the full retained window plus the
 * user's comment. Returns whether the server accepted it.
 */
export const reportProblem = (comment: string): Promise<boolean> =>
  uploader.upload({ trigger: 'user', comment });

/** Crash-path upload (throttled). Exposed for error boundaries / router error pages. */
export const reportCrash = (trigger: 'crash' | 'route-error'): void => uploader.autoUpload(trigger);

let initialized = false;

/**
 * Wires the flight recorder into the page: console capture, global error handlers
 * with throttled auto-upload, retention purge, and flush-on-hide. Call once, before
 * the React root renders, so early failures are captured too.
 */
export function initFlightRecorder(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  try {
    if (localStorage.getItem(KILL_SWITCH_KEY) === '1') {
      log.setEnabled(false);
      return;
    }
  } catch {
    /* localStorage unavailable — proceed enabled */
  }

  patchConsole(log);
  attachGlobalErrorHandlers(log, () => uploader.autoUpload('crash'));

  // Every API request logs its endpoint + W3C traceId, so an uploaded log carries
  // the exact ids to look up the matching server traces in the telemetry backend.
  setTraceRecorder((endpoint, traceId) => {
    log.debug('api', `request ${endpoint}`, { traceId });
  });

  // Flush the in-memory batch when the tab goes away; pagehide is the reliable
  // signal (unload is deprecated and skipped by the back/forward cache).
  window.addEventListener('pagehide', () => void log.flush());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      void log.flush();
    }
  });

  const purge = () => {
    sink.purge(Date.now() - RETENTION_MS, MAX_ROWS).catch((error) => {
      nativeConsole.warn('[flightRecorder] purge failed', error);
    });
  };
  purge();
  setInterval(purge, PURGE_INTERVAL_MS);

  log.info('flightRecorder', 'session started', {
    url: window.location.href,
    userAgent: navigator.userAgent,
  });
}
