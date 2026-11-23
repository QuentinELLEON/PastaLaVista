import { DEFAULT_LOCALE, type Locale } from '@pastalavista/shared';
import { en } from './en';
import { fr, type Dictionary, type DictionaryKey } from './fr';
import { ru } from './ru';

export const DICTIONARIES: Record<Locale, Dictionary> = { fr, en, ru };

export type TranslationParams = Record<string, string | number>;
export type Translate = (key: DictionaryKey, params?: TranslationParams) => string;

/** Remplace les {marqueurs} par leurs valeurs ; un marqueur inconnu reste visible pour être repéré. */
export function translate(locale: Locale, key: DictionaryKey, params?: TranslationParams): string {
  const template = DICTIONARIES[locale][key] ?? DICTIONARIES[DEFAULT_LOCALE][key];
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (marker, name: string) => String(params[name] ?? marker));
}

export function createTranslator(locale: Locale): Translate {
  return (key, params) => translate(locale, key, params);
}

export type { DictionaryKey };
