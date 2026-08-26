import { apiSlice } from '@/app.Commons/dataLayer/apiSlice';
import type { CreateLanguage, Language } from '@/app.Commons/i18n/translationTypes';

export const languageApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLanguages: builder.query<Language[], void>({
      query: () => '/api/languages',
      providesTags: [{ type: 'Language', id: 'LIST' }],
    }),
    // Admin view: includes disabled languages, unlike getLanguages.
    getAllLanguages: builder.query<Language[], void>({
      query: () => '/api/languages/all',
      providesTags: [{ type: 'Language', id: 'LIST' }],
    }),
    createOrEnableLanguage: builder.mutation<Language, CreateLanguage>({
      query: (data) => ({ url: '/api/languages', method: 'POST', body: data }),
      invalidatesTags: [{ type: 'Language', id: 'LIST' }],
    }),
  }),
});

export const { useGetLanguagesQuery, useGetAllLanguagesQuery, useCreateOrEnableLanguageMutation } =
  languageApi;

/** Alias for the RTK-generated `useGetLanguagesQuery`. */
export const useGetLanguages = useGetLanguagesQuery;

/** Alias for the RTK-generated `useGetAllLanguagesQuery`. */
export const useGetAllLanguages = useGetAllLanguagesQuery;

/** Alias for the RTK-generated `useCreateOrEnableLanguageMutation`. */
export const useCreateOrEnableLanguage = useCreateOrEnableLanguageMutation;
