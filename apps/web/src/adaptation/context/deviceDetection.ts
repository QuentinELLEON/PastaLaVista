import type { Device } from '@pastalavista/shared';
import { NARROW_VIEWPORT_MAX_PX } from '../../shared/constants';

export interface DeviceSignals {
  pathname: string;
  /** Appareil configuré en mode borne (variable de build ou paramètre de provisionnement). */
  kioskModeConfigured: boolean;
  /** Identifiant de borne lu dans l'URL : porté par le QR code que la borne affiche. */
  kioskIdFromQr: string | null;
  coarsePointer: boolean;
  viewportWidth: number;
  /** Surcharge du panneau de debug. */
  override: Device | null;
}

export type DeviceReason =
  'override' | 'kiosk-mode' | 'kiosk-id-in-url' | 'route' | 'touch-and-narrow' | 'default';

export interface DeviceDetection {
  device: Device;
  reason: DeviceReason;
}

/**
 * Détection de l'appareil (context.md 8.4). Ordre : surcharge de dev > mode borne configuré
 * > identifiant de borne dans l'URL (QR code : on est sur un smartphone) > route explicite
 * > écran tactile ET étroit. La taille d'écran seule ne décide JAMAIS.
 */
export function detectDevice(signals: DeviceSignals): DeviceDetection {
  if (signals.override) return { device: signals.override, reason: 'override' };
  if (signals.kioskModeConfigured) return { device: 'kiosk', reason: 'kiosk-mode' };
  if (signals.kioskIdFromQr) return { device: 'smartphone', reason: 'kiosk-id-in-url' };
  if (signals.pathname.startsWith('/kiosk')) return { device: 'kiosk', reason: 'route' };
  if (signals.pathname === '/m' || signals.pathname.startsWith('/m/')) {
    return { device: 'smartphone', reason: 'route' };
  }
  if (signals.coarsePointer && signals.viewportWidth <= NARROW_VIEWPORT_MAX_PX) {
    return { device: 'smartphone', reason: 'touch-and-narrow' };
  }
  return { device: 'kiosk', reason: 'default' };
}

export function readDeviceSignals(
  pathname: string,
  search: string,
  override: Device | null,
): DeviceSignals {
  const params = new URLSearchParams(search);
  return {
    pathname,
    kioskModeConfigured: import.meta.env.VITE_KIOSK_MODE === 'true' || params.has('kioskMode'),
    kioskIdFromQr: params.get('kiosk'),
    coarsePointer:
      typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches,
    viewportWidth: window.innerWidth,
    override,
  };
}
