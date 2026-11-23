import {
  computeTotals,
  indexProducts,
  type OrderLineInput,
  type ProductDto,
  type ProductIndex,
  type Totals,
} from '@pastalavista/shared';

/** Plat que le chatbot peut proposer : toujours construit à partir du catalogue réel. */
export interface Candidate {
  line: OrderLineInput;
  title: string;
  totals: Totals;
  slowCarbs: boolean;
  isComposition: boolean;
}

const PROTEIN_TOPPING_IDS = ['top-poulet', 'top-thon', 'top-oeuf'];
const PROTEIN_QUANTITIES = [1, 2];

function byKind(products: ProductDto[], kind: ProductDto['kind']): ProductDto[] {
  return products.filter((p) => p.kind === kind);
}

function withQuantity(name: string, quantity: number): string {
  return quantity > 1 ? `${name} × ${quantity}` : name;
}

function compositionCandidates(products: ProductDto[], index: ProductIndex): Candidate[] {
  return byKind(products, 'composition').map((composition) => {
    const line: OrderLineInput = {
      productId: composition.id,
      quantity: 1,
      extraXl: false,
      options: [],
    };
    const slowCarbs = composition.compositionItems.some(
      (item) => products.find((p) => p.id === item.productId)?.isSlowCarb,
    );
    return {
      line,
      title: composition.name,
      totals: computeTotals([line], index),
      slowCarbs,
      isComposition: true,
    };
  });
}

function plateCandidates(products: ProductDto[], index: ProductIndex): Candidate[] {
  const toppings = byKind(products, 'topping').filter((p) => PROTEIN_TOPPING_IDS.includes(p.id));
  const candidates: Candidate[] = [];
  for (const pasta of byKind(products, 'pasta')) {
    for (const sauce of byKind(products, 'sauce')) {
      for (const extraXl of [false, true]) {
        const base = [{ productId: sauce.id, quantity: 1 }];
        const variants: Array<{ options: OrderLineInput['options']; suffix: string }> = [
          { options: base, suffix: '' },
        ];
        for (const topping of toppings) {
          for (const quantity of PROTEIN_QUANTITIES) {
            variants.push({
              options: [...base, { productId: topping.id, quantity }],
              suffix: `, ${withQuantity(topping.name, quantity)}`,
            });
          }
        }
        for (const variant of variants) {
          const line: OrderLineInput = {
            productId: pasta.id,
            quantity: 1,
            extraXl,
            options: variant.options,
          };
          candidates.push({
            line,
            title: `${pasta.name}${extraXl ? ' XL' : ''}, ${sauce.name}${variant.suffix}`,
            totals: computeTotals([line], index),
            slowCarbs: pasta.isSlowCarb,
            isComposition: false,
          });
        }
      }
    }
  }
  return candidates;
}

export function buildCandidates(products: ProductDto[]): Candidate[] {
  const index = indexProducts(products);
  return [...compositionCandidates(products, index), ...plateCandidates(products, index)];
}

/** Plus de protéines d'abord, puis plus de calories, puis le moins cher : choix déterministe. */
export function compareByNeed(a: Candidate, b: Candidate): number {
  return (
    b.totals.proteinG - a.totals.proteinG ||
    b.totals.kcal - a.totals.kcal ||
    a.totals.totalCents - b.totals.totalCents
  );
}
