import type { ChatSuggestionDto } from '@pastalavista/shared';
import { formatPrice } from '../../shared/format';
import { useSession } from '../../state/SessionProvider';
import { BowlIllustration } from './BowlIllustration';
import { Button } from './Button';
import { NutritionBadge } from './NutritionBadge';

interface Props {
  suggestion: ChatSuggestionDto;
  onAdd: () => void;
  onModify: () => void;
}

/** Carte d'un plat proposé par le chatbot : titre, kcal, protéines, prix, actions. */
export function SuggestionCard({ suggestion, onAdd, onModify }: Props) {
  const { state, t } = useSession();
  const first = suggestion.lines[0];
  return (
    <section className="suggestion" aria-label={suggestion.title}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BowlIllustration productId={first?.productId} size={64} />
        <h3 style={{ flex: 1, fontSize: 17, lineHeight: 1.25 }}>{suggestion.title}</h3>
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
      >
        <NutritionBadge kcal={suggestion.totals.kcal} proteinG={suggestion.totals.proteinG} />
        <b style={{ fontSize: 17 }}>{formatPrice(suggestion.totals.totalCents, state.language)}</b>
      </div>
      <div className="suggestion__actions">
        <Button variant="primary" grow onClick={onAdd}>
          {t('chat.addToOrder')}
        </Button>
        <Button onClick={onModify}>{t('chat.modify')}</Button>
      </div>
    </section>
  );
}
