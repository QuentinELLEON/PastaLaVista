import { useNavigate } from 'react-router-dom';
import { LOCALES } from '@pastalavista/shared';
import { useStepBoundary, useUiConfig } from '../../../adaptation/provider/AdaptationProvider';
import { useSession } from '../../../state/SessionProvider';
import { Button } from '../../shared/Button';
import { Icon } from '../../shared/Icon';
import { KioskLayout } from '../KioskLayout';

const LANGUAGE_NAMES = { fr: 'Français', en: 'English', ru: 'Русский' } as const;

/** Choix de la langue : grands boutons, affichés dans toutes les langues (le client ne lit pas encore la sienne). */
export function LanguageScreen() {
  useStepBoundary('language');
  const { state, dispatch, t } = useSession();
  const config = useUiConfig();
  const navigate = useNavigate();

  return (
    <KioskLayout variant="wide">
      <h1 className="k-title pre-line" style={{ fontSize: 48, lineHeight: 1.2 }}>
        {t('language.title')}
      </h1>
      <div
        className="k-stack"
        role="group"
        aria-label={t('language.group')}
        style={{ marginTop: 20 }}
      >
        {LOCALES.map((locale) => (
          <button
            key={locale}
            type="button"
            className="k-choice"
            style={{ height: 200, flexDirection: 'row', fontSize: 56 }}
            aria-pressed={state.language === locale}
            lang={locale}
            onClick={() => dispatch({ type: 'setLanguage', language: locale })}
          >
            <Icon name="globe" size={80} />
            {LANGUAGE_NAMES[locale]}
            <span style={{ fontSize: 36, color: 'var(--muted)' }}>{locale.toUpperCase()}</span>
          </button>
        ))}
      </div>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 16 }}>
        <Button grow signal="back" onClick={() => navigate('/kiosk')}>
          {t('common.back')}
        </Button>
        <Button
          variant="primary"
          grow
          // Après le choix d'une langue non française, la borne présente le concept (règle RU3)
          onClick={() => navigate(config.content.conceptIntro ? '/kiosk/concept' : '/kiosk')}
        >
          {t('language.continue')}
        </Button>
      </div>
    </KioskLayout>
  );
}

/** Découvrir le concept : trois étapes et rappel que kcal et protéines sont affichés. */
export function ConceptScreen() {
  useStepBoundary('concept');
  const { t } = useSession();
  const navigate = useNavigate();
  const steps = ['concept.step1', 'concept.step2', 'concept.step3'] as const;
  return (
    <KioskLayout variant="wide">
      <h1 className="k-title" style={{ fontSize: 44 }}>
        {t('concept.title')}
      </h1>
      <p className="k-subtitle" style={{ fontSize: 28 }}>
        {t('concept.intro')}
      </p>
      <ol className="k-concept" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {steps.map((key, index) => (
          <li key={key} className="card k-concept__step">
            <i aria-hidden="true">{index + 1}</i>
            {t(key)}
          </li>
        ))}
      </ol>
      <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--green)' }}>
        {t('concept.nutrition')}
      </p>
      <div style={{ marginTop: 'auto', display: 'flex', gap: 16 }}>
        <Button grow signal="back" onClick={() => navigate('/kiosk/language')}>
          {t('common.back')}
        </Button>
        <Button variant="primary" grow onClick={() => navigate('/kiosk/menu')}>
          {t('concept.start')}
        </Button>
      </div>
    </KioskLayout>
  );
}
