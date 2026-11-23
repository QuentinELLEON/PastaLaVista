import { describe, expect, it } from 'vitest';
import {
  computeTotals,
  indexProducts,
  normalizeDraftCode,
  UnknownProductError,
  type OrderLineInput,
  type PricingProduct,
} from '../src';

const product = (overrides: Partial<PricingProduct> & { id: string }): PricingProduct => ({
  kind: 'topping',
  priceCents: 0,
  kcal: 0,
  proteinG: 0,
  xlKcal: null,
  xlProteinG: null,
  compositionItems: [],
  ...overrides,
});

const products = indexProducts([
  product({
    id: 'complete',
    kind: 'pasta',
    priceCents: 900,
    kcal: 480,
    proteinG: 19,
    xlKcal: 720,
    xlProteinG: 28,
  }),
  product({ id: 'bolognaise', kind: 'sauce', priceCents: 100, kcal: 250, proteinG: 14 }),
  product({ id: 'poulet', priceCents: 250, kcal: 165, proteinG: 31 }),
  product({ id: 'oeuf', priceCents: 100, kcal: 78, proteinG: 6 }),
  product({ id: 'penne', kind: 'pasta', priceCents: 850, kcal: 420, proteinG: 14 }),
  product({ id: 'tomate', kind: 'sauce' }),
  product({
    id: 'classique',
    kind: 'composition',
    priceCents: 950,
    compositionItems: [
      { productId: 'penne', quantity: 1 },
      { productId: 'tomate', quantity: 1 },
    ],
  }),
]);

const alexeiPlate: OrderLineInput = {
  productId: 'complete',
  quantity: 1,
  extraXl: true,
  options: [
    { productId: 'bolognaise', quantity: 1 },
    { productId: 'poulet', quantity: 2 },
  ],
};

describe('computeTotals', () => {
  it("reproduit l'assiette d'Alexovitch : 17,00 €, 1 300 kcal, 104 g de protéines", () => {
    expect(computeTotals([alexeiPlate], products)).toEqual({
      totalCents: 1700,
      kcal: 1300,
      proteinG: 104,
    });
  });

  it("ajoute l'œuf : 18,00 €, 1 378 kcal, 110 g", () => {
    const withEgg = {
      ...alexeiPlate,
      options: [...alexeiPlate.options, { productId: 'oeuf', quantity: 1 }],
    };
    expect(computeTotals([withEgg], products)).toEqual({
      totalCents: 1800,
      kcal: 1378,
      proteinG: 110,
    });
  });

  it('applique la quantité de la ligne au prix et à la nutrition', () => {
    const line: OrderLineInput = { productId: 'penne', quantity: 3, extraXl: false, options: [] };
    expect(computeTotals([line], products)).toEqual({ totalCents: 2550, kcal: 1260, proteinG: 42 });
  });

  it("utilise le prix fixe d'une composition et somme sa nutrition", () => {
    const line: OrderLineInput = {
      productId: 'classique',
      quantity: 1,
      extraXl: false,
      options: [],
    };
    expect(computeTotals([line], products)).toEqual({ totalCents: 950, kcal: 420, proteinG: 14 });
  });

  it('refuse un produit inconnu', () => {
    const line: OrderLineInput = { productId: 'inconnu', quantity: 1, extraXl: false, options: [] };
    expect(() => computeTotals([line], products)).toThrow(UnknownProductError);
  });
});

describe('normalizeDraftCode', () => {
  it.each([
    ['PL-4821', 'PL-4821'],
    [' pl-4821 ', 'PL-4821'],
    ['4821', 'PL-4821'],
    ['PL4821', 'PL-4821'],
  ])('normalise %s', (raw, expected) => {
    expect(normalizeDraftCode(raw)).toBe(expected);
  });

  it.each(['PL-48', 'abcd', ''])('rejette « %s »', (raw) => {
    expect(normalizeDraftCode(raw)).toBeNull();
  });
});
