import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getErrorMessage } from '@/app.Commons/dataLayer/apiError';
import { store } from '@/app.Commons/dataLayer/store';
import { translationApi } from '@/app.DataLayer/translations/translationApi';
import { createTranslationBackend, ENGLISH, knownEnglishTexts } from './translationBackend';
import { TRANSLATION_NAMESPACE } from './translationUpdater';
import { createUnknownStringReporter, type UnknownStringReporter } from './unknownStringReporter';

const STORAGE_KEY = 'language';

const getStoredLanguage = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ENGLISH;
  } catch {
    return ENGLISH;
  }
};

// Goes through the shared apiSlice rather than a bare fetch(), same reasoning as
// translationBackend.ts's fetchTranslationTable: automatic retry-on-5xx and the
// W3C trace-context header this app's other requests get for free. Called by
// unknownStringReporter's timer/visibilitychange flush, never from a render, so
// initiate() (RTK Query's supported non-hook dispatch) is used instead of a hook.
async function reportUnknownTranslations(texts: string[]): Promise<void> {
  try {
    await store
      .dispatch(translationApi.endpoints.reportUnknownTranslations.initiate(texts))
      .unwrap();
  } catch (error) {
    throw new Error(`Failed to report unknown translations: ${getErrorMessage(error)}`);
  }
}

let reporter: UnknownStringReporter | null = null;

/** Called once from main.tsx, before the app renders — never from a test. */
export function initI18n(): void {
  reporter = createUnknownStringReporter({ report: reportUnknownTranslations });

  void i18next
    .use(createTranslationBackend())
    .use(initReactI18next)
    .init({
      lng: getStoredLanguage(),
      // Every bundle already resolves an untranslated entry to its own English text at
      // load time (see translationBackend's toResourceBundle), so i18next's own
      // fallback-language chain would never have anything left to add.
      fallbackLng: false,
      defaultNS: TRANSLATION_NAMESPACE,
      interpolation: { escapeValue: false },
      saveMissing: true,
      // A key i18next can't find is, by construction, a token absent from the loaded
      // bundle entirely — the known-but-untranslated case never reaches here, it's
      // already resolved to English text inside the bundle. knownEnglishTexts is a
      // belt-and-suspenders re-check against a possibly-stale bundle, not the primary
      // signal.
      missingKeyHandler: (_lngs, _ns, key) => {
        if (!knownEnglishTexts.has(key)) {
          reporter?.addUnknown(key);
        }
      },
    });
}

/** Switches the active language and persists the choice for next launch. */
export function changeLanguage(code: string): Promise<unknown> {
  try {
    localStorage.setItem(STORAGE_KEY, code);
  } catch {
    // localStorage unavailable (private-mode quirks) — the switch still applies for
    // this session via i18next's own in-memory state.
  }
  return i18next.changeLanguage(code);
}
