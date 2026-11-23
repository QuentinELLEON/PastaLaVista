import { describe, expect, it } from 'vitest';
import type { KitchenTicket, Order, OrderDraft } from '../../src/domain/entities';
import { DuplicateKeyError } from '../../src/domain/errors';
import type { Repositories } from '../../src/domain/ports/repositories';

/**
 * Tests de CONTRAT : ils décrivent ce que doit garantir n'importe quelle implémentation des dépôts.
 * Pour une base SQL, appeler `runRepositoryContracts` avec une fabrique qui renvoie des dépôts SQL vides
 * (puis les seeds) : aucune ligne de cette suite ne doit changer.
 */
export type RepositoriesFactory = () => Promise<Repositories> | Repositories;

const NOW = '2026-11-25T12:00:00.000Z';

function draft(overrides: Partial<OrderDraft> = {}): OrderDraft {
  return {
    id: 'draft-1',
    code: 'PL-1111',
    token: 'token-a',
    status: 'draft',
    origin: 'smartphone',
    mode: 'dine-in',
    locale: 'fr',
    customerId: null,
    kioskId: null,
    lines: [{ id: 'line-1', productId: 'pasta-penne', quantity: 1, extraXl: false, options: [] }],
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: '2026-11-25T12:30:00.000Z',
    retrievedAt: null,
    ...overrides,
  };
}

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-x',
    number: 100,
    draftId: null,
    customerId: 'cust-camille',
    mode: 'takeaway',
    locale: 'fr',
    lines: [],
    totalCents: 850,
    kcal: 420,
    proteinG: 14,
    status: 'sent-to-kitchen',
    createdAt: NOW,
    ...overrides,
  };
}

export function runRepositoryContracts(name: string, factory: RepositoriesFactory): void {
  describe(`contrat des dépôts — ${name}`, () => {
    it('catalogue : renvoie des copies, pas les objets internes', async () => {
      const { products } = await factory();
      const first = (await products.list())[0];
      expect(first).toBeDefined();
      if (!first) return;
      first.priceCents = 1;
      const again = await products.findById(first.id);
      expect(again?.priceCents).not.toBe(1);
      expect(await products.findById('absent')).toBeNull();
    });

    it('brouillons : create puis findById / findByToken / findByCode', async () => {
      const { orderDrafts } = await factory();
      await orderDrafts.create(draft());
      expect((await orderDrafts.findById('draft-1'))?.code).toBe('PL-1111');
      expect((await orderDrafts.findByToken('token-a'))?.id).toBe('draft-1');
      expect((await orderDrafts.findByCode('PL-1111'))?.id).toBe('draft-1');
      expect(await orderDrafts.findByCode('PL-9999')).toBeNull();
    });

    it.each([
      ['identifiant', { id: 'draft-1', code: 'PL-2222', token: 'token-b' }],
      ['code', { id: 'draft-2', code: 'PL-1111', token: 'token-b' }],
      ['jeton', { id: 'draft-2', code: 'PL-2222', token: 'token-a' }],
    ])('brouillons : refuse un doublon de %s', async (_label, overrides) => {
      const { orderDrafts } = await factory();
      await orderDrafts.create(draft());
      await expect(orderDrafts.create(draft(overrides))).rejects.toBeInstanceOf(DuplicateKeyError);
    });

    it('brouillons : update est un verrou optimiste sur le statut attendu', async () => {
      const { orderDrafts } = await factory();
      await orderDrafts.create(draft());
      const retrieved = draft({ status: 'retrieved', kioskId: 'kiosk-01' });
      expect((await orderDrafts.update(retrieved, 'draft'))?.status).toBe('retrieved');
      // Deuxième tentative avec l'ancien statut attendu : refusée
      expect(await orderDrafts.update(retrieved, 'draft')).toBeNull();
      expect(await orderDrafts.update(draft({ id: 'inconnu' }), 'draft')).toBeNull();
    });

    it('brouillons : les objets renvoyés sont des copies', async () => {
      const { orderDrafts } = await factory();
      const created = await orderDrafts.create(draft());
      created.lines.length = 0;
      expect((await orderDrafts.findById('draft-1'))?.lines).toHaveLength(1);
    });

    it('commandes : numéros séquentiels, comptage par client', async () => {
      const { orders } = await factory();
      const before = await orders.nextNumber();
      await orders.create(order({ number: before }));
      expect(await orders.nextNumber()).toBe(before + 1);
      expect(await orders.countByCustomerId('cust-jeremy')).toBe(5);
      expect(await orders.countByCustomerId('personne')).toBe(0);
      await expect(orders.create(order({ number: before + 5 }))).rejects.toBeInstanceOf(
        DuplicateKeyError,
      );
    });

    it('cuisine : conserve l’ordre d’arrivée', async () => {
      const { kitchenQueue } = await factory();
      const ticket = (id: string): KitchenTicket => ({
        id,
        orderId: 'order-x',
        displayNumber: 'A001',
        status: 'queued',
        lines: [],
        mode: 'dine-in',
        createdAt: NOW,
      });
      await kitchenQueue.enqueue(ticket('t1'));
      await kitchenQueue.enqueue(ticket('t2'));
      expect((await kitchenQueue.list()).map((t) => t.id)).toEqual(['t1', 't2']);
    });

    it('sessions de connexion : create, findById, save', async () => {
      const { kioskLoginSessions } = await factory();
      const session = {
        id: 's1',
        kioskId: 'kiosk-01',
        status: 'pending' as const,
        customerId: null,
        createdAt: NOW,
        expiresAt: NOW,
      };
      await kioskLoginSessions.create(session);
      await kioskLoginSessions.save({
        ...session,
        status: 'authenticated',
        customerId: 'cust-jeremy',
      });
      expect((await kioskLoginSessions.findById('s1'))?.status).toBe('authenticated');
      expect(await kioskLoginSessions.findById('absente')).toBeNull();
    });
  });
}
