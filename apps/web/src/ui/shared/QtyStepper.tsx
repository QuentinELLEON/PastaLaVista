interface Props {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  decreaseLabel: string;
  increaseLabel: string;
}

/** Sélecteur de quantité : vrais boutons nommés (lecteurs d'écran), cibles >= 44 px (borne : 62 px). */
export function QtyStepper({
  value,
  onChange,
  min = 0,
  max = 20,
  decreaseLabel,
  increaseLabel,
}: Props) {
  return (
    <div className="qty" role="group">
      <button
        type="button"
        className="qty__btn"
        aria-label={decreaseLabel}
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="qty__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="qty__btn"
        aria-label={increaseLabel}
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  );
}
