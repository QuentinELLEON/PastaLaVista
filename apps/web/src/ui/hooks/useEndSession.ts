import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdaptation } from '../../adaptation/provider/AdaptationProvider';
import { useSession } from '../../state/SessionProvider';

/**
 * Fin de session sur la borne (annulation, nouvelle commande, inactivité) : écran public, donc
 * panier, client, aide et signaux de comportement sont effacés avant le prochain client.
 */
export function useEndSession() {
  const { dispatch } = useSession();
  const { collector, resetGuidance } = useAdaptation();
  const navigate = useNavigate();
  return useCallback(
    (destination = '/kiosk') => {
      dispatch({ type: 'reset' });
      collector.reset();
      resetGuidance();
      navigate(destination);
    },
    [dispatch, collector, resetGuidance, navigate],
  );
}
