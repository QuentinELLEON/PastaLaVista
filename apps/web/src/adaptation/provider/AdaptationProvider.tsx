import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type {
  Device,
  DraftProblem,
  GuidanceMode,
  HelpAnswer,
  Locale,
  UiConfig,
} from '@pastalavista/shared';
import { ADAPTATION_TICK_MS } from '../../shared/constants';
import { INITIAL_HYSTERESIS, computeGuidanceScore, nextGuidanceState } from '../context/guidance';
import { SignalCollector } from '../context/signalCollector';
import type { Context } from '../context/types';
import { StaticRulesEngine, type AdaptationEngine } from '../engine/engine';
import { STANDARD_UI_CONFIG } from '../engine/defaultConfig';
import { THRESHOLDS } from '../rules/thresholds.config';

/** Ce que l'application sait du client et de son appareil : l'unique entrée du fournisseur. */
export interface AdaptationInputs {
  device: Device;
  language: Locale;
  customerId: string | null;
  customerOrderCount: number;
  helpAnswer: HelpAnswer;
  helpRequested: boolean;
  highContrast: boolean;
  handoverReceived: boolean;
  draftProblem: DraftProblem;
}

interface Guidance {
  score: number;
  mode: GuidanceMode;
}

export interface AdaptationValue {
  /** Configuration appliquée à l'IHM. */
  config: UiConfig;
  context: Context;
  firedRuleIds: string[];
  /** Mode de guidage inféré en ce moment (peut précéder le mode appliqué jusqu'à la prochaine frontière d'étape). */
  inferred: Guidance;
  collector: SignalCollector;
  /** À appeler quand l'écran ou l'étape change : c'est là que le profil inféré est appliqué. */
  markStepBoundary: (screenId: string) => void;
  /** Applique immédiatement un mode de guidage (par défaut le mode inféré) : démonstration, réponse explicite du client. */
  commitNow: (mode?: GuidanceMode) => void;
  /** Repart d'un profil neutre (fin de session, changement de persona en démonstration). */
  resetGuidance: () => void;
}

const AdaptationContext = createContext<AdaptationValue | null>(null);
const defaultEngine = new StaticRulesEngine();

interface Props {
  inputs: AdaptationInputs;
  children: ReactNode;
  engine?: AdaptationEngine;
  collector?: SignalCollector;
  now?: () => number;
}

/**
 * Fournit la configuration d'IHM décidée par le moteur.
 * - Les faits EXPLICITES (langue, compte, contraste, réponse à l'aide, appareil) s'appliquent tout de suite.
 * - Le profil déduit du COMPORTEMENT (mode guidé) ne s'applique qu'aux frontières d'étape,
 *   après hystérésis, jamais au milieu d'un choix.
 */
export function AdaptationProvider({
  inputs,
  children,
  engine = defaultEngine,
  collector,
  now = Date.now,
}: Props) {
  const ownCollector = useMemo(() => collector ?? new SignalCollector(now), [collector, now]);
  const [signals, setSignals] = useState(() => ownCollector.snapshot());
  const [inferred, setInferred] = useState<Guidance>({ score: 0, mode: 'standard' });
  const [appliedMode, setAppliedMode] = useState<GuidanceMode>('standard');
  const hysteresis = useRef(INITIAL_HYSTERESIS);
  const inferredRef = useRef(inferred);
  inferredRef.current = inferred;

  useEffect(
    () => ownCollector.subscribe(() => setSignals(ownCollector.snapshot())),
    [ownCollector],
  );

  // Écoute globale des appuis : boutons = actions, zones mortes = taps ratés
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => ownCollector.handlePointerTarget(event.target);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [ownCollector]);

  // Recalcule le score et l'hystérésis à chaque signal et à chaque seconde (la sortie dépend du temps)
  const evaluate = useCallback(() => {
    const { score } = computeGuidanceScore({ language: inputs.language, signals });
    hysteresis.current = nextGuidanceState(hysteresis.current, score, now(), THRESHOLDS);
    const mode = hysteresis.current.mode;
    setInferred((previous) =>
      previous.score === score && previous.mode === mode ? previous : { score, mode },
    );
  }, [inputs.language, signals, now]);

  useEffect(evaluate, [evaluate]);
  useEffect(() => {
    const id = window.setInterval(evaluate, ADAPTATION_TICK_MS);
    return () => window.clearInterval(id);
  }, [evaluate]);

  const markStepBoundary = useCallback(
    (screenId: string) => {
      ownCollector.enterScreen(screenId);
      setAppliedMode(inferredRef.current.mode);
    },
    [ownCollector],
  );
  const commitNow = useCallback(
    (mode?: GuidanceMode) => setAppliedMode(mode ?? inferredRef.current.mode),
    [],
  );

  const resetGuidance = useCallback(() => {
    hysteresis.current = INITIAL_HYSTERESIS;
    setInferred({ score: 0, mode: 'standard' });
    setAppliedMode('standard');
  }, []);

  const context = useMemo<Context>(
    () => ({
      device: inputs.device,
      language: inputs.language,
      customerId: inputs.customerId,
      customerOrderCount: inputs.customerOrderCount,
      signals,
      guidanceScore: inferred.score,
      guidanceMode: appliedMode,
      helpAnswer: inputs.helpAnswer,
      helpRequested: inputs.helpRequested,
      highContrast: inputs.highContrast,
      handoverReceived: inputs.handoverReceived,
      draftProblem: inputs.draftProblem,
    }),
    [inputs, signals, inferred.score, appliedMode],
  );

  const decision = useMemo(() => {
    const explanation = engine.explain?.(context);
    return {
      config: explanation?.config ?? engine.decide(context),
      fired: explanation?.firedRuleIds ?? [],
    };
  }, [engine, context]);

  const value = useMemo<AdaptationValue>(
    () => ({
      config: decision.config,
      context,
      firedRuleIds: decision.fired,
      inferred,
      collector: ownCollector,
      markStepBoundary,
      commitNow,
      resetGuidance,
    }),
    [decision, context, inferred, ownCollector, markStepBoundary, commitNow, resetGuidance],
  );

  return <AdaptationContext.Provider value={value}>{children}</AdaptationContext.Provider>;
}

export function useAdaptation(): AdaptationValue {
  const value = useContext(AdaptationContext);
  if (!value) throw new Error('useAdaptation doit être utilisé dans un AdaptationProvider');
  return value;
}

/** Configuration d'IHM courante ; l'IHM standard sert de repli si aucun fournisseur n'est monté (moteur désactivé). */
export function useUiConfig(): UiConfig {
  const value = useContext(AdaptationContext);
  return value?.config ?? STANDARD_UI_CONFIG;
}

/** Signale une frontière d'étape à chaque changement d'écran (ou d'étape de composition). */
export function useStepBoundary(screenId: string): void {
  const value = useContext(AdaptationContext);
  const mark = value?.markStepBoundary;
  useEffect(() => {
    mark?.(screenId);
  }, [mark, screenId]);
}
