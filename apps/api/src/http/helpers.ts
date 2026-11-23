import type { FastifyRequest } from 'fastify';
import {
  DRAFT_TOKEN_HEADER,
  type KitchenTicketDto,
  type OrderDraftDto,
  type OrderDto,
  type PaymentDto,
} from '@pastalavista/shared';
import type { KitchenTicket, Order, OrderDraft, Payment } from '../domain/entities';
import type { Container } from '../composition-root';
import { formatOrderNumber } from '../domain/services/payment-service';

const BEARER_PREFIX = 'Bearer ';

function singleHeader(request: FastifyRequest, name: string): string | undefined {
  const value = request.headers[name];
  return Array.isArray(value) ? value[0] : value;
}

export function draftToken(request: FastifyRequest): string | undefined {
  return singleHeader(request, DRAFT_TOKEN_HEADER);
}

export function bearerToken(request: FastifyRequest): string | undefined {
  const header = singleHeader(request, 'authorization');
  return header?.startsWith(BEARER_PREFIX) ? header.slice(BEARER_PREFIX.length) : undefined;
}

export async function draftToDto(container: Container, draft: OrderDraft): Promise<OrderDraftDto> {
  return container.drafts.toDto(draft, await container.drafts.totalsOf(draft.lines));
}

export function orderToDto(order: Order): OrderDto {
  return {
    id: order.id,
    number: order.number,
    displayNumber: formatOrderNumber(order.number),
    draftId: order.draftId ?? '',
    customerId: order.customerId,
    mode: order.mode,
    locale: order.locale,
    lines: order.lines,
    totals: { totalCents: order.totalCents, kcal: order.kcal, proteinG: order.proteinG },
    status: order.status,
    createdAt: order.createdAt,
  };
}

export function paymentToDto(payment: Payment): PaymentDto {
  return { ...payment };
}

export function ticketToDto(ticket: KitchenTicket): KitchenTicketDto {
  return {
    id: ticket.id,
    orderId: ticket.orderId,
    displayNumber: ticket.displayNumber,
    status: ticket.status,
    lines: ticket.lines.map(({ productId, quantity, extraXl, options }) => ({
      productId,
      quantity,
      extraXl,
      options,
    })),
    mode: ticket.mode,
    createdAt: ticket.createdAt,
  };
}
