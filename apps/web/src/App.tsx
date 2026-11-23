import { Suspense, lazy, type ReactElement } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { detectDevice, readDeviceSignals } from './adaptation/context/deviceDetection';
import { DeviceOverrideProvider } from './dev/DeviceOverride';
import { STORAGE_KEYS } from './shared/constants';
import { DEV_TOOLS_ENABLED } from './shared/env';
import { SessionProvider } from './state/SessionProvider';
import { AdaptiveRoot } from './ui/AdaptiveRoot';
import { CatalogGate } from './ui/shared/CatalogGate';
import { ComposeScreen } from './ui/kiosk/screens/ComposeScreen';
import { HomeScreen } from './ui/kiosk/screens/HomeScreen';
import { ConceptScreen, LanguageScreen } from './ui/kiosk/screens/LanguageScreens';
import { MenuScreen } from './ui/kiosk/screens/MenuScreen';
import { PayScreen } from './ui/kiosk/screens/PayScreen';
import { DoneScreen, RetrieveScreen } from './ui/kiosk/screens/RetrieveAndDoneScreens';
import { PhoneCompose, PhoneRecap } from './ui/phone/screens/ComposeAndRecap';
import { PhoneHome, PhoneMenu } from './ui/phone/screens/HomeAndMenu';
import { PhoneChat, PhoneLogin, PhoneTicket } from './ui/phone/screens/TicketChatLogin';

// Panneau de debug : chargé uniquement si les outils de développement sont activés
const DebugPanel = DEV_TOOLS_ENABLED ? lazy(() => import('./dev/DebugPanel')) : null;

const gated = (screen: ReactElement) => <CatalogGate>{screen}</CatalogGate>;

function KioskRoutes() {
  return (
    <Routes>
      <Route index element={gated(<HomeScreen />)} />
      <Route path="language" element={gated(<LanguageScreen />)} />
      <Route path="concept" element={gated(<ConceptScreen />)} />
      <Route path="menu" element={gated(<MenuScreen />)} />
      <Route path="compose" element={gated(<ComposeScreen />)} />
      <Route path="pay" element={gated(<PayScreen />)} />
      <Route path="retrieve" element={gated(<RetrieveScreen />)} />
      <Route path="done" element={gated(<DoneScreen />)} />
      <Route path="*" element={<Navigate to="/kiosk" replace />} />
    </Routes>
  );
}

function PhoneRoutes() {
  return (
    <Routes>
      <Route index element={gated(<PhoneHome />)} />
      <Route path="login" element={gated(<PhoneLogin />)} />
      <Route path="menu" element={gated(<PhoneMenu />)} />
      <Route path="compose" element={gated(<PhoneCompose />)} />
      <Route path="recap" element={gated(<PhoneRecap />)} />
      <Route path="ticket" element={gated(<PhoneTicket />)} />
      <Route path="chat" element={gated(<PhoneChat />)} />
      <Route path="*" element={<Navigate to="/m" replace />} />
    </Routes>
  );
}

/** Racine : redirige selon la détection de l'appareil, ou propose le choix quand rien ne permet de trancher. */
function Launcher() {
  const { pathname, search } = useLocation();
  const { device, reason } = detectDevice(readDeviceSignals(pathname, search, null));
  if (reason !== 'default')
    return <Navigate to={device === 'kiosk' ? `/kiosk${search}` : `/m${search}`} replace />;
  return (
    <div className="launcher">
      <h1>PastaLaVista</h1>
      <p>Appareil non déterminé : choisissez l’interface à ouvrir.</p>
      <Link className="btn btn--primary" to="/kiosk">
        Borne (portrait 810 × 1440)
      </Link>
      <Link className="btn" to="/m">
        Smartphone
      </Link>
    </div>
  );
}

export function App() {
  // Seul le smartphone conserve sa session lors d'un rechargement ; la borne n'enregistre rien (écran public)
  const phoneStart =
    window.location.pathname === '/m' || window.location.pathname.startsWith('/m/');
  return (
    <DeviceOverrideProvider>
      <SessionProvider storageKey={phoneStart ? STORAGE_KEYS.phoneSession : null}>
        <AdaptiveRoot>
          <Routes>
            <Route path="/" element={<Launcher />} />
            <Route path="/kiosk/*" element={<KioskRoutes />} />
            <Route path="/m/*" element={<PhoneRoutes />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          {DebugPanel ? (
            <Suspense fallback={null}>
              <DebugPanel />
            </Suspense>
          ) : null}
        </AdaptiveRoot>
      </SessionProvider>
    </DeviceOverrideProvider>
  );
}
