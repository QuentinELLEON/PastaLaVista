import type { Condition, RuleValue } from '@pastalavista/shared';
import type { Facts } from '../context/types';
import { resolveThreshold, SCORE_EPSILON, type Thresholds } from '../rules/thresholds.config';

function isThresholdRef(value: RuleValue): value is { threshold: string } {
  return typeof value === 'object';
}

function resolveValue(value: RuleValue, thresholds: Thresholds): number | string | boolean {
  return isThresholdRef(value) ? resolveThreshold(value.threshold, thresholds) : value;
}

function compare(
  actual: number | string | boolean,
  op: 'eq' | 'neq' | 'gte' | 'lt',
  expected: number | string | boolean,
): boolean {
  switch (op) {
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gte':
      return Number(actual) >= Number(expected) - SCORE_EPSILON;
    case 'lt':
      return Number(actual) < Number(expected) - SCORE_EPSILON;
  }
}

/** Évalue un arbre de conditions déclaratif sur les faits du contexte. */
export function evaluateCondition(
  condition: Condition,
  facts: Facts,
  thresholds: Thresholds,
): boolean {
  if ('all' in condition)
    return condition.all.every((c) => evaluateCondition(c, facts, thresholds));
  if ('any' in condition) return condition.any.some((c) => evaluateCondition(c, facts, thresholds));
  if ('not' in condition) return !evaluateCondition(condition.not, facts, thresholds);
  return compare(facts[condition.fact], condition.op, resolveValue(condition.value, thresholds));
}

export { resolveValue };
