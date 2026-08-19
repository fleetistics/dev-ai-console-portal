import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from '@reduxjs/toolkit/query/react';
import { AppConfig } from '@/app.Impl/configs/AppConfig';

export const AUTH_REFRESH_URI = '/api/auth/Refresh';

/**
 * In-memory holder for the .NET bearer token.
 *
 * Deliberately NOT persisted to localStorage/sessionStorage: a module variable is
 * unreachable to injected script in a way storage is not, and it cannot leak across
 * tabs. The cost is that a page reload starts with no token — which is fine, because
 * the httpOnly refresh cookie lets AUTH_REFRESH_URI mint a new one on the first 401.
 */
export class AuthToken {
  static jwtToken: string | null = null;

  static set(token: string | null) {
    AuthToken.jwtToken = token;
  }

  static clear() {
    AuthToken.jwtToken = null;
  }
}

/**
 * Fires when the session is unrecoverable: refresh failed, or a retry with a freshly
 * minted token still came back 401. Wire this to your logout/redirect-to-login path.
 */
type AuthLostHandler = () => void;
let authLostHandler: AuthLostHandler | null = null;
export const setOnAuthLost = (handler: AuthLostHandler | null) => {
  authLostHandler = handler;
};

const notifyAuthLost = () => {
  AuthToken.clear();
  authLostHandler?.();
};

let rawBaseQuery:
  | BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>
  | undefined;

/**
 * Built on first request rather than at module scope: AppConfig.BASE_URL is only
 * populated once AppConfig.init() resolves in main.tsx, which happens *after* this
 * module is evaluated. Reading it eagerly would bake in the empty fallback and every
 * request would go to a relative URL.
 */
const getRawBaseQuery = () => {
  rawBaseQuery ??= fetchBaseQuery({
    baseUrl: AppConfig.BASE_URL,
    credentials: 'include',
    timeout: 60000,
    prepareHeaders: (headers) => {
      if (AuthToken.jwtToken) {
        headers.set('Authorization', `Bearer ${AuthToken.jwtToken}`);
      }
      return headers;
    },
  });
  return rawBaseQuery;
};

const urlOf = (args: string | FetchArgs) => (typeof args === 'string' ? args : args.url);

type RefreshApi = Parameters<
  BaseQueryFn<string | FetchArgs, unknown, FetchBaseQueryError, {}, FetchBaseQueryMeta>
>[1];

const doRefresh = async (api: RefreshApi, extraOptions: {}): Promise<boolean> => {
  const result = await getRawBaseQuery()(
    { url: AUTH_REFRESH_URI, method: 'POST' },
    api,
    extraOptions
  );

  if (!result.data || typeof result.data !== 'string') {
    AuthToken.clear();
    return false;
  }

  AuthToken.set(result.data);
  return true;
};

/**
 * Single-flight latch. Without it, N queries in flight when the token expires would
 * each fire their own refresh — the server invalidates the old refresh cookie on the
 * first one, so the rest fail and log the user out spuriously.
 */
let refreshInFlight: Promise<boolean> | null = null;

const refreshAccessToken = (api: RefreshApi, extraOptions: {}): Promise<boolean> => {
  if (!refreshInFlight) {
    refreshInFlight = doRefresh(api, extraOptions);
    // Release the latch once settled so a later expiry can refresh again.
    void refreshInFlight.finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
};

export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError,
  {},
  FetchBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await getRawBaseQuery()(args, api, extraOptions);

  if (result.error?.status !== 401) {
    return result;
  }

  // A 401 from the refresh endpoint itself means the cookie is gone or expired.
  // Refreshing again would recurse; there is nothing left to recover from.
  if (urlOf(args) === AUTH_REFRESH_URI) {
    notifyAuthLost();
    return result;
  }

  const refreshed = await refreshAccessToken(api, extraOptions);
  if (!refreshed) {
    notifyAuthLost();
    return result;
  }

  // prepareHeaders re-reads AuthToken.jwtToken, so this retry carries the new token.
  const retried = await getRawBaseQuery()(args, api, extraOptions);
  if (retried.error?.status === 401) {
    notifyAuthLost();
  }
  return retried;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  // Every tag type must be declared here — injectEndpoints() cannot add new ones later.
  tagTypes: ['User'],
  endpoints: () => ({}),
});
