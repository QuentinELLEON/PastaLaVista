import type { Locale } from '@pastalavista/shared';

const CENTS_PER_EURO = 100;

export function formatPrice(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(
    cents / CENTS_PER_EURO,
  );
}

/** Supplément affiché avec son signe : « +1,50 € ». Chaîne vide si le supplément est nul. */
export function formatSurcharge(cents: number, locale: Locale): string {
  return cents === 0 ? '' : `+${formatPrice(cents, locale)}`;
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatTime(iso: string, locale: Locale): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}
