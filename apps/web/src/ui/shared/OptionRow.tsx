import type { ReactNode } from 'react';
import { NutritionBadge } from './NutritionBadge';
import { QtyStepper } from './QtyStepper';

interface Props {
  name: string;
  description?: string;
  priceLabel?: string;
  art: ReactNode;
  selected: boolean;
  nutrition?: { kcal: number; proteinG: number; slowCarbs?: boolean };
  /** Défini pour un choix multiple avec quantité (garnitures, extras). */
  quantity?: number;
  onSelect?: () => void;
  onQuantityChange?: (next: number) => void;
  decreaseLabel?: string;
  increaseLabel?: string;
}

/**
 * Ligne de choix large (mode guidé sur la borne, liste du smartphone) : visuel, description,
 * kcal et protéines visibles sans clic supplémentaire, quantité au pouce.
 */
export function OptionRow({
  name,
  description,
  priceLabel,
  art,
  selected,
  nutrition,
  quantity,
  onSelect,
  onQuantityChange,
  decreaseLabel = '',
  increaseLabel = '',
}: Props) {
  const content = (
    <>
      {art}
      <span className="option-row__text">
        <span className="option-row__name">{name}</span>
        {description || priceLabel ? (
          <span className="option-row__desc">
            {[description, priceLabel].filter(Boolean).join(' · ')}
          </span>
        ) : null}
        {nutrition ? (
          <NutritionBadge
            kcal={nutrition.kcal}
            proteinG={nutrition.proteinG}
            slowCarbs={nutrition.slowCarbs}
          />
        ) : null}
      </span>
    </>
  );
  return (
    <div className={`option-row${selected ? ' option-row--selected' : ''}`}>
      {onSelect ? (
        <button
          type="button"
          className="option-row__select"
          aria-pressed={selected}
          onClick={onSelect}
        >
          {content}
        </button>
      ) : (
        <div className="option-row__select">{content}</div>
      )}
      {quantity !== undefined && onQuantityChange ? (
        <QtyStepper
          value={quantity}
          onChange={onQuantityChange}
          decreaseLabel={decreaseLabel}
          increaseLabel={increaseLabel}
        />
      ) : null}
    </div>
  );
}
