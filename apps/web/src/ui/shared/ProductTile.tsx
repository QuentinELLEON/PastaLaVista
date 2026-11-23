import type { ReactNode } from 'react';
import { Icon } from './Icon';

interface Props {
  name: string;
  description?: string;
  priceLabel?: string;
  art: ReactNode;
  selected?: boolean;
  dashed?: boolean;
  showAdd?: boolean;
  extra?: ReactNode;
  onClick: () => void;
}

/** Tuile de produit (borne, IHM standard) : visuel, nom, prix et bouton « + ». */
export function ProductTile({
  name,
  description,
  priceLabel,
  art,
  selected,
  dashed,
  showAdd,
  extra,
  onClick,
}: Props) {
  const classes = `tile${selected ? ' tile--selected' : ''}${dashed ? ' tile--dashed' : ''}`;
  return (
    <button
      type="button"
      className={classes}
      aria-pressed={selected === undefined ? undefined : selected}
      onClick={onClick}
    >
      {selected ? (
        <span className="tile__check" aria-hidden="true">
          <Icon name="check" size={30} strokeWidth={6} />
        </span>
      ) : null}
      <span className="tile__art" style={dashed ? { background: 'var(--surface)' } : undefined}>
        {art}
      </span>
      <span className="tile__body">
        <span className="tile__name">{name}</span>
        {description ? <span className="tile__desc">{description}</span> : null}
        {extra}
        {priceLabel || showAdd ? (
          <span className="tile__foot">
            <span>{priceLabel}</span>
            {showAdd ? (
              <span className="tile__plus" aria-hidden="true">
                +
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </button>
  );
}
