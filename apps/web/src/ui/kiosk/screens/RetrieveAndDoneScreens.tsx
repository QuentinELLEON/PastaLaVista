import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { SimulateTicketScan } from '../../../dev/Simulators';
import { DONE_SCREEN_RESET_MS, QUERY_PARAMS } from '../../../shared/constants';
import { useSession } from '../../../state/SessionProvider';
import { useEndSession } from '../../hooks/useEndSession';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { OrderCodeInput } from '../../shared/OrderCodeInput';
import { KioskLayout } from '../KioskLayout';
import { useRetrieveDraft } from '../kioskHooks';

/** Retrouver une commande préparée sur smartphone : lecture du QR code (ou simulation) ou saisie du code PL-xxxx. */
export function RetrieveScreen() {
  useStepBoundary('retrieve');
  const { state, t } = useSession();
  const config = useUiConfig();
  const endSession = useEndSession();
  const [params] = useSearchParams();
  const { retrieve, error, busy } = useRetrieveDraft();
  const tokenFromUrl = params.get(QUERY_PARAMS.token);
  const scannedOnce = useRef(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // Un vrai lecteur de QR code ouvre l'URL contenant le jeton : récupération automatique
  useEffect(() => {
    if (tokenFromUrl && !scannedOnce.current) {
      scannedOnce.current = true;
      void retrieve({ token: tokenFromUrl });
    }
  }, [tokenFromUrl, retrieve]);

  const restart = () => endSession();

  return (
    <KioskLayout variant="wide">
      <h1 className="k-title">{t('retrieve.title')}</h1>
      <section
        className="card"
        style={{ padding: 28, display: 'flex', alignItems: 'center', gap: 24 }}
      >
        <span style={{ color: 'var(--green)' }}>
          <Icon name="phone" size={96} />
        </span>
        <p style={{ fontSize: 28, fontWeight: 700, flex: 1 }}>{t('retrieve.hint')}</p>
      </section>
      <SimulateTicketScan
        onScan={(token) => void retrieve({ token })}
        onNothingToScan={() => setScanMessage(t('retrieve.simulateNone'))}
      />
      {scanMessage ? <p role="alert">{scanMessage}</p> : null}
      {config.dialogue.codeEntryFallback ? (
        <section
          className="card"
          style={{
            padding: '22px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            marginTop: 'auto',
          }}
        >
          <h2 style={{ fontSize: 30, fontWeight: 800 }}>{t('retrieve.codeTitle')}</h2>
          <OrderCodeInput
            onSubmit={(code) => void retrieve({ code })}
            error={error}
            disabled={busy}
          />
        </section>
      ) : null}
      {error && !config.dialogue.codeEntryFallback ? <p role="alert">{error}</p> : null}
      {config.content.restartOffer || state.draftProblem !== 'none' ? (
        <Button variant="primary" onClick={restart}>
          {t('retrieve.restart')}
        </Button>
      ) : null}
    </KioskLayout>
  );
}

/** Fin de parcours : numéro de commande, explication de la suite, remise à zéro automatique de la borne. */
export function DoneScreen() {
  useStepBoundary('done');
  const { state, t } = useSession();
  const endSession = useEndSession();
  const order = state.order?.order;
  const newOrder = () => endSession();

  useEffect(() => {
    // Écran public : la commande précédente ne reste jamais affichée
    const id = window.setTimeout(newOrder, DONE_SCREEN_RESET_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!order) {
    return (
      <KioskLayout variant="wide">
        <Button variant="primary" onClick={newOrder}>
          {t('done.new')}
        </Button>
      </KioskLayout>
    );
  }
  return (
    <KioskLayout step="pay" variant="wide" terminalActive>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          textAlign: 'center',
        }}
      >
        <h1 className="k-title" style={{ fontSize: 64 }}>
          {t('done.title')}
        </h1>
        <p style={{ fontSize: 32 }}>{t('done.number')}</p>
        <p className="k-order-number" aria-live="polite">
          {order.displayNumber}
        </p>
        <p style={{ fontSize: 30, fontWeight: 800, color: 'var(--green)' }}>{t('done.sent')}</p>
        <p style={{ fontSize: 28, color: 'var(--muted)' }}>{t('done.pickup')}</p>
        <Button variant="primary" onClick={newOrder} style={{ width: 460 }}>
          {t('done.new')}
        </Button>
      </div>
    </KioskLayout>
  );
}
