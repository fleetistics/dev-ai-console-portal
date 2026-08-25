export type UserSessionCheckResponse = {
  accessToken: string;
  userId: number;
  sessionId: number;
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
