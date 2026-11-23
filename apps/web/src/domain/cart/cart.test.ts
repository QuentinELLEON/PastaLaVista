import { describe, expect, it } from 'vitest';
import type { OrderLine } from '@pastalavista/shared';
import { catalog } from '../../../test/catalogFixture';
import {
  addLine,
  addOptionToLine,
  cartItemCount,
  cartTotals,
  describeLine,
  setLineQuantity,
} from './cart';
import { EMPTY_PLATE, lineToPlate, plateToLine, plateTotals, summarizePlate } from './plate';
import { pickUpsell } from './upsell';

const line = (id: string, overrides: Partial<OrderLine> = {}): OrderLine => ({
  id,
  productId: 'pasta-penne',
  quantity: 1,
  extraXl: false,
  options: [{ productId: 'sauce-tomate', quantity: 1 }],
  ...overrides,
});

describe('panier', () => {
  it('fusionne une ligne identique en augmentant la quantité', () => {
    const cart = addLine([line('a')], line('b'));
    expect(cart).toHaveLength(1);
    expect(cart[0]?.quantity).toBe(2);
  });

  it('garde séparées deux lignes aux options différentes', () => {
    const other = line('b', { options: [{ productId: 'sauce-bolognaise', quantity: 1 }] });
    expect(addLine([line('a')], other)).toHaveLength(2);
  });

  it('supprime la ligne quand la quantité tombe à zéro', () => {
    expect(setLineQuantity([line('a', { quantity: 2 })], 'a', 0)).toEqual([]);
    expect(setLineQuantity([line('a')], 'a', 3)[0]?.quantity).toBe(3);
  });

  it('ajoute une option (puis incrémente sa quantité)', () => {
    let cart = addOptionToLine([line('a')], 'a', 'top-oeuf');
    cart = addOptionToLine(cart, 'a', 'top-oeuf');
    expect(cart[0]?.options.find((o) => o.productId === 'top-oeuf')?.quantity).toBe(2);
  });

  it('calcule totaux et nombre d’articles (référence : Penne + tomate + poulet = 11,00 €)', () => {
    const cart = [
      line('a', {
        options: [
          { productId: 'sauce-tomate', quantity: 1 },
          { productId: 'top-poulet', quantity: 1 },
        ],
      }),
    ];
    expect(cartTotals(cart, catalog).totalCents).toBe(1100);
    expect(
      cartItemCount([
        line('a', { quantity: 2 }),
        line('b', { productId: 'drink-eau', options: [] }),
      ]),
    ).toBe(3);
  });

  it('décrit une ligne : produit, XL, options avec quantité', () => {
    const label = describeLine(
      line('a', { extraXl: true, options: [{ productId: 'top-poulet', quantity: 2 }] }),
      catalog,
    );
    expect(label).toEqual({ title: 'Penne XL', details: 'Poulet grillé × 2' });
  });
});

describe('assiette', () => {
  const alexei = {
    pastaId: 'pasta-complete',
    extraXl: true,
    sauceId: 'sauce-bolognaise',
    toppings: { 'top-poulet': 2 },
    extras: {},
  };

  it('une assiette incomplète ne produit pas de ligne', () => {
    expect(plateToLine({ ...EMPTY_PLATE, pastaId: 'pasta-penne' }, 'x')).toBeNull();
  });

  it('reproduit l’assiette d’Alexovitch : 17,00 €, 1 300 kcal, 104 g', () => {
    expect(plateTotals(alexei, catalog)).toEqual({ totalCents: 1700, kcal: 1300, proteinG: 104 });
    const composed = plateToLine(alexei, 'l1');
    expect(composed && cartTotals([composed], catalog).totalCents).toBe(1700);
  });

  it('aller-retour ligne -> assiette -> ligne sans perte (état conservé)', () => {
    const original = plateToLine(alexei, 'l1');
    expect(original).not.toBeNull();
    const plate = lineToPlate(original as OrderLine, catalog);
    expect(plate).toEqual(alexei);
  });

  it('une composition populaire se développe en assiette modifiable', () => {
    const plate = lineToPlate(line('c', { productId: 'comp-classique', options: [] }), catalog);
    expect(plate).toMatchObject({ pastaId: 'pasta-penne', sauceId: 'sauce-tomate' });
  });

  it('résume l’assiette ligne par ligne (pâtes XL incluses)', () => {
    const summary = summarizePlate(alexei, catalog);
    expect(summary.map((entry) => entry.label)).toEqual([
      'Complètes XL',
      'Bolognaise',
      'Poulet grillé × 2',
    ]);
    expect(summary.reduce((sum, entry) => sum + entry.priceCents, 0)).toBe(1700);
  });
});

describe('vente additionnelle (RU2 / RU7)', () => {
  const plate = [line('a', { options: [{ productId: 'sauce-tomate', quantity: 1 }] })];

  it('générique : toutes les boissons', () => {
    expect(pickUpsell('generic', catalog, plate)?.products.map((p) => p.id)).toEqual([
      'drink-eau',
      'drink-jus',
    ]);
  });

  it('une seule suggestion pour l’habitué, et pas une boisson déjà dans le panier', () => {
    expect(pickUpsell('single', catalog, plate)?.products).toHaveLength(1);
    const withWater = [...plate, line('w', { productId: 'drink-eau', options: [] })];
    expect(pickUpsell('single', catalog, withWater)?.products[0]?.id).toBe('drink-jus');
  });

  it('liée au besoin : une protéine absente de l’assiette, ajoutée à cette assiette', () => {
    const offer = pickUpsell('need-based', catalog, plate);
    expect(offer).toMatchObject({ kind: 'protein', targetLineId: 'a' });
    expect(offer?.products[0]?.id).toBe('top-oeuf');
  });

  it('besoin : retombe sur une boisson s’il n’y a pas d’assiette', () => {
    expect(pickUpsell('need-based', catalog, [])?.kind).toBe('drink');
  });
});
