import { apiSlice, AuthToken } from '@/app.Commons/dataLayer/apiSlice';
import { changeLanguage } from '@/app.Commons/i18n/i18n';
import { AppConfig } from '@/app.Impl/configs/AppConfig';
import { USER_SESSION_CHECK_SESSION_URI, USER_SESSION_LOGIN_URI } from './userSessionConst';
import type { LoginData, UserSessionCheckResponse } from './userSessionDto';

/**
 * Session endpoints on the same RTK Query slice as the rest of the app: one data
 * layer, one error model, and every request gets the shared base-query behavior
 * (bearer header, traceparent, retry policy). apiSlice special-cases these URIs so
 * their 401s read as "not signed in" instead of triggering a token refresh.
 */
export const userSessionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    checkSession: builder.query<UserSessionCheckResponse, void>({
      query: () => ({
        url: USER_SESSION_CHECK_SESSION_URI,
        method: 'POST',
        // The server binds AppVersionInfo straight from the body — no wrapper object.
        body: {
          AppUid: AppConfig.APP_UID,
          AppVersion: AppConfig.APP_VERSION,
        },
      }),
      // Seed the bearer token every ordinary request depends on — on initial load
      // and on every refetch (login, auth-lost recheck). Also the one place the
      // server's PreferredLanguage is pulled: login.tsx's reloadSessionFunc refetches
      // this same query, so a fresh login already flows through here too, not just
      // app-start — it's the source of truth once authenticated, overriding whatever
      // localStorage had (a different device, or a browser profile switch).
      onQueryStarted: async (_arg, { queryFulfilled }) => {
        try {
          const { data } = await queryFulfilled;
          AuthToken.set(data.accessToken);
          if (data.preferredLanguage) {
            void changeLanguage(data.preferredLanguage);
          }
        } catch {
          // 401 / network failure: stay logged out; the provider renders the login UI.
        }
      },
    }),

    login: builder.mutation<UserSessionCheckResponse, LoginData>({
      query: (credentials) => ({
        url: USER_SESSION_LOGIN_URI,
        method: 'POST',
        body: credentials,
      }),
    }),
  }),
});

export const { useCheckSessionQuery, useLoginMutation } = userSessionApi;
