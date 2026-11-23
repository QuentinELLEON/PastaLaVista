import type { Rule, UiConfig, UiConfigPatch } from '@pastalavista/shared';
import { toFacts, type Context } from '../context/types';
import { RULES } from '../rules/rules.data';
import { THRESHOLDS, resolveThreshold, type Thresholds } from '../rules/thresholds.config';
import { evaluateCondition } from './conditions';
import { standardUiConfig } from './defaultConfig';

export interface Explanation {
  config: UiConfig;
  /** Règles déclenchées, de la moins à la plus prioritaire (la dernière l'emporte en cas de conflit). */
  firedRuleIds: string[];
}

/**
 * Interface du moteur : l'implémentation à règles statiques ci-dessous peut être remplacée
 * par une implémentation fondée sur l'IA sans toucher aux composants.
 */
export interface AdaptationEngine {
  decide(context: Context): UiConfig;
  explain?(context: Context): Explanation;
}

type Section = 'content' | 'presentation' | 'dialogue';
const SECTIONS: readonly Section[] = ['content', 'presentation', 'dialogue'];

function resolveSection<T extends object>(section: T, thresholds: Thresholds): Partial<T> {
  const resolved: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(section)) {
    const isRef = typeof value === 'object' && value !== null && 'threshold' in value;
    resolved[key] = isRef
      ? resolveThreshold((value as { threshold: string }).threshold, thresholds)
      : value;
  }
  return resolved as Partial<T>;
}

/** Superpose un correctif : les valeurs du correctif remplacent celles de la config, section par section. */
export function applyPatch(
  config: UiConfig,
  patch: UiConfigPatch,
  thresholds: Thresholds,
): UiConfig {
  const next: UiConfig = {
    ...config,
    ...(patch.profile ? { profile: patch.profile } : {}),
    ...(patch.layout ? { layout: patch.layout } : {}),
    ...(patch.language ? { language: patch.language } : {}),
  };
  for (const section of SECTIONS) {
    const part = patch[section];
    if (part) next[section] = { ...config[section], ...resolveSection(part, thresholds) } as never;
  }
  return next;
}

export class StaticRulesEngine implements AdaptationEngine {
  private readonly rules: readonly Rule[];

  constructor(
    rules: readonly Rule[] = RULES,
    private readonly thresholds: Thresholds = THRESHOLDS,
  ) {
    // Tri stable par priorité croissante : en cas de conflit, la dernière règle appliquée l'emporte
    this.rules = [...rules].sort((a, b) => a.priority - b.priority);
  }

  decide(context: Context): UiConfig {
    return this.explain(context).config;
  }

  explain(context: Context): Explanation {
    const facts = toFacts(context);
    const fired = this.rules.filter((rule) => evaluateCondition(rule.when, facts, this.thresholds));
    // La langue est une donnée du contexte (l'interface traduite en découle), pas un correctif
    const base = standardUiConfig(context.language);
    const config = fired.reduce((acc, rule) => applyPatch(acc, rule.patch, this.thresholds), base);
    return { config, firedRuleIds: fired.map((rule) => rule.id) };
  }
}
