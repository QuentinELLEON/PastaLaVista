import {
  RULE_AXIS_WRITABLE_KEYS,
  ruleSchema,
  type Condition,
  type Rule,
  type RuleValue,
} from '@pastalavista/shared';
import { THRESHOLDS, resolveThreshold, type Thresholds } from './thresholds.config';

function collectRefs(value: unknown, found: string[]): void {
  if (typeof value !== 'object' || value === null) return;
  if ('threshold' in value && typeof (value as { threshold: unknown }).threshold === 'string') {
    found.push((value as { threshold: string }).threshold);
    return;
  }
  Object.values(value).forEach((child) => collectRefs(child, found));
}

function conditionValues(condition: Condition, out: RuleValue[]): void {
  if ('all' in condition) condition.all.forEach((c) => conditionValues(c, out));
  else if ('any' in condition) condition.any.forEach((c) => conditionValues(c, out));
  else if ('not' in condition) conditionValues(condition.not, out);
  else out.push(condition.value);
}

/**
 * Vérifie la cohérence des règles-données : schéma, identifiants uniques, seuils existants,
 * et surtout la répartition des pouvoirs (le dispositif décide de la disposition,
 * l'utilisateur ne peut pas écrire dans `layout`). Renvoie la liste des problèmes (vide = valide).
 */
export function validateRules(
  rules: readonly Rule[],
  thresholds: Thresholds = THRESHOLDS,
): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();
  for (const rule of rules) {
    const parsed = ruleSchema.safeParse(rule);
    if (!parsed.success) problems.push(`${rule.id} : schéma invalide`);
    if (seen.has(rule.id)) problems.push(`${rule.id} : identifiant en double`);
    seen.add(rule.id);

    const writable = RULE_AXIS_WRITABLE_KEYS[rule.axis];
    for (const key of Object.keys(rule.patch)) {
      if (!(writable as readonly string[]).includes(key)) {
        problems.push(`${rule.id} : l'axe « ${rule.axis} » ne peut pas écrire « ${key} »`);
      }
    }

    const refs: string[] = [];
    const values: RuleValue[] = [];
    conditionValues(rule.when, values);
    values.forEach((value) => collectRefs(value, refs));
    collectRefs(rule.patch, refs);
    for (const ref of refs) {
      try {
        resolveThreshold(ref, thresholds);
      } catch {
        problems.push(`${rule.id} : seuil « ${ref} » introuvable`);
      }
    }
  }
  return problems;
}
