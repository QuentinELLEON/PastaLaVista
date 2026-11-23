import { useId, useState, type FormEvent } from 'react';
import { normalizeDraftCode } from '@pastalavista/shared';
import { useT } from '../../state/SessionProvider';
import { Button } from './Button';

interface Props {
  onSubmit: (code: string) => void;
  /** Message d'erreur venant du serveur (code introuvable, expiré...). */
  error?: string | null;
  disabled?: boolean;
}

/** Saisie du code PL-xxxx : secours quand le téléphone est déchargé (règle RD4). */
export function OrderCodeInput({ onSubmit, error, disabled }: Props) {
  const t = useT();
  const inputId = useId();
  const [value, setValue] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const code = normalizeDraftCode(value);
    if (!code) {
      setLocalError(t('retrieve.invalidCode'));
      return;
    }
    setLocalError(null);
    onSubmit(code);
  }

  const shownError = localError ?? error ?? null;
  return (
    <form onSubmit={submit} noValidate>
      <label htmlFor={inputId} className="sr-only">
        {t('retrieve.codeLabel')}
      </label>
      <div className="order-code">
        <input
          id={inputId}
          className="order-code__input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="PL-____"
          autoComplete="off"
          inputMode="text"
          aria-invalid={shownError ? true : undefined}
          aria-describedby={shownError ? `${inputId}-error` : undefined}
        />
        <Button type="submit" variant="primary" disabled={disabled}>
          {t('retrieve.validate')}
        </Button>
      </div>
      {shownError ? (
        <p id={`${inputId}-error`} className="order-code__error" role="alert">
          {shownError}
        </p>
      ) : null}
    </form>
  );
}
