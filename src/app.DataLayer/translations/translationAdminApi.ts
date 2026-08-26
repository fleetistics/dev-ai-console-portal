import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import type { TranslationEntry, TranslationTokenAdmin } from '@/app.Commons/i18n/translationTypes';

export const translationAdminApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTranslationTokens: builder.query<TranslationTokenAdmin[], string>({
      query: (lang) => `/api/translations/${lang}/tokens`,
      providesTags: (result, _error, lang) =>
        result
          ? [
              ...result.map((token) => ({ type: 'TranslationToken' as const, id: token.TokenId })),
              { type: 'TranslationToken' as const, id: `LIST-${lang}` },
            ]
          : [{ type: 'TranslationToken' as const, id: `LIST-${lang}` }],
    }),
    setTranslation: builder.mutation<
      TranslationEntry,
      { lang: string; tokenId: number; translatedText: string | null }
    >({
      query: ({ lang, tokenId, translatedText }) => ({
        url: `/api/translations/${lang}/${tokenId}`,
        method: 'PATCH',
        body: { TranslatedText: translatedText },
      }),
      invalidatesTags: (_result, _error, { tokenId }) => [
        { type: 'TranslationToken', id: tokenId },
      ],
    }),
  }),
});

export const { useGetTranslationTokensQuery, useSetTranslationMutation } = translationAdminApi;

/** Alias for the RTK-generated `useGetTranslationTokensQuery`. */
export const useGetTranslationTokens = useGetTranslationTokensQuery;

/** Alias for the RTK-generated `useSetTranslationMutation`. */
export const useSetTranslation = useSetTranslationMutation;
