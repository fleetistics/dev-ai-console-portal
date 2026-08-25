import { safeSerialize } from './safeSerialize';
import { LogEntry, LogLevel, LogSink } from './types';

export interface LoggerOptions {
  sessionId: string;
  sink: LogSink;
  /** Entries kept in memory for instant access when a crash report fires. */
  ringSize?: number;
  /** Pending entries are flushed to the sink at this count… */
  flushBatchSize?: number;
  /** …or after this many ms, whichever comes first. */
  flushIntervalMs?: number;
}

/**
 * Structured logger facade with two tiers:
 *  - an in-memory ring buffer (always current, feeds crash reports synchronously),
 *  - a batched IndexedDB sink (durable across reloads; batching keeps a chatty app
 *    from paying one transaction per line).
 *
 * Every sink interaction is fenced: the recorder must never crash the app it observes.
 */
export class FlightLogger {
  private readonly sessionId: string;
  private readonly sink: LogSink;
  private readonly ringSize: number;
  private readonly flushBatchSize: number;
  private readonly flushIntervalMs: number;

  private ring: LogEntry[] = [];
  private pending: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private enabled = true;

  constructor(options: LoggerOptions) {
    this.sessionId = options.sessionId;
    this.sink = options.sink;
    this.ringSize = options.ringSize ?? 300;
    this.flushBatchSize = options.flushBatchSize ?? 50;
    this.flushIntervalMs = options.flushIntervalMs ?? 2000;
  }

  debug(source: string, message: string, data?: unknown): void {
    this.write('debug', source, message, data);
  }

  info(source: string, message: string, data?: unknown): void {
    this.write('info', source, message, data);
  }

  warn(source: string, message: string, data?: unknown): void {
    this.write('warn', source, message, data);
  }

  error(source: string, message: string, data?: unknown): void {
    this.write('error', source, message, data);
  }

  /** Kill switch: stops recording without touching already-stored entries. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /** Most recent entries, oldest first — for attaching to crash reports instantly. */
  recentEntries(): LogEntry[] {
    return [...this.ring];
  }

  /** Force-persist pending entries; called on pagehide and before uploads. */
  flush(): Promise<void> {
    if (this.flushTimer !== null) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.pending.length === 0) {
      return Promise.resolve();
    }
    const batch = this.pending;
    this.pending = [];
    // Failures are absorbed: losing a batch of logs is acceptable, breaking the app is not.
    return this.sink.addBatch(batch).catch(() => {});
  }

  private write(level: LogLevel, source: string, message: string, data?: unknown): void {
    if (!this.enabled) {
      return;
    }
    try {
      const entry: LogEntry = {
        ts: Date.now(),
        sessionId: this.sessionId,
        level,
        source,
        message: message.length > 4000 ? `${message.slice(0, 4000)}…` : message,
        data: data === undefined ? undefined : safeSerialize(data),
      };

      this.ring.push(entry);
      if (this.ring.length > this.ringSize) {
        this.ring = this.ring.slice(-this.ringSize);
      }

      this.pending.push(entry);
      if (this.pending.length >= this.flushBatchSize) {
        void this.flush();
      } else if (this.flushTimer === null) {
        this.flushTimer = setTimeout(() => {
          this.flushTimer = null;
          void this.flush();
        }, this.flushIntervalMs);
      }
    } catch {
      // Serialization/logging problems are deliberately silent.
    }
  }
}
