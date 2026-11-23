import { beforeEach, describe, expect, it } from 'vitest';
import { DomainError } from '../src/domain/errors';
import {
  TTL_MINUTES,
  USUAL_LINES,
  buildTestContext,
  phoneDraft,
  type TestContext,
} from './support';

async function expectCode(promise: Promise<unknown>, code: string): Promise<void> {
  await expect(promise).rejects.toMatchObject({ name: 'DomainError', code });
}

describe('OrderDraftService', () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  it('crée un brouillon smartphone « draft » avec jeton, code et expiration', async () => {
    const draft = await ctx.container.drafts.create(phoneDraft());
    expect(draft.status).toBe('draft');
    expect(draft.code).toMatch(/^PL-[0-9]{4}$/);
    expect(draft.token).not.toBe('');
    expect(Date.parse(draft.expiresAt) - Date.parse(draft.createdAt)).toBe(TTL_MINUTES * 60_000);
    expect(draft.kioskId).toBeNull();
  });

  it('calcule les totaux côté serveur (usuelle de Jérémy = 10,00 €)', async () => {
    const draft = await ctx.container.drafts.create(phoneDraft());
    const totals = await ctx.container.drafts.totalsOf(draft.lines);
    expect(totals.totalCents).toBe(1000);
  });

  it('refuse un produit inconnu et un client inconnu', async () => {
    const unknownLine = [{ productId: 'pizza', quantity: 1, extraXl: false, options: [] }];
    await expectCode(
      ctx.container.drafts.create(phoneDraft({ lines: unknownLine })),
      'UNKNOWN_PRODUCT',
    );
    await expectCode(
      ctx.container.drafts.create(phoneDraft({ customerId: 'fantome' })),
      'CUSTOMER_NOT_FOUND',
    );
  });

  it('un brouillon créé sur la borne est directement « retrieved » et lié à la borne', async () => {
    const draft = await ctx.container.drafts.create(
      phoneDraft({ origin: 'kiosk', kioskId: 'kiosk-01' }),
    );
    expect(draft.status).toBe('retrieved');
    expect(draft.kioskId).toBe('kiosk-01');
    await expectCode(
      ctx.container.drafts.create(phoneDraft({ origin: 'kiosk' })),
      'VALIDATION_ERROR',
    );
  });

  describe('récupération à la borne', () => {
    it('par jeton : draft -> retrieved, lié à la borne', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      const retrieved = await ctx.container.drafts.retrieve({
        kioskId: 'kiosk-01',
        token: draft.token,
      });
      expect(retrieved.status).toBe('retrieved');
      expect(retrieved.kioskId).toBe('kiosk-01');
      expect(retrieved.retrievedAt).not.toBeNull();
    });

    it('par code, quelle que soit la casse ou le préfixe', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      const digits = draft.code.replace('PL-', '');
      const retrieved = await ctx.container.drafts.retrieve({
        kioskId: 'kiosk-01',
        code: `pl${digits}`,
      });
      expect(retrieved.id).toBe(draft.id);
    });

    it('la même borne peut relire (rechargement), une autre borne est refusée', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      await ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token });
      const again = await ctx.container.drafts.retrieve({
        kioskId: 'kiosk-01',
        token: draft.token,
      });
      expect(again.status).toBe('retrieved');
      await expectCode(
        ctx.container.drafts.retrieve({ kioskId: 'kiosk-02', token: draft.token }),
        'DRAFT_ALREADY_RETRIEVED',
      );
    });

    it('refuse un jeton, un code ou une borne inconnus', async () => {
      await expectCode(
        ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: 'nope' }),
        'DRAFT_NOT_FOUND',
      );
      await expectCode(
        ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', code: 'zzz' }),
        'DRAFT_NOT_FOUND',
      );
      const draft = await ctx.container.drafts.create(phoneDraft());
      await expectCode(
        ctx.container.drafts.retrieve({ kioskId: 'borne-x', token: draft.token }),
        'KIOSK_NOT_FOUND',
      );
    });
  });

  describe('expiration', () => {
    it('un brouillon dépassé est refusé avec DRAFT_EXPIRED puis marqué « expired »', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      ctx.clock.advanceMinutes(TTL_MINUTES + 1);
      await expectCode(
        ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token }),
        'DRAFT_EXPIRED',
      );
      expect((await ctx.repositories.orderDrafts.findById(draft.id))?.status).toBe('expired');
    });

    it('un brouillon encore valide juste avant la limite', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      ctx.clock.advanceMinutes(TTL_MINUTES - 1);
      const retrieved = await ctx.container.drafts.retrieve({
        kioskId: 'kiosk-01',
        token: draft.token,
      });
      expect(retrieved.status).toBe('retrieved');
    });

    it('une modification sur le smartphone repousse l’expiration (délai glissant)', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      ctx.clock.advanceMinutes(20);
      const updated = await ctx.container.drafts.update(draft.id, draft.token, {
        mode: 'takeaway',
        locale: 'fr',
        lines: USUAL_LINES,
      });
      expect(Date.parse(updated.expiresAt)).toBeGreaterThan(Date.parse(draft.expiresAt));
      ctx.clock.advanceMinutes(20);
      await expect(
        ctx.container.drafts.retrieve({ kioskId: 'kiosk-01', token: draft.token }),
      ).resolves.toBeDefined();
    });

    it('une fois récupéré, le délai est fixe', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      const retrieved = await ctx.container.drafts.retrieve({
        kioskId: 'kiosk-01',
        token: draft.token,
      });
      ctx.clock.advanceMinutes(10);
      const updated = await ctx.container.drafts.update(draft.id, draft.token, {
        mode: 'dine-in',
        locale: 'ru',
        lines: USUAL_LINES,
      });
      expect(updated.expiresAt).toBe(retrieved.expiresAt);
      expect(updated.locale).toBe('ru');
    });
  });

  describe('modification', () => {
    it('exige le bon jeton', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      const payload = { mode: 'dine-in' as const, locale: 'fr' as const, lines: USUAL_LINES };
      await expectCode(
        ctx.container.drafts.update(draft.id, 'mauvais', payload),
        'INVALID_DRAFT_TOKEN',
      );
      await expectCode(
        ctx.container.drafts.update(draft.id, undefined, payload),
        'INVALID_DRAFT_TOKEN',
      );
      await expectCode(
        ctx.container.drafts.update('absent', draft.token, payload),
        'DRAFT_NOT_FOUND',
      );
    });

    it('est impossible sur un brouillon expiré', async () => {
      const draft = await ctx.container.drafts.create(phoneDraft());
      ctx.clock.advanceMinutes(TTL_MINUTES + 5);
      const payload = { mode: 'dine-in' as const, locale: 'fr' as const, lines: USUAL_LINES };
      await expectCode(
        ctx.container.drafts.update(draft.id, draft.token, payload),
        'DRAFT_EXPIRED',
      );
    });
  });

  it('DomainError expose un code stable', () => {
    expect(new DomainError('DRAFT_EXPIRED', 'x').code).toBe('DRAFT_EXPIRED');
  });
});
