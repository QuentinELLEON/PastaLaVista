import { describe, expect, it } from 'vitest';
import type { CustomerProfileDto, OrderDraftDto, OrderLine } from '@pastalavista/shared';
import { catalog } from '../../../test/catalogFixture';
import { INITIAL_SESSION, sessionReducer, type SessionState } from './session';

const plateLine: OrderLine = {
  id: 'l1',
  productId: 'pasta-penne',
  quantity: 1,
  extraXl: false,
  options: [{ productId: 'sauce-tomate', quantity: 1 }],
};

const customer: CustomerProfileDto = {
  id: 'cust-jeremy',
  displayName: 'Jérémy Martin',
  locale: 'fr',
  orderCount: 5,
  usualOrder: null,
  savedCard: { brand: 'Visa', last4: '4242' },
};

const draft: OrderDraftDto = {
  id: 'd1',
  code: 'PL-4821',
  status: 'retrieved',
  origin: 'smartphone',
  mode: 'takeaway',
  locale: 'ru',
  customerId: 'cust-jeremy',
  kioskId: 'kiosk-01',
  lines: [plateLine],
  totals: { totalCents: 850, kcal: 500, proteinG: 16 },
  createdAt: '2026-11-25T12:00:00.000Z',
  updatedAt: '2026-11-25T12:00:00.000Z',
  expiresAt: '2026-11-25T12:30:00.000Z',
};

const run = (state: SessionState, ...actions: Parameters<typeof sessionReducer>[1][]) =>
  actions.reduce(sessionReducer, state);

describe('sessionReducer', () => {
  it('la commande retrouvée remplace panier, mode, langue et client (RD3)', () => {
    const next = run(INITIAL_SESSION, { type: 'receiveDraft', draft, token: 't', customer });
    expect(next).toMatchObject({
      cart: [plateLine],
      mode: 'takeaway',
      language: 'ru',
      retrievedFromPhone: true,
      customer: { id: 'cust-jeremy' },
      draft: { id: 'd1', code: 'PL-4821', token: 't' },
    });
  });

  it('finishPlate ajoute l’assiette au panier et remet la composition à zéro', () => {
    const next = run(
      INITIAL_SESSION,
      { type: 'patchPlate', patch: { pastaId: 'pasta-penne', sauceId: 'sauce-tomate' } },
      { type: 'setPlateStep', step: 'extras' },
      { type: 'finishPlate', lineId: 'new' },
    );
    expect(next.cart).toHaveLength(1);
    expect(next.plate.pastaId).toBeNull();
    expect(next.plateStep).toBe('pasta');
  });

  it('modifier une ligne remplace cette ligne (et non en ajoute une)', () => {
    const start = run(
      INITIAL_SESSION,
      { type: 'addLine', line: plateLine },
      { type: 'editLine', lineId: 'l1', catalog },
    );
    expect(start.plate.pastaId).toBe('pasta-penne');
    const done = run(
      start,
      { type: 'patchPlate', patch: { extraXl: true } },
      { type: 'finishPlate', lineId: 'ignored' },
    );
    expect(done.cart).toHaveLength(1);
    expect(done.cart[0]).toMatchObject({ id: 'l1', extraXl: true });
  });

  it('l’état de composition survit à un changement de profil (réponse à l’aide, langue)', () => {
    const start = run(
      INITIAL_SESSION,
      { type: 'patchPlate', patch: { pastaId: 'pasta-complete' } },
      { type: 'setPlateStep', step: 'sauce' },
    );
    const adapted = run(
      start,
      { type: 'setLanguage', language: 'ru' },
      { type: 'answerHelp', answer: 'accepted' },
    );
    expect(adapted.plate.pastaId).toBe('pasta-complete');
    expect(adapted.plateStep).toBe('sauce');
  });

  it('answerHelp referme la demande d’aide et reset efface tout (écran public)', () => {
    const asked = run(INITIAL_SESSION, { type: 'requestHelp', requested: true });
    expect(run(asked, { type: 'answerHelp', answer: 'declined' }).helpRequested).toBe(false);
    const full = run(
      INITIAL_SESSION,
      { type: 'addLine', line: plateLine },
      { type: 'login', customer, sessionToken: 's' },
      { type: 'setHighContrast', enabled: true },
    );
    expect(run(full, { type: 'reset' })).toEqual(INITIAL_SESSION);
  });
});
