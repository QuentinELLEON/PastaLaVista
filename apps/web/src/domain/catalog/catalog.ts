import {
  indexProducts,
  type CategoryDto,
  type ProductDto,
  type ProductIndex,
  type ProductKind,
} from '@pastalavista/shared';

/** Catalogue côté client : produits localisés + index prêt pour le calcul des prix. */
export interface Catalog {
  categories: CategoryDto[];
  products: ProductDto[];
  byId: ReadonlyMap<string, ProductDto>;
  index: ProductIndex;
}

export function buildCatalog(products: ProductDto[], categories: CategoryDto[]): Catalog {
  return {
    categories: [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    products,
    byId: new Map(products.map((product) => [product.id, product])),
    index: indexProducts(products),
  };
}

export function productsOfKind(catalog: Catalog, kind: ProductKind): ProductDto[] {
  return catalog.products.filter((product) => product.kind === kind);
}

export function productsOfCategory(catalog: Catalog, categoryId: string): ProductDto[] {
  return catalog.products.filter(
    (product) =>
      product.categoryId === categoryId && product.kind !== 'pasta' && isMenuItem(product),
  );
}

/** Seuls les plats prêts à commander apparaissent dans les rubriques du menu (pas les ingrédients). */
function isMenuItem(product: ProductDto): boolean {
  return product.kind === 'composition' || product.kind === 'drink' || product.kind === 'dessert';
}

export const POPULAR_CATEGORY_ID = 'cat-populaires';
export const DRINKS_CATEGORY_ID = 'cat-boissons';
export const COMPOSE_CATEGORY_ID = 'cat-composer';
