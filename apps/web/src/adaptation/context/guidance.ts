import type { GuidanceMode, Locale } from '@pastalavista/shared';
import { SCORE_EPSILON, THRESHOLDS, type Thresholds } from '../rules/thresholds.config';
import type { Signals } from './types';

export interface GuidanceScore {
  score: number;
  parts: { language: number; slowness: number; backAndForth: number; missedTaps: number };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  const low = sorted[middle - 1] ?? 0;
  const high = sorted[middle] ?? 0;
  return sorted.length % 2 === 0 ? (low + high) / 2 : high;
}

/**
 * Lenteur RELATIVE : on attend une fenêtre complète d'actions, puis on compare le délai médian
 * au délai de référence de l'écran (un client qui lit simplement le menu n'est pas classé lent).
 */
export function isSlow(signals: Signals, thresholds: Thresholds = THRESHOLDS): boolean {
  const { windowSize, factor } = thresholds.slowness;
  if (signals.actionDelays.length < windowSize) return false;
  const recent = signals.actionDelays.slice(-windowSize);
  const ratios = recent.map((sample) => sample.delayMs / sample.referenceMs);
  return median(ratios) > factor;
}

function saturate(count: number, saturationCount: number): number {
  return Math.min(count / saturationCount, 1);
}

/** Score de guidage dans [0, 1] : somme pondérée de critères croisés (langue, lenteur, hésitations, taps ratés). */
export function computeGuidanceScore(
  input: { language: Locale; signals: Signals },
  thresholds: Thresholds = THRESHOLDS,
): GuidanceScore {
  const { weights } = thresholds.guidance;
  const parts = {
    language: input.language === 'fr' ? 0 : 1,
    slowness: isSlow(input.signals, thresholds) ? 1 : 0,
    backAndForth: saturate(input.signals.backAndForth, thresholds.backAndForth.saturationCount),
    missedTaps: saturate(input.signals.missedTaps, thresholds.missedTaps.saturationCount),
  };
  const score =
    parts.language * weights.language +
    parts.slowness * weights.slowness +
    parts.backAndForth * weights.backAndForth +
    parts.missedTaps * weights.missedTaps;
  return { score, parts };
}

export interface HysteresisState {
  mode: GuidanceMode;
  /** Instant depuis lequel le score est sous le seuil de sortie (null si ce n'est pas le cas). */
  belowExitSinceMs: number | null;
}

export const INITIAL_HYSTERESIS: HysteresisState = { mode: 'standard', belowExitSinceMs: null };

/**
 * Hystérésis : on entre en mode guidé à `enterScore`, on en sort seulement quand le score reste
 * strictement sous `exitScore` pendant `exitStabilityMs`. Évite de basculer d'un mode à l'autre.
 */
export function nextGuidanceState(
  state: HysteresisState,
  score: number,
  nowMs: number,
  thresholds: Thresholds = THRESHOLDS,
): HysteresisState {
  const { enterScore, exitScore, exitStabilityMs } = thresholds.guidance;
  if (state.mode === 'standard') {
    return score >= enterScore - SCORE_EPSILON ? { mode: 'guided', belowExitSinceMs: null } : state;
  }
  if (score >= exitScore - SCORE_EPSILON) return { mode: 'guided', belowExitSinceMs: null };
  const since = state.belowExitSinceMs ?? nowMs;
  return nowMs - since >= exitStabilityMs
    ? { mode: 'standard', belowExitSinceMs: null }
    : { mode: 'guided', belowExitSinceMs: since };
}
