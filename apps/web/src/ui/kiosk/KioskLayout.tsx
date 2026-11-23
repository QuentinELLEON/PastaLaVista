import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { THRESHOLDS } from '../../adaptation/rules/thresholds.config';
import { useAdaptation } from '../../adaptation/provider/AdaptationProvider';
import { KIOSK_HEIGHT_PX, KIOSK_WIDTH_PX, STAFF_CALLED_NOTICE_MS } from '../../shared/constants';
import { useSession } from '../../state/SessionProvider';
import { useEndSession } from '../hooks/useEndSession';
import { useInactivity } from '../hooks/useInactivity';
import { Button } from '../shared/Button';
import { HelpPrompt } from '../shared/HelpPrompt';
import { StepIndicator, TerminalStrip, TopBar, type KioskStep } from './KioskParts';
import './kiosk.css';
import './kiosk-screens.css';

/** Met la borne 810 x 1440 à l'échelle de la fenêtre (rendu réaliste sur n'importe quel écran). */
function useFitScale(): number {
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    const update = () =>
      setScale(Math.min(window.innerWidth / KIOSK_WIDTH_PX, window.innerHeight / KIOSK_HEIGHT_PX));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

function HelpHost() {
  const { state, dispatch } = useSession();
  const { config, commitNow } = useAdaptation();
  const offered = config.dialogue.helpPrompt;
  if (!offered && !state.helpRequested) return null;
  const answer = (value: 'accepted' | 'declined') => {
    dispatch({ type: 'answerHelp', answer: value });
    commitNow();
  };
  return (
    <HelpPrompt
      className="k-help"
      offered={offered}
      active={config.profile === 'guided'}
      onAccept={() => answer('accepted')}
      onDecline={() => answer('declined')}
      onCallStaff={
        config.dialogue.callStaffOffer || offered
          ? () => dispatch({ type: 'callStaff', called: true })
          : undefined
      }
      onClose={() => dispatch({ type: 'requestHelp', requested: false })}
    />
  );
}

function StaffNotice() {
  const { state, dispatch, t } = useSession();
  useEffect(() => {
    if (!state.staffCalled) return;
    const id = window.setTimeout(
      () => dispatch({ type: 'callStaff', called: false }),
      STAFF_CALLED_NOTICE_MS,
    );
    return () => window.clearTimeout(id);
  }, [state.staffCalled, dispatch]);
  return state.staffCalled ? (
    <p className="k-notice" role="status">
      {t('help.staffCalled')}
    </p>
  ) : null;
}

function InactivityOverlay({ hasSession }: { hasSession: boolean }) {
  const { t } = useSession();
  const { config } = useAdaptation();
  const endSession = useEndSession();
  const { secondsLeft, stay } = useInactivity({
    timeoutMs: config.dialogue.inactivityTimeoutMs,
    warningMs: THRESHOLDS.inactivity.warningMs,
    enabled: hasSession,
    onReset: () => endSession(),
  });
  if (secondsLeft === null) return null;
  return (
    <div
      className="k-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="inactivity-title"
      data-inactivity-warning
    >
      <div className="k-modal">
        <h2 id="inactivity-title">{t('inactivity.title')}</h2>
        <p>{t('inactivity.body', { seconds: secondsLeft })}</p>
        <Button variant="primary" onClick={stay} autoFocus>
          {t('inactivity.stay')}
        </Button>
      </div>
    </div>
  );
}

interface Props {
  step?: KioskStep;
  rail?: ReactNode;
  dock?: ReactNode;
  terminalActive?: boolean;
  /** wide : contenu pleine largeur (sans rail) ; bare : aucun cadre, l'écran gère sa mise en page (accueil). */
  variant?: 'default' | 'wide' | 'bare';
  children: ReactNode;
}

/**
 * Ossature de la borne : barre, étapes, rail, contenu, panier permanent, terminal.
 * Elle ne change JAMAIS d'un profil à l'autre ; seuls les contenus et variables de taille évoluent.
 */
export function KioskLayout({
  step,
  rail,
  dock,
  terminalActive = false,
  variant = 'default',
  children,
}: Props) {
  const scale = useFitScale();
  const { state } = useSession();
  const { config } = useAdaptation();
  const sessionRef = useRef(false);
  sessionRef.current = state.cart.length > 0 || state.customer !== null;
  return (
    <div className="kiosk-viewport">
      <div
        className="kiosk"
        data-density={config.presentation.density}
        data-profile={config.profile}
        style={{ ['--kiosk-scale' as string]: scale }}
      >
        <TopBar />
        {step ? <StepIndicator current={step} /> : null}
        <div className="k-mid">
          {rail}
          <main
            className={`k-content${variant === 'default' ? '' : ` k-content--${variant}`}`}
            lang={state.language}
          >
            {children}
          </main>
          <HelpHost />
        </div>
        {dock}
        <TerminalStrip active={terminalActive} />
        <StaffNotice />
        <InactivityOverlay hasSession={sessionRef.current} />
      </div>
    </div>
  );
}
