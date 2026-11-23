/**
 * Seuils et pondérations d'adaptation : AUCUNE de ces valeurs n'est codée dans un composant.
 * Ce sont des hypothèses de maquette à calibrer (voir docs/adaptation-alexei-lenteur.md).
 */
export const THRESHOLDS = {
  /** Nombre minimal de commandes pour être reconnu comme habitué (RU1). */
  regularMinOrders: 3,
  guidance: {
    /** Poids du score de guidage, somme = 1. */
    weights: { language: 0.3, slowness: 0.3, backAndForth: 0.2, missedTaps: 0.2 },
    /** Hystérésis : entrée à 0,6, sortie sous 0,3 tenue pendant la durée de stabilité. */
    enterScore: 0.6,
    exitScore: 0.3,
    exitStabilityMs: 20_000,
  },
  slowness: {
    /** Nombre d'actions observées avant de conclure à la lenteur. */
    windowSize: 4,
    /** Lent = délai médian supérieur à 2 fois le délai de référence de l'écran. */
    factor: 2,
  },
  /** Nombre d'événements pour lequel le critère est considéré comme atteint (poids plein). */
  backAndForth: { saturationCount: 3 },
  missedTaps: { saturationCount: 3 },
  /** Délais de référence d'un client « moyen », par écran (ms). */
  referenceDelaysMs: {
    default: 6000,
    home: 4000,
    language: 4000,
    concept: 8000,
    menu: 8000,
    compose: 10_000,
    pay: 10_000,
    retrieve: 8000,
    done: 10_000,
  },
  inactivity: { standardMs: 30_000, guidedMs: 90_000, warningMs: 10_000 },
  transitionMs: 300,
} as const;

export type Thresholds = typeof THRESHOLDS;

/** Tolérance pour comparer des scores décimaux (0,3 + 0,3 doit atteindre 0,6). */
export const SCORE_EPSILON = 1e-9;

export function resolveThreshold(
  path: string,
  thresholds: Thresholds = THRESHOLDS,
): number | string | boolean {
  let current: unknown = thresholds;
  for (const key of path.split('.')) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      throw new Error(`Seuil inconnu : ${path}`);
    }
    current = (current as Record<string, unknown>)[key];
  }
  if (typeof current === 'object') throw new Error(`Seuil non scalaire : ${path}`);
  return current as number | string | boolean;
}
