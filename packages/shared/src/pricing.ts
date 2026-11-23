import type { PricingProduct } from './catalog';
import type { OrderLineInput, Totals } from './order';

/** Supplément de la portion XL (centimes). */
export const XL_SURCHARGE_CENTS = 200;

export type ProductIndex = ReadonlyMap<string, PricingProduct>;

export class UnknownProductError extends Error {
  constructor(public readonly productId: string) {
    super(`Produit inconnu : ${productId}`);
    this.name = 'UnknownProductError';
  }
}

export function indexProducts(products: readonly PricingProduct[]): ProductIndex {
  return new Map(products.map((product) => [product.id, product]));
}

function requireProduct(products: ProductIndex, productId: string): PricingProduct {
  const product = products.get(productId);
  if (!product) throw new UnknownProductError(productId);
  return product;
}

/** Prix d'UNE unité de la ligne (produit de base, XL, options). */
export function unitPriceCents(line: OrderLineInput, products: ProductIndex): number {
  const base = requireProduct(products, line.productId);
  const xl = line.extraXl ? XL_SURCHARGE_CENTS : 0;
  const options = line.options.reduce(
    (sum, option) => sum + requireProduct(products, option.productId).priceCents * option.quantity,
    0,
  );
  return base.priceCents + xl + options;
}

interface Nutrition {
  kcal: number;
  proteinG: number;
}

function productNutrition(
  product: PricingProduct,
  extraXl: boolean,
  products: ProductIndex,
): Nutrition {
  if (product.kind === 'composition') {
    return product.compositionItems.reduce<Nutrition>(
      (acc, item) => {
        const part = productNutrition(requireProduct(products, item.productId), false, products);
        return {
          kcal: acc.kcal + part.kcal * item.quantity,
          proteinG: acc.proteinG + part.proteinG * item.quantity,
        };
      },
      { kcal: 0, proteinG: 0 },
    );
  }
  if (extraXl && product.xlKcal !== null && product.xlProteinG !== null) {
    return { kcal: product.xlKcal, proteinG: product.xlProteinG };
  }
  return { kcal: product.kcal, proteinG: product.proteinG };
}

export function unitNutrition(line: OrderLineInput, products: ProductIndex): Nutrition {
  const base = productNutrition(requireProduct(products, line.productId), line.extraXl, products);
  return line.options.reduce((acc, option) => {
    const part = productNutrition(requireProduct(products, option.productId), false, products);
    return {
      kcal: acc.kcal + part.kcal * option.quantity,
      proteinG: acc.proteinG + part.proteinG * option.quantity,
    };
  }, base);
}

export function computeTotals(lines: readonly OrderLineInput[], products: ProductIndex): Totals {
  return lines.reduce<Totals>(
    (acc, line) => {
      const nutrition = unitNutrition(line, products);
      return {
        totalCents: acc.totalCents + unitPriceCents(line, products) * line.quantity,
        kcal: acc.kcal + nutrition.kcal * line.quantity,
        proteinG: acc.proteinG + nutrition.proteinG * line.quantity,
      };
    },
    { totalCents: 0, kcal: 0, proteinG: 0 },
  );
}
