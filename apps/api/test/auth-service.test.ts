import { beforeEach, describe, expect, it } from 'vitest';
import { LOGIN_TTL_SECONDS, buildTestContext, type TestContext } from './support';

describe('AuthService (authentification simulée)', () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = buildTestContext();
  });

  it('renvoie le profil de Jérémy : habitué, commande habituelle, carte 4242', async () => {
    const { sessionToken, customer } = await ctx.container.auth.mockLogin('cust-jeremy');
    expect(sessionToken).not.toBe('');
    expect(customer.orderCount).toBe(5);
    expect(customer.savedCard).toEqual({ brand: 'Visa', last4: '4242' });
    expect(customer.usualOrder?.lines[0]?.productId).toBe('pasta-penne');
  });

  it('Camille n’est pas encore une habituée (1 commande)', async () => {
    const { customer } = await ctx.container.auth.mockLogin('cust-camille');
    expect(customer.orderCount).toBe(1);
    expect(customer.usualOrder).toBeNull();
    expect(customer.savedCard).toBeNull();
  });

  it('refuse un client inconnu et la connexion quand elle est désactivée', async () => {
    await expect(ctx.container.auth.mockLogin('inconnu')).rejects.toMatchObject({
      code: 'CUSTOMER_NOT_FOUND',
    });
    const disabled = buildTestContext({ mockAuthEnabled: false });
    await expect(disabled.container.auth.mockLogin('cust-jeremy')).rejects.toMatchObject({
      code: 'MOCK_AUTH_DISABLED',
    });
  });

  it('me() exige une session valide', async () => {
    await expect(ctx.container.auth.me(undefined)).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    await expect(ctx.container.auth.me('faux')).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
    const { sessionToken } = await ctx.container.auth.mockLogin('cust-jeremy');
    expect((await ctx.container.auth.me(sessionToken)).id).toBe('cust-jeremy');
  });

  describe('connexion par QR code de la borne', () => {
    it('la borne crée une session, le smartphone la confirme, la borne reconnaît le client', async () => {
      const session = await ctx.container.auth.createKioskLoginSession('kiosk-01');
      expect(session.status).toBe('pending');
      expect(session.customer).toBeNull();

      const { sessionToken } = await ctx.container.auth.mockLogin('cust-jeremy');
      await ctx.container.auth.confirmKioskLogin(session.id, sessionToken);

      const polled = await ctx.container.auth.getKioskLoginSession(session.id);
      expect(polled.status).toBe('authenticated');
      expect(polled.customer?.displayName).toBe('Jérémy Martin');
    });

    it('la session expire et ne peut plus être confirmée', async () => {
      const session = await ctx.container.auth.createKioskLoginSession('kiosk-01');
      const { sessionToken } = await ctx.container.auth.mockLogin('cust-jeremy');
      ctx.clock.advanceSeconds(LOGIN_TTL_SECONDS + 1);
      expect((await ctx.container.auth.getKioskLoginSession(session.id)).status).toBe('expired');
      await expect(
        ctx.container.auth.confirmKioskLogin(session.id, sessionToken),
      ).rejects.toMatchObject({
        code: 'LOGIN_SESSION_EXPIRED',
      });
    });

    it('refuse une borne inconnue, une session inconnue et une confirmation sans session client', async () => {
      await expect(ctx.container.auth.createKioskLoginSession('x')).rejects.toMatchObject({
        code: 'KIOSK_NOT_FOUND',
      });
      await expect(ctx.container.auth.getKioskLoginSession('x')).rejects.toMatchObject({
        code: 'LOGIN_SESSION_NOT_FOUND',
      });
      const session = await ctx.container.auth.createKioskLoginSession('kiosk-01');
      await expect(
        ctx.container.auth.confirmKioskLogin(session.id, undefined),
      ).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});
