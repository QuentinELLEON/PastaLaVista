import { describe, expect, it } from 'vitest';
import tokensCss from './tokens.css?raw';

/** Vérifie les contrastes WCAG AA des couples texte/fond réellement utilisés (tokens.css). */
function readTokens(block: string): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1] as string] = (match[2] as string).toLowerCase();
  }
  return tokens;
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => {
    const value = parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (channels[0] ?? 0) + 0.7152 * (channels[1] ?? 0) + 0.0722 * (channels[2] ?? 0);
}

function ratio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return ((light as number) + 0.05) / ((dark as number) + 0.05);
}

const AA_TEXT = 4.5;
const rootBlock = tokensCss.slice(0, tokensCss.indexOf("[data-contrast='high']"));
const highBlock = tokensCss.slice(
  tokensCss.indexOf("[data-contrast='high']"),
  tokensCss.indexOf('@media'),
);
const base = readTokens(rootBlock);
const high = { ...base, ...readTokens(highBlock) };
const WHITE = '#ffffff';

describe('contrastes WCAG AA des tokens (texte 4,5:1)', () => {
  const pairs: Array<[string, string, string]> = [
    ['texte sur fond', 'ink', 'bg'],
    ['texte atténué sur fond', 'muted', 'bg'],
    ['texte atténué sur carte blanche', 'muted', 'surface'],
    ['rouge (bouton danger, prix) sur blanc', 'red', 'surface'],
    ['vert (nutrition, succès) sur blanc', 'green', 'surface'],
    ['vert sur vert pâle (badges kcal)', 'green', 'green-soft'],
    ['texte sur rouge pâle (sélection)', 'ink', 'red-soft'],
    ['texte sur accent pâle (visuels)', 'ink', 'accent-soft'],
    ['barre du haut (texte blanc sur encre)', 'surface', 'ink'],
    ['boutons d’outils (texte blanc sur encre 2)', 'surface', 'ink-2'],
  ];

  it.each(pairs)('%s', (_label, foreground, background) => {
    expect(ratio(base[foreground] as string, base[background] as string)).toBeGreaterThanOrEqual(
      AA_TEXT,
    );
  });

  it('bouton principal : texte blanc sur rouge', () => {
    expect(ratio(WHITE, base.red as string)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('bouton de succès et terminal actif : texte blanc sur vert', () => {
    expect(ratio(WHITE, base.green as string)).toBeGreaterThanOrEqual(AA_TEXT);
  });

  it('mode contraste élevé (accessibilité prioritaire) : tous les textes restent conformes, et plus contrastés', () => {
    expect(ratio(high.muted as string, high.bg as string)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(WHITE, high.red as string)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(high.green as string, high.bg as string)).toBeGreaterThanOrEqual(AA_TEXT);
    expect(ratio(high.muted as string, high.bg as string)).toBeGreaterThan(
      ratio(base.muted as string, base.bg as string),
    );
  });

  it('l’indicateur de focus est visible sur les fonds clairs (3:1)', () => {
    expect(ratio(base.focus as string, base.bg as string)).toBeGreaterThanOrEqual(3);
    expect(ratio(base.focus as string, base.surface as string)).toBeGreaterThanOrEqual(3);
  });
});
