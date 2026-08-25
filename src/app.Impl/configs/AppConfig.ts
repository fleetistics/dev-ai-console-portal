/**
 * Build-time application configuration, read from VITE_* environment variables
 * (.env files or the build environment). Values are baked into the bundle at
 * build time — a per-deployment change means a rebuild.
 */
export class AppConfig {
  public static get APP_UID() {
    return import.meta.env.VITE_UID ?? '';
  }
  public static get APP_VERSION() {
    return import.meta.env.VITE_VERSION ?? '';
  }
  public static get APP_NAME() {
    return import.meta.env.VITE_NAME ?? '';
  }
  public static get BASE_URL() {
    return import.meta.env.VITE_BASE_URL ?? '';
  }
  // Endpoint for client-side diagnostic log uploads (flight recorder).
  // Empty means the default `${BASE_URL}/api/client-log`.
  public static get LOG_UPLOAD_URL() {
    return import.meta.env.VITE_LOG_UPLOAD_URL ?? '';
  }
}
