import { STORAGE_KEYS } from '../shared/constants';
import { DEV_TOOLS_ENABLED } from '../shared/env';
import { useT } from '../state/SessionProvider';
import { Button } from '../ui/shared/Button';

/**
 * Simulateurs de matériel absent (caméra de la borne, smartphone du client) : OUTILS DE DÉMONSTRATION,
 * jamais rendus en production sauf demande explicite (VITE_ENABLE_DEV_TOOLS).
 */

/** Le smartphone mémorise le dernier QR code affiché pour que la borne puisse « le scanner » dans le même navigateur. */
export function rememberTicketForDev(token: string): void {
  if (!DEV_TOOLS_ENABLED) return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.devLastDraft, token);
  } catch {
    // Pas de stockage : la saisie du code reste disponible
  }
}

export function readTicketForDev(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEYS.devLastDraft);
  } catch {
    return null;
  }
}

interface ScanProps {
  onScan: (token: string) => void;
  onNothingToScan: () => void;
}

/** Simule la lecture du QR code affiché par le smartphone (aucune caméra nécessaire). */
export function SimulateTicketScan({ onScan, onNothingToScan }: ScanProps) {
  const t = useT();
  if (!DEV_TOOLS_ENABLED) return null;
  return (
    <Button
      onClick={() => {
        const token = readTicketForDev();
        if (token) onScan(token);
        else onNothingToScan();
      }}
    >
      {t('retrieve.simulate')}
    </Button>
  );
}

/** Rend un appui « simuler » (par exemple scanner le QR de connexion) visible seulement avec les outils de dev. */
export function DevOnly({ children }: { children: React.ReactNode }) {
  return DEV_TOOLS_ENABLED ? <>{children}</> : null;
}
