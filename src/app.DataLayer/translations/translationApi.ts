import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import type { TranslationTable } from '@/app.Commons/i18n/translationTypes';

export const translationApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTranslationTable: builder.query<
      TranslationTable,
      { lang: string; sinceUnixSeconds?: number }
    >({
      query: ({ lang, sinceUnixSeconds }) => ({
        url: `/api/translations/${encodeURIComponent(lang)}`,
        params:
          sinceUnixSeconds === undefined
            ? undefined
            : { since: new Date(sinceUnixSeconds * 1000).toISOString() },
      }),
    }),
    reportUnknownTranslations: builder.mutation<void, string[]>({
      query: (texts) => ({
        url: '/api/translations/report',
        method: 'POST',
        body: { Texts: texts },
      }),
    }),
  }),
});
