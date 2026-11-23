import type { ButtonHTMLAttributes } from 'react';

type Variant = 'secondary' | 'primary' | 'danger' | 'success';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  block?: boolean;
  grow?: boolean;
  /** « back » : l'appui est compté comme un retour arrière (signal d'hésitation, voir adaptation/context). */
  signal?: 'back';
}

const VARIANT_CLASS: Record<Variant, string> = {
  secondary: '',
  primary: ' btn--primary',
  danger: ' btn--danger',
  success: ' btn--success',
};

/** Bouton partagé borne + smartphone : seule la variable --btn-h (100 px / 56 px) change. */
export function Button({
  variant = 'secondary',
  block,
  grow,
  signal,
  className = '',
  type = 'button',
  ...rest
}: Props) {
  const classes = `btn${VARIANT_CLASS[variant]}${block ? ' btn--block' : ''}${grow ? ' btn--grow' : ''} ${className}`;
  return <button type={type} className={classes.trim()} data-signal={signal} {...rest} />;
}
