import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import { store } from '@/app.Commons/dataLayer/store';
import {
  createTranslationBackend,
  fetchTranslationTable,
  knownEnglishTexts,
} from './translationBackend';
import type { TranslationTable } from './translationTypes';

const jsonResponse = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

beforeAll(() => {
  vi.stubEnv('VITE_BASE_URL', 'http://api.test');
});

afterEach(() => {
  vi.unstubAllGlobals();
  knownEnglishTexts.clear();
  // fetchTranslationTable dispatches against the app's real singleton store (there's no
  // per-test store the way renderApp() gives components) — reset its RTK Query cache so
  // one test's response never leaks into the next.
  store.dispatch(apiSlice.util.resetApiState());
});

afterAll(() => {
  vi.unstubAllEnvs();
});

describe('fetchTranslationTable', () => {
  it('builds the URL with an ISO `since` reconstructed from Unix seconds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ AsOf: 0, Tokens: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await fetchTranslationTable('es', 1700000000);

    // fetchBaseQuery passes a Request instance to fetch(), not a bare URL string.
    const [request] = fetchMock.mock.calls[0] as [Request];
    expect(request.url).toBe(
      'http://api.test/api/translations/es?since=2023-11-14T22%3A13%3A20.000Z'
    );
  });

  it('throws when the response is not ok', async () => {
    // 404, not 500: apiSlice's shared retry middleware retries 5xx up to 3 times with
    // backoff, which would make this test slow (and isn't what's being tested here).
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'not found' }, 404)));

    await expect(fetchTranslationTable('es')).rejects.toThrow();
  });
});

describe('createTranslationBackend', () => {
  it('resolves untranslated entries to their own English text', async () => {
    const table: TranslationTable = {
      AsOf: 100,
      Tokens: [
        { Text: 'Sign in', Translation: 'Iniciar sesión' },
        { Text: 'Cancel', Translation: null },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(table)));
    const backend = createTranslationBackend();

    const bundle = await new Promise((resolve, reject) => {
      backend.read('es', 'translation', (err, data) => (err ? reject(err) : resolve(data)));
    });

    expect(bundle).toEqual({ 'Sign in': 'Iniciar sesión', Cancel: 'Cancel' });
  });

  it('populates knownEnglishTexts from an "en" load', async () => {
    const table: TranslationTable = {
      AsOf: 100,
      Tokens: [
        { Text: 'Sign in', Translation: null },
        { Text: 'Cancel', Translation: null },
      ],
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(table)));
    const backend = createTranslationBackend();

    await new Promise((resolve, reject) => {
      backend.read('en', 'translation', (err, data) => (err ? reject(err) : resolve(data)));
    });

    expect(knownEnglishTexts.has('Sign in')).toBe(true);
    expect(knownEnglishTexts.has('Cancel')).toBe(true);
  });

  it('reports a load error through the callback instead of throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ message: 'not found' }, 404)));
    const backend = createTranslationBackend();

    const error = await new Promise((resolve) => {
      backend.read('es', 'translation', (err) => resolve(err));
    });

    expect(error).toBeInstanceOf(Error);
  });
});
