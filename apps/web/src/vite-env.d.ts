/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_DEFAULT_KIOSK_ID?: string;
  readonly VITE_ENABLE_DEV_TOOLS?: string;
  readonly VITE_KIOSK_MODE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
