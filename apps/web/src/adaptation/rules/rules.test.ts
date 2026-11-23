import { describe, expect, it } from 'vitest';
import type { Rule } from '@pastalavista/shared';
import { RULES } from './rules.data';
import { THRESHOLDS, resolveThreshold } from './thresholds.config';
import { validateRules } from './validateRules';

describe('rules.data', () => {
  it('contient RU1-RU8 et RD1-RD6 du catalogue (RD6 en deux règles)', () => {
    const ids = RULES.map((rule) => rule.id);
    for (const expected of [
      'RU1',
      'RU2',
      'RU3',
      'RU4',
      'RU5',
      'RU6',
      'RU7',
      'RU8',
      'RD1',
      'RD2',
      'RD3',
      'RD4',
      'RD5',
    ]) {
      expect(ids).toContain(expected);
    }
    expect(ids.filter((id) => id.startsWith('RD6'))).toHaveLength(2);
  });

  it('est valide : schéma, identifiants uniques, seuils existants, axes autorisés', () => {
    expect(validateRules(RULES)).toEqual([]);
  });

  it('le dispositif décide de la disposition : aucune règle « utilisateur » n’écrit dans layout', () => {
    for (const rule of RULES.filter((r) => r.axis === 'user')) {
      expect(Object.keys(rule.patch)).not.toContain('layout');
    }
  });

  it('refuse une règle utilisateur qui écrit la disposition', () => {
    const bad: Rule = { ...RULES[1]!, id: 'BAD', patch: { layout: 'smartphone' } };
    expect(validateRules([bad])).toContain("BAD : l'axe « user » ne peut pas écrire « layout »");
  });

  it('refuse un seuil inexistant et un identifiant en double', () => {
    const missing: Rule = {
      ...RULES[1]!,
      id: 'X',
      when: { fact: 'guidanceScore', op: 'gte', value: { threshold: 'nope' } },
    };
    expect(validateRules([missing])).toContain('X : seuil « nope » introuvable');
    expect(validateRules([RULES[1]!, RULES[1]!])).toContain('RU1 : identifiant en double');
  });
});

describe('thresholds.config', () => {
  it('reprend les hypothèses du projet', () => {
    expect(THRESHOLDS.regularMinOrders).toBe(3);
    expect(THRESHOLDS.guidance).toMatchObject({
      enterScore: 0.6,
      exitScore: 0.3,
      exitStabilityMs: 20_000,
    });
    expect(THRESHOLDS.guidance.weights).toEqual({
      language: 0.3,
      slowness: 0.3,
      backAndForth: 0.2,
      missedTaps: 0.2,
    });
    expect(THRESHOLDS.slowness.factor).toBe(2);
    expect(THRESHOLDS.inactivity).toMatchObject({ standardMs: 30_000, guidedMs: 90_000 });
  });

  it('les poids du score de guidage totalisent 1', () => {
    const total = Object.values(THRESHOLDS.guidance.weights).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it('résout un seuil par son chemin et refuse un chemin inconnu', () => {
    expect(resolveThreshold('inactivity.guidedMs')).toBe(90_000);
    expect(() => resolveThreshold('inactivity.nope')).toThrow(/inconnu/);
    expect(() => resolveThreshold('inactivity')).toThrow(/scalaire/);
  });
});
