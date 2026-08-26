const DEFAULT_FLUSH_INTERVAL_MS = 30000;

export interface UnknownStringReporterOptions {
  /** POSTs a batch to the server; a rejection puts the batch back for the next flush. */
  report: (texts: string[]) => Promise<void>;
  flushIntervalMs?: number;
}

export interface UnknownStringReporter {
  addUnknown(text: string): void;
  flush(): Promise<void>;
  dispose(): void;
}

/**
 * Dedup-and-periodic-flush batching for strings the client's t() couldn't find,
 * matching this repo's flight-recorder logger's shape but deliberately simpler: an
 * in-memory Set (not IndexedDB-persisted), flushed on a timer and on the tab going
 * hidden. Losing a not-yet-reported string on a hard refresh is fine — it gets caught
 * again the next time that code path renders, so persistence isn't worth the complexity
 * here the way it is for crash logs.
 */
export function createUnknownStringReporter(
  options: UnknownStringReporterOptions
): UnknownStringReporter {
  const pending = new Set<string>();

  const flush = async (): Promise<void> => {
    if (pending.size === 0) {
      return;
    }
    const texts = Array.from(pending);
    pending.clear();
    try {
      await options.report(texts);
    } catch {
      texts.forEach((text) => pending.add(text));
    }
  };

  const intervalId = setInterval(
    () => void flush(),
    options.flushIntervalMs ?? DEFAULT_FLUSH_INTERVAL_MS
  );

  const onVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      void flush();
    }
  };
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    addUnknown(text: string) {
      pending.add(text);
    },
    flush,
    dispose() {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
