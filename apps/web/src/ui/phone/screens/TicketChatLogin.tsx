import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStepBoundary } from '../../../adaptation/provider/AdaptationProvider';
import { DEMO_ACCOUNTS } from '../../../mock/demoAccounts';
import { authApi } from '../../../services/api';
import { QUERY_PARAMS, STAFF_CALLED_NOTICE_MS } from '../../../shared/constants';
import { formatPrice, formatTime } from '../../../shared/format';
import { cartTotals } from '../../../domain/cart/cart';
import { useCatalog } from '../../../state/CatalogProvider';
import { useSession } from '../../../state/SessionProvider';
import { useCartActions } from '../../hooks/useCartActions';
import { Button } from '../../shared/Button';
import { ChatPanel } from '../../shared/ChatPanel';
import { QrCode } from '../../shared/QrCode';
import { PhoneLayout } from '../PhoneLayout';
import { useDemoLogin } from '../phoneHooks';

/** « Votre commande est prête » : QR code et code PL-xxxx à présenter à la borne. Aucun paiement sur le téléphone. */
export function PhoneTicket() {
  useStepBoundary('ticket');
  const { state, t } = useSession();
  const catalog = useCatalog();
  const navigate = useNavigate();
  const draft = state.draft;
  if (!draft) {
    return (
      <PhoneLayout
        footer={
          <Button variant="primary" block onClick={() => navigate('/m')}>
            {t('common.back')}
          </Button>
        }
      >
        <p className="p-sub">{t('phone.emptyCart')}</p>
      </PhoneLayout>
    );
  }
  const total = cartTotals(state.cart, catalog).totalCents;
  // Le QR code porte une URL : un vrai lecteur de la borne l'ouvre et récupère la commande
  const payload = `${window.location.origin}/kiosk/retrieve?${QUERY_PARAMS.token}=${encodeURIComponent(draft.token)}`;
  return (
    <PhoneLayout
      footer={
        <Button block onClick={() => navigate('/m/recap')}>
          {t('phone.editOrder')}
        </Button>
      }
    >
      <h1 className="p-title">{t('phone.ticketTitle')}</h1>
      <section className="p-card p-ticket">
        <QrCode value={payload} size={220} label={t('phone.ticketTitle')} />
        <p className="p-sub">{t('phone.code')}</p>
        <p className="p-code" aria-label={`${t('phone.code')} ${draft.code}`}>
          {draft.code}
        </p>
        <b>{formatPrice(total, state.language)}</b>
        <p className="p-sub">
          {t('phone.expires', { time: formatTime(draft.expiresAt, state.language) })}
        </p>
      </section>
      <p>{t('phone.ticketHint')}</p>
      <p className="p-sub">{t('phone.payAtKiosk')}</p>
    </PhoneLayout>
  );
}

/** Chatbot de commande : suggestions limitées au catalogue réel, appel d'un employé possible. */
export function PhoneChat() {
  useStepBoundary('chat');
  const { t } = useSession();
  const navigate = useNavigate();
  const { addInputLines, startPlateFrom } = useCartActions();
  const [staffCalled, setStaffCalled] = useState(false);

  useEffect(() => {
    if (!staffCalled) return;
    const id = window.setTimeout(() => setStaffCalled(false), STAFF_CALLED_NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [staffCalled]);

  return (
    <PhoneLayout fill showUrlBar>
      <div className="p-chatbar">
        <Button signal="back" onClick={() => navigate('/m')}>
          {t('common.back')}
        </Button>
        <b>{t('chat.title')}</b>
        <Button variant="primary" onClick={() => navigate('/m/recap')}>
          {t('phone.viewOrder')}
        </Button>
      </div>
      {staffCalled ? (
        <p role="status" className="chat__bubble chat__bubble--bot" style={{ margin: '8px 16px' }}>
          {t('help.staffCalled')}
        </p>
      ) : null}
      <ChatPanel
        onAddSuggestion={addInputLines}
        onModifySuggestion={(lines) => {
          const first = lines[0];
          if (!first) return;
          startPlateFrom(first);
          navigate('/m/compose');
        }}
        onShowMenu={() => navigate('/m/menu')}
        onCallStaff={() => setStaffCalled(true)}
      />
    </PhoneLayout>
  );
}

/** Arrivée par le QR code de la borne : le smartphone confirme la session pour que la borne reconnaisse le client. */
export function PhoneLogin() {
  useStepBoundary('login');
  const { state, t } = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get(QUERY_PARAMS.session);
  const { login, busy } = useDemoLogin();
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmed = useRef(false);

  async function confirm(token: string) {
    if (!sessionId || confirmed.current) return;
    confirmed.current = true;
    try {
      await authApi.confirmKioskLogin(sessionId, token);
      setDone(true);
    } catch (cause) {
      confirmed.current = false;
      setError(
        t('phone.kioskLoginError', { message: cause instanceof Error ? cause.message : '' }),
      );
    }
  }

  // Déjà connecté sur ce téléphone : on confirme directement la session de la borne
  useEffect(() => {
    if (state.sessionToken) void confirm(state.sessionToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessionToken, sessionId]);

  return (
    <PhoneLayout
      footer={
        <Button variant="primary" block onClick={() => navigate('/m')}>
          {t('phone.menu')}
        </Button>
      }
    >
      <h1 className="p-title">{t('phone.kioskLoginTitle')}</h1>
      {done ? (
        <p role="status" style={{ fontWeight: 800, color: 'var(--green)' }}>
          {t('phone.kioskLoginDone')}
        </p>
      ) : (
        <section className="p-card" aria-label={t('phone.demoLogin')}>
          <p>{t('phone.kioskLoginPending')}</p>
          <p className="p-sub">{t('phone.demoLoginHint')}</p>
          {DEMO_ACCOUNTS.map((account) => (
            <Button
              key={account.id}
              disabled={busy}
              onClick={async () => {
                const token = await login(account.id);
                if (token) await confirm(token);
              }}
            >
              {t('phone.loginAs', { name: account.firstName })}
            </Button>
          ))}
        </section>
      )}
      {error ? (
        <p role="alert" style={{ color: 'var(--red)', fontWeight: 800 }}>
          {error}
        </p>
      ) : null}
    </PhoneLayout>
  );
}
