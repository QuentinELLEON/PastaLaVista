import type {
  Device,
  DraftProblem,
  FactName,
  GuidanceMode,
  HelpAnswer,
  Locale,
} from '@pastalavista/shared';

/** Délai entre deux actions du client, avec le délai de référence de l'écran où il a été mesuré. */
export interface ActionDelay {
  delayMs: number;
  referenceMs: number;
}

/** Signaux de comportement : conservés le temps de la session seulement, jamais rattachés à une personne. */
export interface Signals {
  actionDelays: ActionDelay[];
  backAndForth: number;
  missedTaps: number;
  screenDwellMs: number;
}

/** Contexte d'usage normalisé : entrée du moteur d'adaptation. */
export interface Context {
  device: Device;
  language: Locale;
  customerId: string | null;
  customerOrderCount: number;
  signals: Signals;
  guidanceScore: number;
  guidanceMode: GuidanceMode;
  helpAnswer: HelpAnswer;
  helpRequested: boolean;
  highContrast: boolean;
  handoverReceived: boolean;
  draftProblem: DraftProblem;
}

export type Facts = Record<FactName, string | number | boolean>;

/** Aplatit le contexte en faits évaluables par les règles. */
export function toFacts(context: Context): Facts {
  return {
    device: context.device,
    language: context.language,
    customerOrderCount: context.customerOrderCount,
    guidanceScore: context.guidanceScore,
    guidanceMode: context.guidanceMode,
    helpAnswer: context.helpAnswer,
    helpRequested: context.helpRequested,
    highContrast: context.highContrast,
    handoverReceived: context.handoverReceived,
    draftProblem: context.draftProblem,
  };
}

export const EMPTY_SIGNALS: Signals = {
  actionDelays: [],
  backAndForth: 0,
  missedTaps: 0,
  screenDwellMs: 0,
};
