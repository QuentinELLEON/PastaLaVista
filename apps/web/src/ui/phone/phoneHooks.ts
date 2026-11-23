import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartToInputs } from '../../domain/cart/cart';
import { rememberTicketForDev } from '../../dev/Simulators';
import { ApiError } from '../../services/apiClient';
import { authApi, orderApi } from '../../services/api';
import { useSession } from '../../state/SessionProvider';

/** Connexion de démonstration (authentification simulée côté API). */
export function useDemoLogin() {
  const { dispatch } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (customerId: string) => {
      setBusy(true);
      setError(null);
      try {
        const { customer, sessionToken } = await authApi.mockLogin(customerId);
        dispatch({ type: 'login', customer, sessionToken });
        dispatch({ type: 'setLanguage', language: customer.locale });
        return sessionToken;
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Erreur');
        return null;
      } finally {
        setBusy(false);
      }
    },
    [dispatch],
  );
  return { login, busy, error };
}

const RESTARTABLE = new Set(['DRAFT_EXPIRED', 'DRAFT_ALREADY_PAID', 'DRAFT_NOT_FOUND']);

/** Enregistre la commande préparée (jamais de paiement ici) et renvoie vers l'écran du QR code. */
export function usePhoneDraft() {
  const { state, dispatch, t } = useSession();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(async () => {
    setBusy(true);
    setError(null);
    const body = { mode: state.mode, locale: state.language, lines: cartToInputs(state.cart) };
    try {
      let current = state.draft;
      if (current) {
        try {
          const updated = await orderApi.updateDraft(current.id, current.token, body);
          current = { ...current, expiresAt: updated.expiresAt };
        } catch (cause) {
          // Brouillon expiré ou déjà payé : on repart d'un nouveau brouillon avec le même panier
          if (!(cause instanceof ApiError) || !RESTARTABLE.has(cause.code)) throw cause;
          current = null;
        }
      }
      if (!current) {
        const created = await orderApi.createDraft({
          ...body,
          origin: 'smartphone',
          customerId: state.customer?.id ?? null,
        });
        current = {
          id: created.draft.id,
          code: created.draft.code,
          token: created.token,
          expiresAt: created.draft.expiresAt,
        };
        rememberTicketForDev(created.token);
      } else {
        rememberTicketForDev(current.token);
      }
      dispatch({ type: 'setDraft', draft: current });
      navigate('/m/ticket');
    } catch (cause) {
      setError(t('phone.draftError', { message: cause instanceof Error ? cause.message : '' }));
    } finally {
      setBusy(false);
    }
  }, [state, dispatch, navigate, t]);

  return { save, busy, error };
}
