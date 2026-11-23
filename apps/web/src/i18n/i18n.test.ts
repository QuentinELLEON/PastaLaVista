import { describe, expect, it } from 'vitest';
import { LOCALES } from '@pastalavista/shared';
import { DICTIONARIES, translate } from './index';
import { fr } from './fr';

describe('i18n', () => {
  it('les trois langues ont exactement les mêmes clés', () => {
    const keys = Object.keys(fr).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(DICTIONARIES[locale]).sort()).toEqual(keys);
    }
  });

  it('aucune traduction vide', () => {
    for (const locale of LOCALES) {
      for (const [key, value] of Object.entries(DICTIONARIES[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe('');
      }
    }
  });

  it('les marqueurs {…} sont les mêmes dans toutes les langues', () => {
    const markers = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
    for (const [key, value] of Object.entries(fr)) {
      for (const locale of LOCALES) {
        expect(markers(DICTIONARIES[locale][key as keyof typeof fr]), `${locale}:${key}`).toEqual(
          markers(value),
        );
      }
    }
  });

  it('interpole les paramètres', () => {
    expect(translate('fr', 'home.hello', { name: 'Jérémy' })).toBe('Bonjour Jérémy');
    expect(translate('ru', 'compose.stepOf', { current: 2, total: 5 })).toBe('Шаг 2 из 5');
  });

  it('les écrans d’Alexovitch sont en russe (cyrillique)', () => {
    expect(translate('ru', 'help.title')).toMatch(/[А-Яа-я]/);
    expect(translate('ru', 'pay.where1')).toMatch(/[А-Яа-я]/);
  });
});
