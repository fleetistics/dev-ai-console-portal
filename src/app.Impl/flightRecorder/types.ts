export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  /** Auto-increment key, assigned by IndexedDB on insert. */
  id?: number;
  /** Epoch milliseconds. */
  ts: number;
  /** One id per page load, so interleaved logs from several tabs stay separable. */
  sessionId: string;
  level: LogLevel;
  /** Origin tag: a module name for facade calls, 'console' / 'global' for captured ones. */
  source: string;
  message: string;
  /** Safe-serialized JSON payload, already redacted and size-capped. */
  data?: string;
}

/**
 * Persistence backend for the logger. IndexedDB in the app; tests inject a stub,
 * and environments without IndexedDB get a no-op.
 */
export interface LogSink {
  addBatch(entries: LogEntry[]): Promise<void>;
  /** Entries with ts >= fromTs, oldest first, bounded by count and approximate bytes. */
  getSince(fromTs: number, maxCount: number, maxBytes: number): Promise<LogEntry[]>;
  /** Drop entries older than beforeTs and trim the store down to maxRows. */
  purge(beforeTs: number, maxRows: number): Promise<void>;
}
