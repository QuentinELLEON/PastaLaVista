import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { THRESHOLDS } from '../rules/thresholds.config';
import { slowDelays } from '../../../test/factories';
import { STANDARD_UI_CONFIG } from '../engine/defaultConfig';
import {
  AdaptationProvider,
  useAdaptation,
  useUiConfig,
  type AdaptationInputs,
  type AdaptationValue,
} from './AdaptationProvider';

const baseInputs: AdaptationInputs = {
  device: 'kiosk',
  language: 'fr',
  customerId: null,
  customerOrderCount: 0,
  helpAnswer: 'none',
  helpRequested: false,
  highContrast: false,
  handoverReceived: false,
  draftProblem: 'none',
};

let api: AdaptationValue;
function Probe() {
  api = useAdaptation();
  const input = useRef<HTMLInputElement>(null);
  return (
    <div>
      <output data-testid="state">
        {api.config.profile}|{String(api.config.dialogue.helpPrompt)}|{api.config.language}|
        {api.inferred.mode}|{api.context.guidanceMode}
      </output>
      <input data-testid="typed" ref={input} defaultValue="" />
    </div>
  );
}

const state = () => screen.getByTestId('state').textContent;

describe('AdaptationProvider : continuité de l’expérience', () => {
  let now = 0;
  beforeEach(() => {
    now = 1_000_000;
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
  });
  afterEach(() => vi.useRealTimers());

  const renderProvider = (inputs: AdaptationInputs) =>
    render(
      <AdaptationProvider inputs={inputs} now={() => now}>
        <Probe />
      </AdaptationProvider>,
    );

  it('sans fournisseur, l’IHM standard sert de repli (le moteur peut être désactivé)', () => {
    function Bare() {
      return <output data-testid="bare">{useUiConfig().profile}</output>;
    }
    render(<Bare />);
    expect(screen.getByTestId('bare').textContent).toBe(STANDARD_UI_CONFIG.profile);
  });

  it('les faits explicites (langue, contraste) s’appliquent immédiatement', () => {
    const { rerender } = renderProvider(baseInputs);
    rerender(
      <AdaptationProvider
        inputs={{ ...baseInputs, language: 'ru', highContrast: true }}
        now={() => now}
      >
        <Probe />
      </AdaptationProvider>,
    );
    expect(state()).toContain('|ru|');
    expect(api.config.presentation.highContrast).toBe(true);
  });

  it('le guidage déduit du comportement n’est appliqué qu’à la frontière d’étape', () => {
    renderProvider({ ...baseInputs, language: 'ru' });
    act(() => api.collector.inject({ actionDelays: slowDelays(THRESHOLDS.slowness.windowSize) }));
    // Le score atteint 0,6 : le mode est INFÉRÉ mais pas encore APPLIQUÉ, aucune aide n'apparaît au milieu d'un choix
    expect(api.inferred.mode).toBe('guided');
    expect(api.context.guidanceMode).toBe('standard');
    expect(api.config.dialogue.helpPrompt).toBe(false);

    act(() => api.markStepBoundary('compose:sauce'));
    expect(api.context.guidanceMode).toBe('guided');
    expect(api.config.dialogue.helpPrompt).toBe(true);
    // L'aide est proposée, jamais imposée : tant qu'elle n'est pas acceptée, l'IHM reste standard
    expect(api.config.profile).toBe('standard');
  });

  it('accepter l’aide bascule tout de suite en mode guidé ; la refuser revient au standard', () => {
    const { rerender } = renderProvider({ ...baseInputs, language: 'ru' });
    act(() => api.collector.inject({ actionDelays: slowDelays(THRESHOLDS.slowness.windowSize) }));
    act(() => api.markStepBoundary('menu'));
    rerender(
      <AdaptationProvider
        inputs={{ ...baseInputs, language: 'ru', helpAnswer: 'accepted' }}
        now={() => now}
      >
        <Probe />
      </AdaptationProvider>,
    );
    expect(api.config.profile).toBe('guided');
    rerender(
      <AdaptationProvider
        inputs={{ ...baseInputs, language: 'ru', helpAnswer: 'declined' }}
        now={() => now}
      >
        <Probe />
      </AdaptationProvider>,
    );
    expect(api.config.profile).toBe('standard');
    expect(api.config.dialogue.helpPrompt).toBe(false);
  });

  it('hystérésis : la sortie du mode guidé exige un score bas tenu 20 s, puis une frontière d’étape', () => {
    const { rerender } = renderProvider({ ...baseInputs, language: 'ru' });
    act(() => api.collector.inject({ actionDelays: slowDelays(THRESHOLDS.slowness.windowSize) }));
    act(() => api.markStepBoundary('a'));
    expect(api.context.guidanceMode).toBe('guided');

    // Le client passe au français et accélère : le score tombe à 0, sous le seuil de sortie
    act(() => api.collector.reset());
    rerender(
      <AdaptationProvider inputs={{ ...baseInputs, language: 'fr' }} now={() => now}>
        <Probe />
      </AdaptationProvider>,
    );
    expect(api.inferred.mode).toBe('guided');

    now += THRESHOLDS.guidance.exitStabilityMs - 1000;
    act(() => vi.advanceTimersByTime(1000));
    expect(api.inferred.mode).toBe('guided');

    now += 2000;
    act(() => vi.advanceTimersByTime(1000));
    expect(api.inferred.mode).toBe('standard');
    // Le retour au standard n'est appliqué qu'à la frontière d'étape suivante
    expect(api.context.guidanceMode).toBe('guided');
    act(() => api.markStepBoundary('b'));
    expect(api.context.guidanceMode).toBe('standard');
  });

  it('préserve l’état saisi quand la configuration change (aucun remontage)', () => {
    const { rerender } = renderProvider(baseInputs);
    const input = screen.getByTestId('typed') as HTMLInputElement;
    input.value = '12 ';
    rerender(
      <AdaptationProvider
        inputs={{ ...baseInputs, language: 'ru', helpAnswer: 'accepted' }}
        now={() => now}
      >
        <Probe />
      </AdaptationProvider>,
    );
    expect(screen.getByTestId('typed')).toBe(input);
    expect((screen.getByTestId('typed') as HTMLInputElement).value).toBe('12 ');
  });
});
