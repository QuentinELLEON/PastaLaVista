import type {
  CompositionItem,
  DraftOrigin,
  DraftStatus,
  Locale,
  OrderLine,
  OrderMode,
  PaymentMethod,
  ProductKind,
  TranslatedText,
} from '@pastalavista/shared';

// Toutes les entités sont plates et pensées comme des lignes de table :
// identifiants opaques, relations par identifiant, montants en centimes, dates ISO.

export interface Category {
  id: string;
  sortOrder: number;
  translations: TranslatedText[];
}

export interface Product {
  id: string;
  kind: ProductKind;
  categoryId: string | null;
  priceCents: number;
  kcal: number;
  proteinG: number;
  xlKcal: number | null;
  xlProteinG: number | null;
  isSlowCarb: boolean;
  sortOrder: number;
  translations: TranslatedText[];
  /** Lignes de la composition (vide hors compositions populaires). */
  compositionItems: CompositionItem[];
}

export interface Customer {
  id: string;
  displayName: string;
  locale: Locale;
  /** Commande « habituelle » (référence vers une commande passée). */
  usualOrderId: string | null;
}

export interface SavedPaymentMethod {
  id: string;
  customerId: string;
  brand: string;
  last4: string;
}

export interface Kiosk {
  id: string;
  label: string;
  active: boolean;
}

export interface OrderDraft {
  id: string;
  /** Code court saisissable à la borne (PL-xxxx). */
  code: string;
  /** Secret à usage unique présenté à la borne (QR code). */
  token: string;
  status: DraftStatus;
  origin: DraftOrigin;
  mode: OrderMode;
  locale: Locale;
  customerId: string | null;
  kioskId: string | null;
  lines: OrderLine[];
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  retrievedAt: string | null;
}

export interface Order {
  id: string;
  /** Numéro séquentiel donné au client. */
  number: number;
  draftId: string | null;
  customerId: string | null;
  mode: OrderMode;
  locale: Locale;
  lines: OrderLine[];
  /** Instantané des montants au moment de la commande (les prix du catalogue peuvent changer). */
  totalCents: number;
  kcal: number;
  proteinG: number;
  status: 'sent-to-kitchen' | 'completed';
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  cardLast4: string | null;
  createdAt: string;
}

export interface KitchenTicket {
  id: string;
  orderId: string;
  displayNumber: string;
  status: 'queued' | 'preparing' | 'ready';
  lines: OrderLine[];
  mode: OrderMode;
  createdAt: string;
}

export interface KioskLoginSession {
  id: string;
  kioskId: string;
  status: 'pending' | 'authenticated';
  customerId: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface AuthSession {
  token: string;
  customerId: string;
  createdAt: string;
}
