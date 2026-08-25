/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_UID: string;
    readonly VITE_VERSION: string;
    readonly VITE_NAME: string;
    readonly VITE_BASE_URL: string;
    readonly VITE_CHECK_SESSION_URL: string;
    readonly VITE_LOG_UPLOAD_URL: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
