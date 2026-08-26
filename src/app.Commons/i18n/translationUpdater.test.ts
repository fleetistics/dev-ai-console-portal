import { renderHook } from '@testing-library/react';
import i18next from 'i18next';
import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import { store } from '@/app.Commons/dataLayer/store';
import { pollTranslationUpdates, useTranslationUpdater } from './translationUpdater';

const jsonResponse = (data: unknown): Response =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

beforeAll(() => {
  vi.stubEnv('VITE_BASE_URL', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  // pollTranslationUpdates dispatches against the app's real singleton store — reset its
  // RTK Query cache so one test's response never leaks into the next.
  store.dispatch(apiSlice.util.resetApiState());
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('pollTranslationUpdates', () => {
  it('merges a non-empty delta into the live i18next bundle and returns the new cursor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          AsOf: 2000,
          Tokens: [{ Text: 'New string', Translation: 'Cadena nueva' }],
        })
      )
    );
    const addResources = vi.spyOn(i18next, 'addResources').mockImplementation(() => i18next);

    const newAsOf = await pollTranslationUpdates('es', 1000);

    expect(addResources).toHaveBeenCalledWith('es', 'translation', {
      'New string': 'Cadena nueva',
    });
    expect(newAsOf).toBe(2000);
  });

  it('skips the merge call when the delta is empty, but still returns the new cursor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ AsOf: 3000, Tokens: [] })));
    const addResources = vi.spyOn(i18next, 'addResources').mockImplementation(() => i18next);

    const newAsOf = await pollTranslationUpdates('es', 2000);

    expect(addResources).not.toHaveBeenCalled();
    expect(newAsOf).toBe(3000);
  });
});

describe('useTranslationUpdater', () => {
  it('polls on the configured interval and on window focus', async () => {
    vi.useFakeTimers();
    // mockImplementation, not mockResolvedValue: a Response body is a single-use
    // stream, and this test calls fetch more than once — reusing one Response
    // instance would make the 2nd+ calls fail to parse ("body already read"),
    // which the shared retry middleware would then retry several times over,
    // inflating the call count in a way that has nothing to do with what's tested.
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({ AsOf: 999, Tokens: [] })))
    );
    vi.spyOn(i18next, 'language', 'get').mockReturnValue('es');

    const { unmount } = renderHook(() => useTranslationUpdater(1000));

    await vi.advanceTimersByTimeAsync(1000);
    expect(fetch).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event('focus'));
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(2);

    unmount();
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
