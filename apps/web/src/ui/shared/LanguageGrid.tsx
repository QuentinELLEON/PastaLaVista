import { LOCALES, type Locale } from '@pastalavista/shared';
import { useT } from '../../state/SessionProvider';

interface Props {
  value: Locale;
  onChange: (locale: Locale) => void;
}

const LANGUAGE_NAMES: Record<Locale, string> = { fr: 'Français', en: 'English', ru: 'Русский' };

/** Boutons de langue : seules les langues réellement traduites sont proposées. */
export function LanguageGrid({ value, onChange }: Props) {
  const t = useT();
  return (
    <div className="lang-grid" role="group" aria-label={t('language.group')}>
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          className="lang-grid__btn"
          aria-pressed={locale === value}
          aria-label={LANGUAGE_NAMES[locale]}
          lang={locale}
          onClick={() => onChange(locale)}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
