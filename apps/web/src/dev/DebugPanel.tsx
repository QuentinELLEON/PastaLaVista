import { useState } from 'react';
import type { Device } from '@pastalavista/shared';
import { useAdaptation } from '../adaptation/provider/AdaptationProvider';
import { THRESHOLDS } from '../adaptation/rules/thresholds.config';
import { authApi } from '../services/api';
import { useSession } from '../state/SessionProvider';
import { useDeviceOverride } from './DeviceOverride';
import './debug.css';

const SLOW_RATIO = THRESHOLDS.slowness.factor + 1;
const REFERENCE_MS = THRESHOLDS.referenceDelaysMs.default;

type Persona = 'standard' | 'jeremy' | 'alexei';

/**
 * Panneau de DEBUG (jamais en production) : force un persona, un appareil, simule lenteur,
 * hésitations et taps ratés pour démontrer chaque adaptation. Ses clics ne comptent pas comme signaux.
 */
export default function DebugPanel() {
  const { state, dispatch } = useSession();
  const { config, context, firedRuleIds, inferred, collector, commitNow, resetGuidance } =
    useAdaptation();
  const { override, setOverride } = useDeviceOverride();
  const [open, setOpen] = useState(false);

  const slowDelays = Array.from({ length: THRESHOLDS.slowness.windowSize }, () => ({
    delayMs: REFERENCE_MS * SLOW_RATIO,
    referenceMs: REFERENCE_MS,
  }));

  async function forcePersona(persona: Persona) {
    collector.reset();
    resetGuidance();
    dispatch({ type: 'reset' });
    if (persona === 'jeremy') {
      const { customer, sessionToken } = await authApi.mockLogin('cust-jeremy');
      dispatch({ type: 'login', customer, sessionToken });
    }
    if (persona === 'alexei') {
      dispatch({ type: 'setLanguage', language: 'ru' });
      collector.inject({ actionDelays: slowDelays });
    }
    // Démonstration : on applique tout de suite, sans attendre la frontière d'étape
    commitNow(persona === 'alexei' ? 'guided' : 'standard');
  }

  return (
    <aside className="dev-panel" data-dev-tools>
      <button
        type="button"
        className="dev-panel__toggle"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Dev
      </button>
      {open ? (
        <div className="dev-panel__body">
          <h2>Persona</h2>
          <div className="dev-panel__row">
            {(['standard', 'jeremy', 'alexei'] as const).map((persona) => (
              <button key={persona} type="button" onClick={() => void forcePersona(persona)}>
                {persona === 'standard'
                  ? 'Standard'
                  : persona === 'jeremy'
                    ? 'Jérémy'
                    : 'Alexovitch'}
              </button>
            ))}
          </div>
          <h2>Appareil</h2>
          <div className="dev-panel__row">
            {([null, 'kiosk', 'smartphone'] as Array<Device | null>).map((device) => (
              <button
                key={device ?? 'auto'}
                type="button"
                aria-pressed={override === device}
                onClick={() => setOverride(device)}
              >
                {device ?? 'auto'}
              </button>
            ))}
          </div>
          <h2>Comportement simulé</h2>
          <div className="dev-panel__row">
            <button type="button" onClick={() => collector.inject({ actionDelays: slowDelays })}>
              Lenteur
            </button>
            <button
              type="button"
              onClick={() =>
                collector.inject({ backAndForth: THRESHOLDS.backAndForth.saturationCount })
              }
            >
              Hésitations
            </button>
            <button
              type="button"
              onClick={() =>
                collector.inject({ missedTaps: THRESHOLDS.missedTaps.saturationCount })
              }
            >
              Taps ratés
            </button>
            <button type="button" onClick={() => collector.reset()}>
              Effacer
            </button>
          </div>
          <div className="dev-panel__row">
            <button type="button" onClick={() => dispatch({ type: 'answerHelp', answer: 'none' })}>
              Réoffrir l’aide
            </button>
            <button type="button" onClick={() => commitNow()}>
              Appliquer maintenant
            </button>
          </div>
          <h2>État</h2>
          <dl>
            <dt>Appareil</dt>
            <dd>{context.device}</dd>
            <dt>Score de guidage</dt>
            <dd>
              {inferred.score.toFixed(2)} ({inferred.mode}, appliqué : {context.guidanceMode})
            </dd>
            <dt>Aide</dt>
            <dd>{state.helpAnswer}</dd>
            <dt>Profil</dt>
            <dd>{config.profile}</dd>
            <dt>Règles</dt>
            <dd>{firedRuleIds.join(', ') || '—'}</dd>
          </dl>
          <details>
            <summary>UiConfig</summary>
            <pre>{JSON.stringify(config, null, 1)}</pre>
          </details>
        </div>
      ) : null}
    </aside>
  );
}
