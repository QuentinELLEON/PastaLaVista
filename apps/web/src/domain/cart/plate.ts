import {
  XL_SURCHARGE_CENTS,
  computeTotals,
  type OrderLine,
  type OrderLineOption,
  type Totals,
} from '@pastalavista/shared';
import type { Catalog } from '../catalog/catalog';

export const PLATE_STEPS = ['pasta', 'sauce', 'toppings', 'extras'] as const;
export type PlateStep = (typeof PLATE_STEPS)[number];
/** Étape de vérification en plus, ajoutée par le parcours guidé (confirmation à chaque étape). */
export type ComposeStep = PlateStep | 'review';

/** Assiette en cours de composition (état conservé quand l'IHM s'adapte). */
export interface PlateDraft {
  pastaId: string | null;
  extraXl: boolean;
  sauceId: string | null;
  toppings: Record<string, number>;
  extras: Record<string, number>;
}

export const EMPTY_PLATE: PlateDraft = {
  pastaId: null,
  extraXl: false,
  sauceId: null,
  toppings: {},
  extras: {},
};

export function isPlateComplete(plate: PlateDraft): boolean {
  return plate.pastaId !== null && plate.sauceId !== null;
}

function toOptions(quantities: Record<string, number>): OrderLineOption[] {
  return Object.entries(quantities)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));
}

export function plateToLine(plate: PlateDraft, lineId: string): OrderLine | null {
  if (plate.pastaId === null || plate.sauceId === null) return null;
  return {
    id: lineId,
    productId: plate.pastaId,
    quantity: 1,
    extraXl: plate.extraXl,
    options: [
      { productId: plate.sauceId, quantity: 1 },
      ...toOptions(plate.toppings),
      ...toOptions(plate.extras),
    ],
  };
}

/** Totaux (prix, kcal, protéines) de l'assiette en cours, vides tant qu'il manque des pâtes. */
export function plateTotals(plate: PlateDraft, catalog: Catalog): Totals {
  if (plate.pastaId === null) return { totalCents: 0, kcal: 0, proteinG: 0 };
  const partial: OrderLine = {
    id: 'preview',
    productId: plate.pastaId,
    quantity: 1,
    extraXl: plate.extraXl,
    options: [
      ...(plate.sauceId ? [{ productId: plate.sauceId, quantity: 1 }] : []),
      ...toOptions(plate.toppings),
      ...toOptions(plate.extras),
    ],
  };
  return computeTotals([partial], catalog.index);
}

/** Reconstitue une assiette modifiable depuis une ligne (assiette libre ou composition populaire). */
export function lineToPlate(line: OrderLine, catalog: Catalog): PlateDraft {
  const plate: PlateDraft = { ...EMPTY_PLATE, toppings: {}, extras: {} };
  const parts: OrderLineOption[] = [{ productId: line.productId, quantity: 1 }, ...line.options];
  const base = catalog.byId.get(line.productId);
  const expanded =
    base?.kind === 'composition' ? [...base.compositionItems, ...line.options] : parts;
  for (const part of expanded) {
    const product = catalog.byId.get(part.productId);
    if (!product) continue;
    if (product.kind === 'pasta') plate.pastaId = product.id;
    else if (product.kind === 'sauce') plate.sauceId = product.id;
    else if (product.kind === 'topping') plate.toppings[product.id] = part.quantity;
    else if (product.kind === 'extra') plate.extras[product.id] = part.quantity;
  }
  plate.extraXl = line.extraXl;
  return plate;
}

export function setQuantity(
  quantities: Record<string, number>,
  productId: string,
  quantity: number,
): Record<string, number> {
  const next = { ...quantities };
  if (quantity <= 0) delete next[productId];
  else next[productId] = quantity;
  return next;
}

export interface PlateSummaryLine {
  id: string;
  label: string;
  priceCents: number;
}

/** Détail de l'assiette en cours (une ligne par choix) pour le panier permanent. */
export function summarizePlate(plate: PlateDraft, catalog: Catalog): PlateSummaryLine[] {
  const lines: PlateSummaryLine[] = [];
  const pasta = plate.pastaId ? catalog.byId.get(plate.pastaId) : undefined;
  if (pasta) {
    lines.push({
      id: pasta.id,
      label: `${pasta.name}${plate.extraXl ? ' XL' : ''}`,
      priceCents: pasta.priceCents + (plate.extraXl ? XL_SURCHARGE_CENTS : 0),
    });
  }
  const sauce = plate.sauceId ? catalog.byId.get(plate.sauceId) : undefined;
  if (sauce) lines.push({ id: sauce.id, label: sauce.name, priceCents: sauce.priceCents });
  for (const quantities of [plate.toppings, plate.extras]) {
    for (const [productId, quantity] of Object.entries(quantities)) {
      const product = catalog.byId.get(productId);
      if (!product) continue;
      lines.push({
        id: productId,
        label: quantity > 1 ? `${product.name} × ${quantity}` : product.name,
        priceCents: product.priceCents * quantity,
      });
    }
  }
  return lines;
}
