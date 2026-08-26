import { useEffect, useRef } from 'react';
import i18next from 'i18next';
import { fetchTranslationTable } from './translationBackend';

export const DEFAULT_POLL_INTERVAL_MS = 5 * 60 * 1000;
export const TRANSLATION_NAMESPACE = 'translation';

/**
 * One poll: fetches only what changed since `sinceUnixSeconds` and merges it into the
 * live i18next resource bundle (addResources patches keys in place — components using
 * useTranslation re-render automatically, no reload needed). Returns the new cursor
 * for the next call; callers should keep using the old cursor if this rejects.
 */
export async function pollTranslationUpdates(
  language: string,
  sinceUnixSeconds: number
): Promise<number> {
  const table = await fetchTranslationTable(language, sinceUnixSeconds);
  if (table.Tokens.length > 0) {
    const resources = Object.fromEntries(
      table.Tokens.map((entry) => [entry.Text, entry.Translation ?? entry.Text])
    );
    i18next.addResources(language, TRANSLATION_NAMESPACE, resources);
  }
  return table.AsOf;
}

/**
 * Background updater: NOT a Web Worker (no CPU-heavy work here, just an occasional
 * fetch-and-merge) — a plain interval, same style as useColorScheme. Mount once at the
 * app root. Polls on a timer plus an immediate extra poll whenever the tab regains
 * focus/visibility, so a session left in a background tab catches up right away
 * instead of waiting out the rest of the interval.
 */
export function useTranslationUpdater(intervalMs: number = DEFAULT_POLL_INTERVAL_MS): void {
  const sinceRef = useRef(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const poll = (): void => {
      const language = i18next.language;
      if (!language) {
        return;
      }
      pollTranslationUpdates(language, sinceRef.current)
        .then((asOf) => {
          sinceRef.current = asOf;
        })
        .catch(() => {
          // Best-effort — the next tick retries from the same cursor.
        });
    };

    const intervalId = setInterval(poll, intervalMs);

    const onVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') {
        poll();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', poll);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('focus', poll);
    };
  }, [intervalMs]);
}
