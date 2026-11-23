import { z } from 'zod';
import {
  DRAFT_CODE_DIGITS,
  DRAFT_CODE_PREFIX,
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_LINE_QUANTITY,
  MAX_LINES_PER_ORDER,
} from './constants';
import { LOCALES } from './locale';
import { DRAFT_ORIGINS, ORDER_MODES, PAYMENT_METHODS } from './order';

export const localeSchema = z.enum(LOCALES);

// Quatre chiffres (DRAFT_CODE_DIGITS), préfixe « PL » et tiret facultatifs
const DRAFT_CODE_PATTERN = new RegExp(`^(?:PL-?)?([0-9]{${DRAFT_CODE_DIGITS}})$`);

const quantitySchema = z.number().int().min(1).max(MAX_LINE_QUANTITY);

export const orderLineInputSchema = z.object({
  productId: z.string().min(1),
  quantity: quantitySchema,
  extraXl: z.boolean().default(false),
  options: z
    .array(z.object({ productId: z.string().min(1), quantity: quantitySchema }))
    .max(MAX_LINES_PER_ORDER)
    .default([]),
});

const linesSchema = z.array(orderLineInputSchema).min(1).max(MAX_LINES_PER_ORDER);

export const createDraftSchema = z.object({
  origin: z.enum(DRAFT_ORIGINS),
  mode: z.enum(ORDER_MODES),
  locale: localeSchema,
  customerId: z.string().min(1).nullable().default(null),
  /** Obligatoire pour un brouillon créé sur la borne. */
  kioskId: z.string().min(1).optional(),
  lines: linesSchema,
});
export type CreateDraftRequest = z.infer<typeof createDraftSchema>;

export const updateDraftSchema = z.object({
  mode: z.enum(ORDER_MODES),
  locale: localeSchema,
  lines: linesSchema,
});
export type UpdateDraftRequest = z.infer<typeof updateDraftSchema>;

/** Accepte « PL-4821 », « pl4821 » ou « 4821 » et renvoie la forme canonique. */
export function normalizeDraftCode(raw: string): string | null {
  const match = DRAFT_CODE_PATTERN.exec(raw.trim().toUpperCase());
  return match?.[1] ? `${DRAFT_CODE_PREFIX}${match[1]}` : null;
}

export const retrieveDraftSchema = z
  .object({
    kioskId: z.string().min(1),
    token: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
  })
  .refine((body) => (body.token === undefined) !== (body.code === undefined), {
    message: 'Fournir soit « token », soit « code »',
  });
export type RetrieveDraftRequest = z.infer<typeof retrieveDraftSchema>;

export const payDraftSchema = z.object({
  kioskId: z.string().min(1),
  method: z.enum(PAYMENT_METHODS),
  useSavedCard: z.boolean().default(false),
});
export type PayDraftRequest = z.infer<typeof payDraftSchema>;

export const mockLoginSchema = z.object({ customerId: z.string().min(1) });
export const createLoginSessionSchema = z.object({ kioskId: z.string().min(1) });

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1).max(MAX_CHAT_MESSAGE_LENGTH),
  locale: localeSchema,
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

export const catalogQuerySchema = z.object({
  locale: localeSchema.default('fr'),
  kind: z.string().optional(),
  categoryId: z.string().optional(),
});
