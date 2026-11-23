import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CreateDraftRequest, PaymentMethod } from '@pastalavista/shared';
import { cartToInputs } from '../../domain/cart/cart';
import { ApiError } from '../../services/apiClient';
import { authApi, orderApi } from '../../services/api';
import { LOGIN_POLL_INTERVAL_MS, QUERY_PARAMS } from '../../shared/constants';
import { getKioskId } from '../../shared/kioskId';
import { useSession } from '../../state/SessionProvider';
import type { DictionaryKey } from '../../i18n';

type LoginStatus = 'creating' | 'pending' | 'authenticated' | 'error';

/**
 * Connexion par QR code : la borne crée une session et affiche son QR code (porteur de l'identifiant
 * de borne) ; le smartphone connecté la confirme ; la borne reconnaît alors le client.
 */
export function useKioskLogin(enabled: boolean) {
  const { dispatch } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<LoginStatus>('creating');
  const kioskId = getKioskId();

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    authApi
      .createKioskLoginSession(kioskId)
      .then((session) => {
        if (cancelled) return;
        setSessionId(session.id);
        setStatus('pending');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => {
      cancelled = true;
    };
  }, [enabled, kioskId]);

  useEffect(() => {
    if (!enabled || !sessionId || status !== 'pending') return;
    const id = window.setInterval(() => {
      authApi
        .getKioskLoginSession(sessionId)
        .then((session) => {
          if (session.status === 'authenticated' && session.customer) {
            setStatus('authenticated');
            dispatch({ type: 'login', customer: session.customer, sessionToken: null });
            if (session.customer.locale)
              dispatch({ type: 'setLanguage', language: session.customer.locale });
          } else if (session.status === 'expired') {
            setSessionId(null);
            setStatus('creating');
          }
        })
        .catch(() => setStatus('error'));
    }, LOGIN_POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [enabled, sessionId, status, dispatch]);

  const qrValue = sessionId
    ? `${window.location.origin}/m/login?${QUERY_PARAMS.kiosk}=${encodeURIComponent(kioskId)}&${QUERY_PARAMS.session}=${sessionId}`
    : null;

  /** Simulation (outil de démonstration) : joue le rôle du smartphone connecté de Jérémy. */
  const simulatePhoneScan = useCallback(async () => {
    if (!sessionId) return;
    const { sessionToken } = await authApi.mockLogin('cust-jeremy');
    await authApi.confirmKioskLogin(sessionId, sessionToken);
  }, [sessionId]);

  return { qrValue, status, simulatePhoneScan };
}

const RETRIEVE_ERRORS: Record<string, DictionaryKey> = {
  DRAFT_NOT_FOUND: 'retrieve.notFound',
  DRAFT_EXPIRED: 'retrieve.expired',
  DRAFT_ALREADY_PAID: 'retrieve.alreadyPaid',
  DRAFT_ALREADY_RETRIEVED: 'retrieve.otherKiosk',
};

/** Récupération d'une commande préparée sur smartphone, par jeton (QR code) ou par code PL-xxxx. */
export function useRetrieveDraft() {
  const { dispatch, t } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const retrieve = useCallback(
    async (input: { token: string } | { code: string }) => {
      setBusy(true);
      setError(null);
      try {
        const { draft, token, customer } = await orderApi.retrieveDraft({
          kioskId: getKioskId(),
          ...input,
        });
        dispatch({ type: 'receiveDraft', draft, token, customer: customer ?? null });
        navigate('/kiosk/pay');
      } catch (cause) {
        const code = cause instanceof ApiError ? cause.code : '';
        setError(t(RETRIEVE_ERRORS[code] ?? 'retrieve.generic'));
        if (code === 'DRAFT_EXPIRED') dispatch({ type: 'setDraftProblem', problem: 'expired' });
        if (code === 'DRAFT_ALREADY_PAID')
          dispatch({ type: 'setDraftProblem', problem: 'already-paid' });
      } finally {
        setBusy(false);
      }
    },
    [dispatch, navigate, t],
  );
  return { retrieve, error, busy };
}

/** Paiement SIMULÉ : enregistre la commande sur le serveur (brouillon de borne) puis la paie. */
export function useCheckout() {
  const { state, dispatch, t } = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pay = useCallback(
    async (method: PaymentMethod, useSavedCard: boolean) => {
      setBusy(true);
      setError(null);
      try {
        const kioskId = getKioskId();
        const body = { mode: state.mode, locale: state.language, lines: cartToInputs(state.cart) };
        let draft = state.draft;
        if (draft) {
          await orderApi.updateDraft(draft.id, draft.token, body);
        } else {
          const request: CreateDraftRequest = {
            ...body,
            origin: 'kiosk',
            kioskId,
            customerId: state.customer?.id ?? null,
          };
          const created = await orderApi.createDraft(request);
          draft = {
            id: created.draft.id,
            code: created.draft.code,
            token: created.token,
            expiresAt: created.draft.expiresAt,
          };
          dispatch({ type: 'setDraft', draft });
        }
        const result = await orderApi.pay(draft.id, draft.token, { kioskId, method, useSavedCard });
        dispatch({ type: 'setOrder', order: result });
        navigate('/kiosk/done');
      } catch (cause) {
        const code = cause instanceof ApiError ? cause.code : '';
        if (code === 'DRAFT_EXPIRED') dispatch({ type: 'setDraftProblem', problem: 'expired' });
        if (code === 'DRAFT_ALREADY_PAID')
          dispatch({ type: 'setDraftProblem', problem: 'already-paid' });
        setError(t('pay.failed', { message: cause instanceof Error ? cause.message : '' }));
      } finally {
        setBusy(false);
      }
    },
    [state, dispatch, navigate, t],
  );
  return { pay, error, busy };
}
