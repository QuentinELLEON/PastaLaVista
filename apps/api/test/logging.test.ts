import { describe, expect, it } from 'vitest';
import { loggerOptions } from '../src/http/app';

describe('journalisation sans données personnelles', () => {
  const { serializers } = loggerOptions('info');

  it('ne garde que la méthode et le motif de route', () => {
    const logged = serializers.req({
      method: 'POST',
      routeOptions: { url: '/api/v1/order-drafts/:id/pay' },
      // Ces champs existent sur la vraie requête mais ne doivent JAMAIS être journalisés
      ...{
        url: '/api/v1/order-drafts/8f1c-secret/pay?code=PL-4821',
        headers: { 'x-draft-token': 'jeton-secret', authorization: 'Bearer session-secret' },
        body: { customerId: 'cust-jeremy' },
      },
    });
    expect(logged).toEqual({ method: 'POST', route: '/api/v1/order-drafts/:id/pay' });
    const text = JSON.stringify(logged);
    for (const secret of ['jeton-secret', 'session-secret', 'PL-4821', 'cust-jeremy', '8f1c']) {
      expect(text).not.toContain(secret);
    }
  });

  it('une route inconnue est journalisée sans son adresse réelle', () => {
    expect(serializers.req({ method: 'GET' })).toEqual({ method: 'GET', route: 'inconnue' });
  });
});
