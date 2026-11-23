import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { detectDevice, readDeviceSignals } from '../adaptation/context/deviceDetection';
import {
  AdaptationProvider,
  useAdaptation,
  type AdaptationInputs,
} from '../adaptation/provider/AdaptationProvider';
import { useDeviceOverride } from '../dev/DeviceOverride';
import { CatalogProvider } from '../state/CatalogProvider';
import { useSession } from '../state/SessionProvider';

/** Reporte la configuration d'IHM sur le document : contraste élevé et langue (accessibilité d'abord). */
function ThemeSync() {
  const { config } = useAdaptation();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.contrast = config.presentation.highContrast ? 'high' : 'normal';
    root.lang = config.language;
  }, [config.presentation.highContrast, config.language]);
  return null;
}

/** Quand le panneau de debug force un autre appareil, on bascule sur la disposition correspondante (état conservé). */
function DeviceRedirect({ device }: { device: 'kiosk' | 'smartphone' }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { override } = useDeviceOverride();
  const previous = useRef(override);
  useEffect(() => {
    if (previous.current === override) return;
    previous.current = override;
    if (!override) return;
    const onKioskRoute = pathname.startsWith('/kiosk');
    if (device === 'kiosk' && !onKioskRoute) navigate('/kiosk');
    if (device === 'smartphone' && onKioskRoute) navigate('/m');
  }, [override, device, pathname, navigate]);
  return null;
}

/**
 * Relie la session (client, langue, aide, contraste, commande retrouvée) au moteur d'adaptation :
 * c'est le seul endroit qui transforme l'état de l'application en entrées d'adaptation.
 */
export function AdaptiveRoot({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const { pathname, search } = useLocation();
  const { override } = useDeviceOverride();
  const { device } = detectDevice(readDeviceSignals(pathname, search, override));

  const inputs = useMemo<AdaptationInputs>(
    () => ({
      device,
      language: state.language,
      customerId: state.customer?.id ?? null,
      customerOrderCount: state.customer?.orderCount ?? 0,
      helpAnswer: state.helpAnswer,
      helpRequested: state.helpRequested,
      highContrast: state.highContrast,
      handoverReceived: state.retrievedFromPhone,
      draftProblem: state.draftProblem,
    }),
    [device, state],
  );

  return (
    <AdaptationProvider inputs={inputs}>
      <ThemeSync />
      <DeviceRedirect device={device} />
      <CatalogProvider>{children}</CatalogProvider>
    </AdaptationProvider>
  );
}
