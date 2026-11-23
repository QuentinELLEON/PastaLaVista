import { describe, expect, it } from 'vitest';
import { slowDelays } from '../../../test/factories';
import { THRESHOLDS } from '../rules/thresholds.config';
import {
  INITIAL_HYSTERESIS,
  computeGuidanceScore,
  isSlow,
  nextGuidanceState,
  type HysteresisState,
} from './guidance';
import { EMPTY_SIGNALS, type Signals } from './types';

const signals = (overrides: Partial<Signals> = {}): Signals => ({ ...EMPTY_SIGNALS, ...overrides });

describe('isSlow (lenteur relative)', () => {
  it('attend une fenêtre complète d’actions avant de conclure', () => {
    expect(isSlow(signals({ actionDelays: slowDelays(3) }))).toBe(false);
    expect(isSlow(signals({ actionDelays: slowDelays(4) }))).toBe(true);
  });

  it('compare au délai de référence de l’écran : lire le menu n’est pas être lent', () => {
    // 15 s sur un écran de référence 10 s = ratio 1,5 < 2
    expect(isSlow(signals({ actionDelays: slowDelays(4, 10_000, 1.5) }))).toBe(false);
    expect(isSlow(signals({ actionDelays: slowDelays(4, 10_000, 2.5) }))).toBe(true);
  });

  it('utilise la médiane : un seul délai extrême ne suffit pas', () => {
    const delays = [...slowDelays(1, 10_000, 30), ...slowDelays(3, 10_000, 0.5)];
    expect(isSlow(signals({ actionDelays: delays }))).toBe(false);
  });

  it('ne regarde que les dernières actions', () => {
    const delays = [...slowDelays(5, 10_000, 0.2), ...slowDelays(4, 10_000, 3)];
    expect(isSlow(signals({ actionDelays: delays }))).toBe(true);
  });
});

describe('computeGuidanceScore (pondérations 0,3 / 0,3 / 0,2 / 0,2)', () => {
  it('vaut 0 pour un francophone rapide', () => {
    expect(computeGuidanceScore({ language: 'fr', signals: signals() }).score).toBe(0);
  });

  it('la langue seule (0,3) ne déclenche pas le guidage', () => {
    const { score } = computeGuidanceScore({ language: 'ru', signals: signals() });
    expect(score).toBeCloseTo(0.3);
    expect(score).toBeLessThan(THRESHOLDS.guidance.enterScore);
  });

  it('langue + lenteur = 0,6 : seuil d’entrée atteint', () => {
    const { score } = computeGuidanceScore({
      language: 'ru',
      signals: signals({ actionDelays: slowDelays(4) }),
    });
    expect(score).toBeCloseTo(0.6);
  });

  it('un francophone très hésitant peut aussi atteindre le seuil (lenteur + retours + taps ratés = 0,7)', () => {
    const { score } = computeGuidanceScore({
      language: 'fr',
      signals: signals({ actionDelays: slowDelays(4), backAndForth: 3, missedTaps: 3 }),
    });
    expect(score).toBeCloseTo(0.7);
  });

  it('retours et taps ratés sont proportionnels puis plafonnés', () => {
    const half = computeGuidanceScore({ language: 'fr', signals: signals({ backAndForth: 1.5 }) });
    expect(half.parts.backAndForth).toBeCloseTo(0.5);
    const capped = computeGuidanceScore({ language: 'fr', signals: signals({ missedTaps: 30 }) });
    expect(capped.parts.missedTaps).toBe(1);
  });
});

describe('nextGuidanceState (hystérésis)', () => {
  const { enterScore, exitStabilityMs } = THRESHOLDS.guidance;

  it('entre en mode guidé au seuil d’entrée', () => {
    expect(nextGuidanceState(INITIAL_HYSTERESIS, enterScore - 0.01, 0).mode).toBe('standard');
    expect(nextGuidanceState(INITIAL_HYSTERESIS, enterScore, 0).mode).toBe('guided');
  });

  it('reste guidé entre les deux seuils (zone d’hystérésis : pas d’oscillation)', () => {
    const guided: HysteresisState = { mode: 'guided', belowExitSinceMs: null };
    expect(nextGuidanceState(guided, 0.45, 1000).mode).toBe('guided');
    expect(nextGuidanceState(guided, 0.3, 1000).mode).toBe('guided');
  });

  it('ne sort qu’après le délai de stabilité sous le seuil de sortie', () => {
    let state: HysteresisState = { mode: 'guided', belowExitSinceMs: null };
    state = nextGuidanceState(state, 0.1, 0);
    expect(state).toEqual({ mode: 'guided', belowExitSinceMs: 0 });
    state = nextGuidanceState(state, 0.1, exitStabilityMs - 1);
    expect(state.mode).toBe('guided');
    state = nextGuidanceState(state, 0.1, exitStabilityMs);
    expect(state.mode).toBe('standard');
  });

  it('une remontée du score pendant l’attente annule la sortie', () => {
    let state: HysteresisState = { mode: 'guided', belowExitSinceMs: null };
    state = nextGuidanceState(state, 0.1, 0);
    state = nextGuidanceState(state, 0.4, 5000);
    expect(state).toEqual({ mode: 'guided', belowExitSinceMs: null });
    state = nextGuidanceState(state, 0.1, 6000);
    expect(state.belowExitSinceMs).toBe(6000);
  });
});
