/**
 * Hand-written to match dev-ai-console-api's TranslationsController DTOs. Not sourced
 * from apiSchema.d.ts: regenerating it requires running the API locally, which this
 * machine's local_configs points at a real remote database — skipped rather than risk
 * touching it. Regenerate normally once a safe local/dev connection string is available.
 */

/** `Translation` is always null for lang=en (English has no `translation` row) and for
 * any token not yet translated into the requested language — callers fall back to
 * `Text` in both cases, so no special-casing is needed for the English identity table. */
export interface TranslationEntry {
  Text: string;
  Translation: string | null;
}

/** `AsOf` is Unix seconds (this repo's DateTime2UnixSerializer), not an ISO string. */
export interface TranslationTable {
  AsOf: number;
  Tokens: TranslationEntry[];
}

export interface Language {
  Code: string;
  EnglishName: string;
  NativeName: string;
  IsEnabled: boolean;
}

/** Body for POST /api/languages — creates a language, or updates+re-enables one that exists. */
export type CreateLanguage = Language;

/** Admin/translator view of one token in one language — includes TokenId, unlike TranslationEntry. */
export interface TranslationTokenAdmin {
  TokenId: number;
  Text: string;
  Context: string | null;
  Translation: string | null;
  ReportCount: number;
  /** Unix seconds, same as TranslationTable.AsOf. */
  LastSeenAt: number;
}
