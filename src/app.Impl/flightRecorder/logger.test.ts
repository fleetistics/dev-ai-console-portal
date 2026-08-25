import { FlightLogger } from './logger';
import { LogEntry, LogSink } from './types';

class StubSink implements LogSink {
  batches: LogEntry[][] = [];
  failNext = false;

  async addBatch(entries: LogEntry[]): Promise<void> {
    if (this.failNext) {
      this.failNext = false;
      throw new Error('sink down');
    }
    this.batches.push(entries);
  }

  async getSince(): Promise<LogEntry[]> {
    return this.batches.flat();
  }

  async purge(): Promise<void> {}
}

const makeLogger = (sink: StubSink, overrides = {}) =>
  new FlightLogger({
    sessionId: 'test-session',
    sink,
    flushBatchSize: 3,
    flushIntervalMs: 1000,
    ringSize: 5,
    ...overrides,
  });

describe('FlightLogger', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stamps entries with level, source and sessionId', () => {
    const sink = new StubSink();
    const logger = makeLogger(sink);
    logger.warn('checkout', 'low stock', { sku: 'A1' });

    const [entry] = logger.recentEntries();
    expect(entry.level).toBe('warn');
    expect(entry.source).toBe('checkout');
    expect(entry.message).toBe('low stock');
    expect(entry.sessionId).toBe('test-session');
    expect(JSON.parse(entry.data!)).toEqual({ sku: 'A1' });
  });

  it('flushes when the batch size is reached, without waiting for the timer', async () => {
    const sink = new StubSink();
    const logger = makeLogger(sink);
    logger.info('a', '1');
    logger.info('a', '2');
    expect(sink.batches).toHaveLength(0);
    logger.info('a', '3');
    await vi.runAllTimersAsync();
    expect(sink.batches).toHaveLength(1);
    expect(sink.batches[0]).toHaveLength(3);
  });

  it('flushes on the interval timer when below batch size', async () => {
    const sink = new StubSink();
    const logger = makeLogger(sink);
    logger.info('a', 'only one');
    expect(sink.batches).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1000);
    expect(sink.batches).toHaveLength(1);
  });

  it('keeps only the last ringSize entries in memory', () => {
    const logger = makeLogger(new StubSink());
    for (let i = 0; i < 10; i += 1) {
      logger.info('a', `msg ${i}`);
    }
    const ring = logger.recentEntries();
    expect(ring).toHaveLength(5);
    expect(ring[0].message).toBe('msg 5');
    expect(ring[4].message).toBe('msg 9');
  });

  it('records nothing when disabled', async () => {
    const sink = new StubSink();
    const logger = makeLogger(sink);
    logger.setEnabled(false);
    logger.error('a', 'ignored');
    await vi.runAllTimersAsync();
    expect(logger.recentEntries()).toHaveLength(0);
    expect(sink.batches).toHaveLength(0);
  });

  it('survives a failing sink and keeps logging afterwards', async () => {
    const sink = new StubSink();
    const logger = makeLogger(sink);
    sink.failNext = true;
    logger.info('a', 'lost');
    await expect(logger.flush()).resolves.toBeUndefined();

    logger.info('a', 'kept');
    await logger.flush();
    expect(sink.batches.flat().map((e) => e.message)).toEqual(['kept']);
  });

  it('flush() is a no-op with nothing pending', async () => {
    const sink = new StubSink();
    await makeLogger(sink).flush();
    expect(sink.batches).toHaveLength(0);
  });
});
