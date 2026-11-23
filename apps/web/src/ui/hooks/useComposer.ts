import { useCallback } from 'react';
import { useUiConfig } from '../../adaptation/provider/AdaptationProvider';
import {
  PLATE_STEPS,
  isPlateComplete,
  plateTotals,
  summarizePlate,
  type ComposeStep,
  type PlateDraft,
} from '../../domain/cart/plate';
import { useCatalog } from '../../state/CatalogProvider';
import { useSession } from '../../state/SessionProvider';
import { newLineId } from './useCartActions';

/**
 * Composition pas à pas, commune à la borne et au smartphone. L'état de l'assiette vit dans la session :
 * il survit à un changement de profil ou de disposition. Le parcours guidé ajoute une étape de vérification.
 */
export function useComposer() {
  const { state, dispatch } = useSession();
  const config = useUiConfig();
  const catalog = useCatalog();

  const steps: ComposeStep[] = config.dialogue.confirmEachStep
    ? [...PLATE_STEPS, 'review']
    : [...PLATE_STEPS];
  // Si le profil change pendant la composition, l'étape courante reste valide (repli sur la dernière étape)
  const step: ComposeStep = steps.includes(state.plateStep)
    ? state.plateStep
    : (steps[steps.length - 1] ?? 'pasta');
  const index = steps.indexOf(step);
  const isLast = index === steps.length - 1;

  const canProceed =
    step === 'pasta'
      ? state.plate.pastaId !== null
      : step === 'sauce'
        ? state.plate.sauceId !== null
        : true;
  const canFinish = isPlateComplete(state.plate);

  const goTo = useCallback(
    (next: ComposeStep) => dispatch({ type: 'setPlateStep', step: next }),
    [dispatch],
  );
  const patch = useCallback(
    (change: Partial<PlateDraft>) => dispatch({ type: 'patchPlate', patch: change }),
    [dispatch],
  );
  const finish = useCallback(
    () => dispatch({ type: 'finishPlate', lineId: newLineId() }),
    [dispatch],
  );

  return {
    plate: state.plate,
    steps,
    step,
    index,
    isLast,
    canProceed,
    canFinish,
    totals: plateTotals(state.plate, catalog),
    summary: summarizePlate(state.plate, catalog),
    goTo,
    patch,
    finish,
    next: () => {
      const target = steps[index + 1];
      if (target) goTo(target);
    },
    previous: () => {
      const target = steps[index - 1];
      if (target) goTo(target);
    },
  };
}
