import {
  DEFAULT_LOCALE,
  indexProducts,
  type CategoryDto,
  type Locale,
  type ProductDto,
  type ProductIndex,
  type TranslatedText,
} from '@pastalavista/shared';
import type { Product } from '../entities';
import type { CategoryRepository, ProductRepository } from '../ports/repositories';

export interface ProductFilter {
  kind?: string;
  categoryId?: string;
}

/** Choisit le libellé dans la langue demandée, avec repli sur le français puis sur la première traduction. */
export function pickTranslation(translations: TranslatedText[], locale: Locale): TranslatedText {
  const found =
    translations.find((t) => t.locale === locale) ??
    translations.find((t) => t.locale === DEFAULT_LOCALE) ??
    translations[0];
  return found ?? { locale, name: '', description: '' };
}

export function toProductDto(product: Product, locale: Locale): ProductDto {
  const text = pickTranslation(product.translations, locale);
  return {
    id: product.id,
    kind: product.kind,
    categoryId: product.categoryId,
    name: text.name,
    description: text.description,
    priceCents: product.priceCents,
    kcal: product.kcal,
    proteinG: product.proteinG,
    xlKcal: product.xlKcal,
    xlProteinG: product.xlProteinG,
    isSlowCarb: product.isSlowCarb,
    sortOrder: product.sortOrder,
    compositionItems: product.compositionItems.map((item) => ({ ...item })),
  };
}

export class CatalogService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly products: ProductRepository,
  ) {}

  async listCategories(locale: Locale): Promise<CategoryDto[]> {
    const categories = await this.categories.list();
    return categories
      .map((category) => ({
        id: category.id,
        name: pickTranslation(category.translations, locale).name,
        sortOrder: category.sortOrder,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async listProducts(locale: Locale, filter: ProductFilter = {}): Promise<ProductDto[]> {
    const products = await this.products.list();
    return products
      .filter((p) => (filter.kind ? p.kind === filter.kind : true))
      .filter((p) => (filter.categoryId ? p.categoryId === filter.categoryId : true))
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((product) => toProductDto(product, locale));
  }

  /** Compositions populaires (produits de type « composition »). */
  listCompositions(locale: Locale): Promise<ProductDto[]> {
    return this.listProducts(locale, { kind: 'composition' });
  }

  /** Index pour le calcul des prix et de la nutrition (aucun libellé nécessaire). */
  async pricingIndex(): Promise<ProductIndex> {
    return indexProducts(await this.listProducts(DEFAULT_LOCALE));
  }
}
