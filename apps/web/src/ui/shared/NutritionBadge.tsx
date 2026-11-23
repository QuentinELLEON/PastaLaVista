import { formatNumber } from '../../shared/format';
import { useSession } from '../../state/SessionProvider';

interface Props {
  kcal: number;
  proteinG: number;
  slowCarbs?: boolean;
}

/** kcal et protéines : l'information est portée par le texte (jamais par la couleur seule). */
export function NutritionBadge({ kcal, proteinG, slowCarbs }: Props) {
  const { state, t } = useSession();
  const text = t('nutrition.line', {
    kcal: formatNumber(kcal, state.language),
    protein: formatNumber(proteinG, state.language),
  });
  return (
    <span className={`nutrition${slowCarbs ? ' nutrition--slow' : ''}`}>
      {text}
      {slowCarbs ? <span> · {t('nutrition.slowCarbs')}</span> : null}
    </span>
  );
}
