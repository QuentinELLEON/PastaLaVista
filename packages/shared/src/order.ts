import type { Locale } from './locale';

export const ORDER_MODES = ['dine-in', 'takeaway'] as const;
export type OrderMode = (typeof ORDER_MODES)[number];

export const DRAFT_STATUSES = ['draft', 'retrieved', 'paid', 'sent-to-kitchen', 'expired'] as const;
export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const DRAFT_ORIGINS = ['smartphone', 'kiosk'] as const;
export type DraftOrigin = (typeof DRAFT_ORIGINS)[number];

export const PAYMENT_METHODS = ['card', 'mobile', 'cash'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface OrderLineOption {
  productId: string;
  quantity: number;
}

/** Une ligne de commande : un produit de base (pâtes, composition, boisson) et ses options. */
export interface OrderLine {
  id: string;
  productId: string;
  quantity: number;
  extraXl: boolean;
  options: OrderLineOption[];
}

export type OrderLineInput = Omit<OrderLine, 'id'>;

export interface Totals {
  totalCents: number;
  kcal: number;
  proteinG: number;
}

export interface OrderDraftDto {
  id: string;
  code: string;
  status: DraftStatus;
  origin: DraftOrigin;
  mode: OrderMode;
  locale: Locale;
  customerId: string | null;
  kioskId: string | null;
  lines: OrderLine[];
  totals: Totals;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}
