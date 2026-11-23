import { beforeEach, describe, expect, it } from 'vitest';
import type { PayDraftRequest } from '@pastalavista/shared';
import type { KitchenTicket } from '../src/domain/entities';
import type { KitchenQueueRepository } from '../src/domain/ports/repositories';
import { TTL_MINUTES, buildTestContext, phoneDraft, type TestContext } from './support';

const payAt = (kioskId: string, overrides: Partial<PayDraftRequest> = {}): PayDraftRequest => ({
  kioskId,
  method: 'card',
  useSavedCard: false,
  ...overrides,
});

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code });
}

describe('PaymentService', () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  async function retrievedDraft() {
    const draft = await ctx.container.drafts.create(phoneDraft());
    await ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token });
    return draft;
  }

  it('paie à la borne : numéro de commande, paiement et ticket de cuisine', async () => {
    const draft = await retrievedDraft();
    const result = await ctx.container.payments.pay(
      draft.id,
      draft.token,
      payAt('kiosk-01', { useSavedCard: true }),
    );
    expect(result.order.totalCents).toBe(1000);
    expect(result.order.number).toBe(7);
    expect(result.payment.cardLast4).toBe('4242');
    expect(result.ticket.displayNumber).toBe('A007');
    expect((await ctx.container.kitchen.listTickets()).map((t) => t.orderId)).toEqual([
      result.order.id,
    ]);
    expect((await ctx.repositories.orderDrafts.findById(draft.id))?.status).toBe('sent-to-kitchen');
  });

  it('refuse le paiement d’un brouillon jamais présenté à une borne (pas de paiement sur smartphone)', async () => {
    const draft = await ctx.container.drafts.create(phoneDraft());
    await expectCode(
      ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-01')),
      'DRAFT_NOT_RETRIEVED',
    );
    expect(await ctx.container.kitchen.listTickets()).toHaveLength(0);
  });

  it('refuse le paiement depuis une autre borne que celle qui a récupéré la commande', async () => {
    const draft = await retrievedDraft();
    await expectCode(
      ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-02')),
      'WRONG_KIOSK',
    );
  });

  it('refuse un mauvais jeton', async () => {
    const draft = await retrievedDraft();
    await expectCode(
      ctx.container.payments.pay(draft.id, 'faux', payAt('kiosk-01')),
      'INVALID_DRAFT_TOKEN',
    );
  });

  it('refuse un second paiement : DRAFT_ALREADY_PAID et une seule commande en cuisine', async () => {
    const draft = await retrievedDraft();
    await ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-01'));
    await expectCode(
      ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-01')),
      'DRAFT_ALREADY_PAID',
    );
    expect(await ctx.container.kitchen.listTickets()).toHaveLength(1);
  });

  it('refuse de récupérer un brouillon déjà payé', async () => {
    const draft = await retrievedDraft();
    await ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-01'));
    await expectCode(
      ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token }),
      'DRAFT_ALREADY_PAID',
    );
  });

  it('refuse de payer un brouillon expiré', async () => {
    const draft = await retrievedDraft();
    ctx.clock.advanceMinutes(TTL_MINUTES + 1);
    await expectCode(
      ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-01')),
      'DRAFT_EXPIRED',
    );
    expect(await ctx.container.kitchen.listTickets()).toHaveLength(0);
  });

  it('refuse la carte enregistrée pour un client sans carte', async () => {
    const draft = await ctx.container.drafts.create(phoneDraft({ customerId: 'cust-camille' }));
    await ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token });
    await expectCode(
      ctx.container.payments.pay(draft.id, draft.token, payAt('kiosk-01', { useSavedCard: true })),
      'NO_SAVED_CARD',
    );
  });

  it('RIEN N’ATTEINT LA CUISINE avant l’enregistrement du paiement', async () => {
    const paymentExistedAtEnqueue: boolean[] = [];
    const spy = buildTestContext({
      transform: (repos) => ({
        ...repos,
        kitchenQueue: {
          list: () => repos.kitchenQueue.list(),
          enqueue: async (ticket: KitchenTicket) => {
            paymentExistedAtEnqueue.push(
              (await repos.payments.findByOrderId(ticket.orderId)) !== null,
            );
            return repos.kitchenQueue.enqueue(ticket);
          },
        } satisfies KitchenQueueRepository,
      }),
    });
    const draft = await spy.container.drafts.create(phoneDraft());
    await spy.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token });
    await spy.container.payments.pay(draft.id, draft.token, payAt('kiosk-01'));
    expect(paymentExistedAtEnqueue).toEqual([true]);
  });
});
