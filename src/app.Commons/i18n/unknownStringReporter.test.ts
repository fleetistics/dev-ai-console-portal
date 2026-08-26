import { createUnknownStringReporter } from './unknownStringReporter';

describe('createUnknownStringReporter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  });

  it('dedupes repeated unknowns and flushes them together on the timer', async () => {
    const report = vi.fn().mockResolvedValue(undefined);
    const reporter = createUnknownStringReporter({ report, flushIntervalMs: 1000 });

    reporter.addUnknown('Sign in');
    reporter.addUnknown('Sign in');
    reporter.addUnknown('Cancel');

    expect(report).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1000);

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(expect.arrayContaining(['Sign in', 'Cancel']));
    expect(report.mock.calls[0][0]).toHaveLength(2);

    reporter.dispose();
  });

  it('flushes immediately when the tab becomes hidden', async () => {
    const report = vi.fn().mockResolvedValue(undefined);
    const reporter = createUnknownStringReporter({ report, flushIntervalMs: 60000 });

    reporter.addUnknown('Save');
    Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await Promise.resolve();

    expect(report).toHaveBeenCalledWith(['Save']);

    reporter.dispose();
  });

  it('does not call report when nothing is pending', async () => {
    const report = vi.fn().mockResolvedValue(undefined);
    const reporter = createUnknownStringReporter({ report, flushIntervalMs: 1000 });

    await vi.advanceTimersByTimeAsync(1000);

    expect(report).not.toHaveBeenCalled();
    reporter.dispose();
  });

  it('puts texts back for the next flush when report fails', async () => {
    const report = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValue(undefined);
    const reporter = createUnknownStringReporter({ report, flushIntervalMs: 1000 });

    reporter.addUnknown('Retry me');
    await vi.advanceTimersByTimeAsync(1000);
    expect(report).toHaveBeenNthCalledWith(1, ['Retry me']);

    await vi.advanceTimersByTimeAsync(1000);
    expect(report).toHaveBeenNthCalledWith(2, ['Retry me']);

    reporter.dispose();
  });

  it('stops flushing after dispose', async () => {
    const report = vi.fn().mockResolvedValue(undefined);
    const reporter = createUnknownStringReporter({ report, flushIntervalMs: 1000 });

    reporter.addUnknown('Too late');
    reporter.dispose();
    await vi.advanceTimersByTimeAsync(5000);

    expect(report).not.toHaveBeenCalled();
  });
});
