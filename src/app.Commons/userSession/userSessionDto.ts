export type UserSessionCheckResponse = {
  accessToken: string;
  userId: number;
  sessionId: number;
  /** Null when the user has never set one — the client keeps using localStorage's value. */
  preferredLanguage: string | null;
};
export type AppVersionInfo = {
  AppUid: string;
  AppVersion: string;
};
export type LoginData = {
  UserName: string;
  Password: string;
  RememberMe: boolean;
};
