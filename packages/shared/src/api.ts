import type { Locale } from './locale';
import type {
  OrderLine,
  OrderLineInput,
  OrderMode,
  OrderDraftDto,
  PaymentMethod,
  Totals,
} from './order';

export interface ApiErrorBody {
  error: { code: string; message: string; details?: unknown };
}

export interface SavedCardDto {
  brand: string;
  last4: string;
}

export interface CustomerProfileDto {
  id: string;
  displayName: string;
  locale: Locale;
  /** Nombre de commandes passées : sert à reconnaître un habitué (règle RU1). */
  orderCount: number;
  usualOrder: { mode: OrderMode; lines: OrderLine[] } | null;
  savedCard: SavedCardDto | null;
}

export interface MockLoginResponse {
  sessionToken: string;
  customer: CustomerProfileDto;
}

export const LOGIN_SESSION_STATUSES = ['pending', 'authenticated', 'expired'] as const;
export type LoginSessionStatus = (typeof LOGIN_SESSION_STATUSES)[number];

export interface KioskLoginSessionDto {
  id: string;
  kioskId: string;
  status: LoginSessionStatus;
  expiresAt: string;
  /** Présent uniquement quand la session est authentifiée. */
  customer: CustomerProfileDto | null;
}

export interface DraftWithTokenResponse {
  draft: OrderDraftDto;
  /** Jeton à usage unique, à présenter à la borne (QR code). */
  token: string;
  /** Renseigné à la récupération : la borne reconnaît le client qui a préparé la commande. */
  customer?: CustomerProfileDto | null;
}

export interface OrderDto {
  id: string;
  number: number;
  displayNumber: string;
  draftId: string;
  customerId: string | null;
  mode: OrderMode;
  locale: Locale;
  lines: OrderLine[];
  totals: Totals;
  status: 'sent-to-kitchen' | 'completed';
  createdAt: string;
}

export interface PaymentDto {
  id: string;
  orderId: string;
  amountCents: number;
  method: PaymentMethod;
  cardLast4: string | null;
  createdAt: string;
}

export interface KitchenTicketDto {
  id: string;
  orderId: string;
  displayNumber: string;
  status: 'queued' | 'preparing' | 'ready';
  lines: OrderLineInput[];
  mode: OrderMode;
  createdAt: string;
}

export interface PayDraftResponse {
  order: OrderDto;
  payment: PaymentDto;
  ticket: KitchenTicketDto;
}

export const CHAT_INTENTS = [
  'greeting',
  'recommend',
  'show-menu',
  'call-staff',
  'fallback',
] as const;
export type ChatIntent = (typeof CHAT_INTENTS)[number];

export interface ChatSuggestionDto {
  id: string;
  title: string;
  lines: OrderLineInput[];
  totals: Totals;
}

export interface ChatReplyDto {
  intent: ChatIntent;
  locale: Locale;
  text: string;
  suggestions: ChatSuggestionDto[];
  /** Le client demande un humain : l'UI affiche l'appel d'un employé. */
  callStaff: boolean;
}
