import type { OrderLine, ProductDto } from '@pastalavista/shared';
import type { Catalog } from '../catalog/catalog';
import { productsOfKind } from '../catalog/catalog';

export type UpsellMode = 'generic' | 'single' | 'need-based';

export interface UpsellOffer {
  kind: 'drink' | 'protein';
  products: ProductDto[];
  /** Pour une protéine : ligne d'assiette à laquelle l'ajouter. */
  targetLineId: string | null;
}

// Ordre de proposition d'une protéine : la plus légère en prix d'abord, sans pression
const PROTEIN_UPSELL_IDS = ['top-oeuf', 'top-thon', 'top-poulet'];

function drinksNotInCart(catalog: Catalog, cart: OrderLine[]): ProductDto[] {
  const inCart = new Set(cart.map((line) => line.productId));
  return productsOfKind(catalog, 'drink').filter((drink) => !inCart.has(drink.id));
}

/** Lignes auxquelles on peut ajouter une protéine : assiettes libres et compositions populaires. */
function plateLines(catalog: Catalog, cart: OrderLine[]): OrderLine[] {
  return cart.filter((line) => {
    const kind = catalog.byId.get(line.productId)?.kind;
    return kind === 'pasta' || kind === 'composition';
  });
}

/**
 * Vente additionnelle selon la configuration d'IHM :
 * - generic : toutes les boissons ; single : UNE boisson ; need-based : une protéine liée au besoin.
 */
export function pickUpsell(
  mode: UpsellMode,
  catalog: Catalog,
  cart: OrderLine[],
): UpsellOffer | null {
  if (mode === 'need-based') {
    const target = plateLines(catalog, cart).at(-1);
    const inTarget = new Set(target?.options.map((option) => option.productId));
    const protein = PROTEIN_UPSELL_IDS.map((id) => catalog.byId.get(id)).find(
      (product) => product && !inTarget.has(product.id),
    );
    if (target && protein) return { kind: 'protein', products: [protein], targetLineId: target.id };
  }
  const drinks = drinksNotInCart(catalog, cart);
  const products = mode === 'generic' ? drinks : drinks.slice(0, 1);
  return products.length > 0 ? { kind: 'drink', products, targetLineId: null } : null;
}
