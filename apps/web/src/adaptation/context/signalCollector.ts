import { THRESHOLDS, type Thresholds } from '../rules/thresholds.config';
import type { Signals } from './types';

export type Listener = () => void;

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea, label, [role="button"]';
const BACK_SELECTOR = '[data-signal="back"]';

/**
 * Collecte les signaux de comportement (délais entre actions, retours, taps ratés, durée sur l'écran).
 * L'horloge est injectable pour des tests déterministes. Aucune donnée ne quitte la session.
 */
export class SignalCollector {
  private delays: Signals['actionDelays'] = [];
  private backCount = 0;
  private missedCount = 0;
  private screenId = 'default';
  private screenEnteredAt: number;
  private lastActionAt: number;
  private readonly listeners = new Set<Listener>();

  constructor(
    private readonly now: () => number = () => Date.now(),
    private readonly thresholds: Thresholds = THRESHOLDS,
  ) {
    this.screenEnteredAt = this.now();
    this.lastActionAt = this.screenEnteredAt;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Changement d'écran : le chronomètre de l'écran repart (le temps avant le premier tap est mesuré). */
  enterScreen(screenId: string): void {
    this.screenId = screenId;
    this.screenEnteredAt = this.now();
    this.emit();
  }

  /** Action volontaire du client (tap sur un bouton) : mesure le délai depuis l'action ou l'écran précédent. */
  recordAction(): void {
    const at = this.now();
    const delayMs = at - Math.max(this.lastActionAt, this.screenEnteredAt);
    this.delays = [...this.delays, { delayMs, referenceMs: this.referenceDelay() }].slice(
      -this.thresholds.slowness.windowSize,
    );
    this.lastActionAt = at;
    this.emit();
  }

  recordBack(): void {
    this.backCount += 1;
    this.emit();
  }

  recordMissedTap(): void {
    this.missedCount += 1;
    this.emit();
  }

  /** Classe un appui : bouton (action, éventuellement retour) ou zone morte (tap raté). */
  handlePointerTarget(target: EventTarget | null): void {
    if (!(target instanceof Element)) return;
    if (target.closest('[data-dev-tools]')) return;
    if (!target.closest(INTERACTIVE_SELECTOR)) {
      this.recordMissedTap();
      return;
    }
    if (target.closest(BACK_SELECTOR)) this.backCount += 1;
    this.recordAction();
  }

  snapshot(): Signals {
    return {
      actionDelays: this.delays,
      backAndForth: this.backCount,
      missedTaps: this.missedCount,
      screenDwellMs: this.now() - this.screenEnteredAt,
    };
  }

  reset(): void {
    this.delays = [];
    this.backCount = 0;
    this.missedCount = 0;
    this.lastActionAt = this.now();
    this.screenEnteredAt = this.lastActionAt;
    this.emit();
  }

  /** Outil de démonstration : injecte des signaux sans attendre un vrai comportement. */
  inject(partial: Partial<Omit<Signals, 'screenDwellMs'>>): void {
    if (partial.actionDelays) this.delays = partial.actionDelays;
    if (partial.backAndForth !== undefined) this.backCount = partial.backAndForth;
    if (partial.missedTaps !== undefined) this.missedCount = partial.missedTaps;
    this.emit();
  }

  private referenceDelay(): number {
    // « compose:sauce » -> référence de « compose » (l'étape précise ne change pas le délai attendu)
    const references: Record<string, number> = this.thresholds.referenceDelaysMs;
    const kind = this.screenId.split(':')[0] ?? 'default';
    return references[kind] ?? this.thresholds.referenceDelaysMs.default;
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }
}
