type AppConfigOverrides = Partial<{
    APP_UID: string;
    APP_VERSION: string;
    APP_NAME: string;
    BASE_URL: string;

}>;

export class AppConfig {
    private static overrides: AppConfigOverrides = {};

    // Fetches public/config.json (served as-is, not bundled by Vite) so ops
    // can override build-time VITE_* values per-deployment without a rebuild.
    // Missing file/keys silently fall back to the compiled-in defaults.
    public static async init(configUrl = '/config.json'): Promise<void> {
        try {
            const response = await fetch(configUrl);
            if (response.ok) {
                AppConfig.overrides = await response.json();
            }
        } catch {
            AppConfig.overrides = {};
        }
    }

    public static get APP_UID() {
        return AppConfig.overrides.APP_UID ?? import.meta.env.VITE_UID ?? '';
    }
    public static get APP_VERSION() {
        return AppConfig.overrides.APP_VERSION ?? import.meta.env.VITE_VERSION ?? '';
    }
    public static get APP_NAME() {
        return AppConfig.overrides.APP_NAME ?? import.meta.env.VITE_NAME ?? '';
    }
    public static get BASE_URL() {
        return AppConfig.overrides.BASE_URL ?? import.meta.env.VITE_BASE_URL ?? '';
    }

}
