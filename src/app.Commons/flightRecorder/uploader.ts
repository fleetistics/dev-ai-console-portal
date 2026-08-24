import { AuthToken } from '@/app.Commons/dataLayer/apiSlice';
import { AppConfig } from '@/app.Impl/configs/AppConfig';
import { nativeConsole } from './captureGlobals';
import { FlightLogger } from './logger';
import { LogEntry, LogSink } from './types';

export type UploadTrigger = 'user' | 'crash' | 'route-error';

export interface UploadOptions {
  trigger: UploadTrigger;
  /** Free-text comment from the "Report a problem" dialog. */
  comment?: string;
  /** How far back to read from the store; defaults to the full retention window. */
  windowMs?: number;
}

const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const CRASH_WINDOW_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 20000;
const MAX_PAYLOAD_BYTES = 4 * 1024 * 1024; // pre-gzip; logs compress 10-20x
const AUTO_UPLOAD_THROTTLE_MS = 5 * 60 * 1000;
const THROTTLE_KEY = 'flightRecorder.lastAutoUpload';

const uploadUrl = (): string => AppConfig.LOG_UPLOAD_URL || `${AppConfig.BASE_URL}/api/logs/client`;

const gzip = async (text: string): Promise<Blob | null> => {
  if (typeof CompressionStream === 'undefined') {
    return null;
  }
  try {
    const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'));
    return await new Response(stream).blob();
  } catch {
    return null;
  }
};

const buildBody = (entries: LogEntry[], sessionId: string, options: UploadOptions): string =>
  JSON.stringify({
    meta: {
      app: AppConfig.APP_NAME,
      version: AppConfig.APP_VERSION,
      sessionId,
      trigger: options.trigger,
      comment: options.comment ?? null,
      url: window.location.href,
      userAgent: navigator.userAgent,
      sentAt: new Date().toISOString(),
      entryCount: entries.length,
    },
    entries,
  });

export class LogUploader {
  constructor(
    private readonly logger: FlightLogger,
    private readonly sink: LogSink,
    private readonly sessionId: string
  ) {}

  /**
   * Reads the requested window from IndexedDB (falling back to the in-memory ring if
   * the store is unreadable), gzips it when the browser can, and POSTs it. Returns
   * success so the UI can tell the user whether their report actually left the device.
   */
  async upload(options: UploadOptions): Promise<boolean> {
    try {
      await this.logger.flush();

      const fromTs = Date.now() - (options.windowMs ?? RETENTION_MS);
      let entries: LogEntry[] = [];
      try {
        entries = await this.sink.getSince(fromTs, MAX_ENTRIES, MAX_PAYLOAD_BYTES);
      } catch {
        entries = this.logger.recentEntries();
      }
      if (entries.length === 0) {
        entries = this.logger.recentEntries();
      }

      const body = buildBody(entries, this.sessionId, options);
      const compressed = await gzip(body);

      const headers: Record<string, string> = {
        'Content-Type': compressed ? 'application/gzip' : 'application/json',
      };
      if (AuthToken.jwtToken) {
        headers.Authorization = `Bearer ${AuthToken.jwtToken}`;
      }

      const payload = compressed ?? body;
      const payloadSize = compressed ? compressed.size : body.length;

      const response = await fetch(uploadUrl(), {
        method: 'POST',
        headers,
        body: payload,
        credentials: 'include',
        // keepalive lets a crash-path upload survive tab close, but browsers cap
        // keepalive bodies at ~64KB — larger reports use a regular request.
        keepalive: payloadSize < 60 * 1024,
      });
      return response.ok;
    } catch (error) {
      // nativeConsole: reporting a failed report through the patched console would
      // append yet more entries to the very store that just failed to upload.
      nativeConsole.warn('[flightRecorder] log upload failed', error);
      return false;
    }
  }

  /**
   * Crash-path upload: last 15 minutes, at most once per 5 minutes per origin.
   * An error loop firing on every render must not turn into an upload loop.
   */
  autoUpload(trigger: Exclude<UploadTrigger, 'user'>): void {
    try {
      const last = Number(localStorage.getItem(THROTTLE_KEY) ?? 0);
      if (Date.now() - last < AUTO_UPLOAD_THROTTLE_MS) {
        return;
      }
      localStorage.setItem(THROTTLE_KEY, String(Date.now()));
    } catch {
      // localStorage unavailable (private mode quirks) — throttle best-effort only.
    }
    void this.upload({ trigger, windowMs: CRASH_WINDOW_MS });
  }
}
