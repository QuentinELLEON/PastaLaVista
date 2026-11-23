/** Dimensions de la borne de référence (portrait), mise à l'échelle de la fenêtre. */
export const KIOSK_WIDTH_PX = 810;
export const KIOSK_HEIGHT_PX = 1440;

/** Écran étroit : un indice parmi d'autres pour détecter un smartphone, jamais le seul. */
export const NARROW_VIEWPORT_MAX_PX = 600;

export const LOGIN_POLL_INTERVAL_MS = 1500;
export const ADAPTATION_TICK_MS = 1000;
export const DONE_SCREEN_RESET_MS = 30_000;
export const STAFF_CALLED_NOTICE_MS = 6000;

export const STORAGE_KEYS = {
  phoneSession: 'plv.phone.session',
  kioskMode: 'plv.kioskMode',
  kioskId: 'plv.kioskId',
  /** Outil de développement : dernier QR code affiché sur un smartphone (simulation de scan). */
  devLastDraft: 'plv.dev.lastDraft',
} as const;

/** kiosk : identifiant de borne porté par le QR code de connexion (donc appareil = smartphone) ; kioskMode : borne configurée en mode kiosque. */
export const QUERY_PARAMS = {
  kiosk: 'kiosk',
  kioskMode: 'kioskMode',
  session: 'session',
  token: 'token',
} as const;
