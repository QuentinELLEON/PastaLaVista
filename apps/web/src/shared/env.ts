export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
export const DEFAULT_KIOSK_ID: string = import.meta.env.VITE_DEFAULT_KIOSK_ID ?? 'kiosk-01';
/** Panneau de debug et simulateurs : jamais actifs en production sauf demande explicite. */
export const DEV_TOOLS_ENABLED: boolean =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
