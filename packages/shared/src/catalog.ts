import type { Locale } from './locale';

export const PRODUCT_KINDS = [
  'pasta',
  'sauce',
  'topping',
  'extra',
  'drink',
  'dessert',
  'composition',
] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

/** Ligne d'une composition populaire : produit de base et quantité. */
export interface CompositionItem {
  productId: string;
  quantity: number;
}

/** Produit localisé tel qu'exposé par l'API (une ligne de table + libellés dans la langue demandée). */
export interface ProductDto {
  id: string;
  kind: ProductKind;
  categoryId: string | null;
  name: string;
  description: string;
  priceCents: number;
  kcal: number;
  proteinG: number;
  /** Valeurs nutritionnelles de la portion XL (pâtes uniquement). */
  xlKcal: number | null;
  xlProteinG: number | null;
  /** « Sucres lents » : pâtes complètes. */
  isSlowCarb: boolean;
  sortOrder: number;
  /** Renseigné uniquement pour les compositions populaires. */
  compositionItems: CompositionItem[];
}

export interface CategoryDto {
  id: string;
  name: string;
  sortOrder: number;
}

/** Sous-ensemble d'un produit nécessaire au calcul des prix et de la nutrition. */
export type PricingProduct = Pick<
  ProductDto,
  'id' | 'kind' | 'priceCents' | 'kcal' | 'proteinG' | 'xlKcal' | 'xlProteinG' | 'compositionItems'
>;

export type TranslatedText = { locale: Locale; name: string; description: string };
