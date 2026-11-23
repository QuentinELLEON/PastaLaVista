import type { ProductDto } from '@pastalavista/shared';
import { buildCatalog, type Catalog } from '../src/domain/catalog/catalog';

const base: Omit<ProductDto, 'id' | 'kind' | 'name'> = {
  categoryId: 'cat-composer',
  description: '',
  priceCents: 0,
  kcal: 0,
  proteinG: 0,
  xlKcal: null,
  xlProteinG: null,
  isSlowCarb: false,
  sortOrder: 0,
  compositionItems: [],
};

const p = (
  id: string,
  kind: ProductDto['kind'],
  name: string,
  extra: Partial<ProductDto>,
): ProductDto => ({
  ...base,
  id,
  kind,
  name,
  ...extra,
});

/** Mini-catalogue de test, fidèle aux données de référence du projet (context.md section 5). */
export const PRODUCTS: ProductDto[] = [
  p('pasta-penne', 'pasta', 'Penne', {
    priceCents: 850,
    kcal: 420,
    proteinG: 14,
    xlKcal: 630,
    xlProteinG: 21,
  }),
  p('pasta-complete', 'pasta', 'Complètes', {
    priceCents: 900,
    kcal: 480,
    proteinG: 19,
    xlKcal: 720,
    xlProteinG: 28,
    isSlowCarb: true,
    description: 'Sucres lents',
  }),
  p('sauce-tomate', 'sauce', 'Tomate basilic', { kcal: 80, proteinG: 2 }),
  p('sauce-bolognaise', 'sauce', 'Bolognaise', { priceCents: 100, kcal: 250, proteinG: 14 }),
  p('top-poulet', 'topping', 'Poulet grillé', { priceCents: 250, kcal: 165, proteinG: 31 }),
  p('top-oeuf', 'topping', 'Œuf', { priceCents: 100, kcal: 78, proteinG: 6 }),
  p('top-thon', 'topping', 'Thon', { priceCents: 200, kcal: 110, proteinG: 24 }),
  p('extra-parmesan', 'extra', 'Parmesan', { priceCents: 50, kcal: 40, proteinG: 4 }),
  p('drink-eau', 'drink', 'Eau', { categoryId: 'cat-boissons', priceCents: 150 }),
  p('drink-jus', 'drink', 'Jus d’orange', {
    categoryId: 'cat-boissons',
    priceCents: 200,
    kcal: 110,
    proteinG: 2,
  }),
  p('comp-classique', 'composition', 'La Classique', {
    categoryId: 'cat-populaires',
    priceCents: 950,
    compositionItems: [
      { productId: 'pasta-penne', quantity: 1 },
      { productId: 'sauce-tomate', quantity: 1 },
    ],
  }),
];

export const CATEGORIES = [
  { id: 'cat-composer', name: 'Composer', sortOrder: 0 },
  { id: 'cat-populaires', name: 'Populaires', sortOrder: 1 },
  { id: 'cat-boissons', name: 'Boissons', sortOrder: 2 },
];

export const catalog: Catalog = buildCatalog(PRODUCTS, CATEGORIES);
