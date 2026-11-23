import {
  MAX_LINE_QUANTITY,
  computeTotals,
  type OrderLine,
  type OrderLineInput,
  type Totals,
} from '@pastalavista/shared';
import type { Catalog } from '../catalog/catalog';

function sameOptions(a: OrderLine, b: OrderLine): boolean {
  if (a.options.length !== b.options.length) return false;
  return a.options.every((option) =>
    b.options.some(
      (other) => other.productId === option.productId && other.quantity === option.quantity,
    ),
  );
}

function isSameLine(a: OrderLine, b: OrderLine): boolean {
  return a.productId === b.productId && a.extraXl === b.extraXl && sameOptions(a, b);
}

/** Ajoute une ligne ; une ligne identique à une existante augmente simplement sa quantité. */
export function addLine(cart: OrderLine[], line: OrderLine): OrderLine[] {
  const existing = cart.find((candidate) => isSameLine(candidate, line));
  if (!existing) return [...cart, line];
  return cart.map((candidate) =>
    candidate.id === existing.id
      ? { ...candidate, quantity: Math.min(candidate.quantity + line.quantity, MAX_LINE_QUANTITY) }
      : candidate,
  );
}

/** Quantité à 0 ou moins : la ligne disparaît. */
export function setLineQuantity(cart: OrderLine[], lineId: string, quantity: number): OrderLine[] {
  if (quantity <= 0) return cart.filter((line) => line.id !== lineId);
  const capped = Math.min(quantity, MAX_LINE_QUANTITY);
  return cart.map((line) => (line.id === lineId ? { ...line, quantity: capped } : line));
}

export function addOptionToLine(cart: OrderLine[], lineId: string, productId: string): OrderLine[] {
  return cart.map((line) => {
    if (line.id !== lineId) return line;
    const existing = line.options.find((option) => option.productId === productId);
    const options = existing
      ? line.options.map((option) =>
          option.productId === productId ? { ...option, quantity: option.quantity + 1 } : option,
        )
      : [...line.options, { productId, quantity: 1 }];
    return { ...line, options };
  });
}

export function replaceLine(cart: OrderLine[], lineId: string, line: OrderLine): OrderLine[] {
  return cart.map((candidate) => (candidate.id === lineId ? line : candidate));
}

export function cartTotals(cart: OrderLine[], catalog: Catalog): Totals {
  return computeTotals(cart, catalog.index);
}

export function cartItemCount(cart: OrderLine[]): number {
  return cart.reduce((sum, line) => sum + line.quantity, 0);
}

export interface LineLabel {
  title: string;
  details: string;
}

/** Libellé lisible : produit de base (+XL) puis options, avec « × n » au-delà d'une portion. */
export function describeLine(line: OrderLine, catalog: Catalog): LineLabel {
  const base = catalog.byId.get(line.productId);
  const title = `${base?.name ?? line.productId}${line.extraXl ? ' XL' : ''}`;
  const details = line.options
    .map((option) => {
      const name = catalog.byId.get(option.productId)?.name ?? option.productId;
      return option.quantity > 1 ? `${name} × ${option.quantity}` : name;
    })
    .join(' · ');
  return { title, details };
}

/** Lignes à envoyer à l'API : les identifiants locaux n'ont pas de sens côté serveur. */
export function cartToInputs(cart: OrderLine[]): OrderLineInput[] {
  return cart.map(({ productId, quantity, extraXl, options }) => ({
    productId,
    quantity,
    extraXl,
    options,
  }));
}
