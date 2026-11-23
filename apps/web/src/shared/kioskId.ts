import { QUERY_PARAMS, STORAGE_KEYS } from './constants';
import { DEFAULT_KIOSK_ID } from './env';

/**
 * Identifiant de la borne : fourni au provisionnement par `?kioskMode=<id>`, conservé le temps de la session
 * du navigateur, sinon valeur par défaut de la configuration.
 */
export function getKioskId(search: string = window.location.search): string {
  const fromUrl = new URLSearchParams(search).get(QUERY_PARAMS.kioskMode);
  try {
    if (fromUrl) {
      window.sessionStorage.setItem(STORAGE_KEYS.kioskId, fromUrl);
      return fromUrl;
    }
    return window.sessionStorage.getItem(STORAGE_KEYS.kioskId) ?? DEFAULT_KIOSK_ID;
  } catch {
    return fromUrl ?? DEFAULT_KIOSK_ID;
  }
}
