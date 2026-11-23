import type { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type {
  ApiErrorBody,
  DraftWithTokenResponse,
  KioskLoginSessionDto,
  MockLoginResponse,
  PayDraftResponse,
} from '@pastalavista/shared';
import { buildApp } from '../src/http/app';
import { TTL_MINUTES, USUAL_LINES, buildTestContext, type TestContext } from './support';

const API = '/api/v1';
const TOKEN_HEADER = 'x-draft-token';

describe('API : parcours smartphone -> borne (intégration HTTP)', () => {
  let ctx: TestContext;
  let app: FastifyInstance;

  beforeEach(async () => {
    ctx = buildTestContext();
    app = await buildApp(ctx.container, {
      corsOrigins: ['http://localhost:5173'],
      logLevel: 'silent',
    });
  });
  afterEach(async () => {
    await app.close();
  });

  const draftBody = {
    origin: 'smartphone',
    mode: 'dine-in',
    locale: 'ru',
    customerId: 'cust-jeremy',
    lines: USUAL_LINES,
  };

  async function createDraft(): Promise<DraftWithTokenResponse> {
    const res = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts`,
      payload: draftBody,
    });
    expect(res.statusCode).toBe(201);
    return res.json();
  }

  it('parcours complet : brouillon -> jeton -> récupération -> paiement -> cuisine', async () => {
    const { draft, token } = await createDraft();
    expect(draft.status).toBe('draft');
    expect(draft.code).toMatch(/^PL-[0-9]{4}$/);
    expect(draft.totals.totalCents).toBe(1000);

    const retrieved = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/retrieve`,
      payload: { kioskId: 'kiosk-01', token },
    });
    expect(retrieved.statusCode).toBe(200);
    expect(retrieved.json<DraftWithTokenResponse>().draft).toMatchObject({
      status: 'retrieved',
      locale: 'ru',
    });

    // Rien en cuisine avant le paiement
    const before = await app.inject({ method: 'GET', url: `${API}/kitchen/tickets` });
    expect(before.json().tickets).toHaveLength(0);

    const paid = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/${draft.id}/pay`,
      headers: { [TOKEN_HEADER]: token },
      payload: { kioskId: 'kiosk-01', method: 'card', useSavedCard: true },
    });
    expect(paid.statusCode).toBe(200);
    const result = paid.json<PayDraftResponse>();
    expect(result.order.displayNumber).toBe('A007');
    expect(result.payment.cardLast4).toBe('4242');

    const after = await app.inject({ method: 'GET', url: `${API}/kitchen/tickets` });
    expect(after.json().tickets).toHaveLength(1);
  });

  it('récupération par code (téléphone déchargé)', async () => {
    const { draft } = await createDraft();
    const res = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/retrieve`,
      payload: { kioskId: 'kiosk-01', code: draft.code.toLowerCase() },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json<DraftWithTokenResponse>().draft.id).toBe(draft.id);
  });

  it('brouillon expiré : 410 DRAFT_EXPIRED', async () => {
    const { token } = await createDraft();
    ctx.clock.advanceMinutes(TTL_MINUTES + 1);
    const res = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/retrieve`,
      payload: { kioskId: 'kiosk-01', token },
    });
    expect(res.statusCode).toBe(410);
    expect(res.json<ApiErrorBody>().error.code).toBe('DRAFT_EXPIRED');
  });

  it('brouillon déjà payé : 409 DRAFT_ALREADY_PAID à la récupération comme au paiement', async () => {
    const { draft, token } = await createDraft();
    await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/retrieve`,
      payload: { kioskId: 'kiosk-01', token },
    });
    const pay = () =>
      app.inject({
        method: 'POST',
        url: `${API}/order-drafts/${draft.id}/pay`,
        headers: { [TOKEN_HEADER]: token },
        payload: { kioskId: 'kiosk-01', method: 'card' },
      });
    expect((await pay()).statusCode).toBe(200);
    const second = await pay();
    expect(second.statusCode).toBe(409);
    expect(second.json<ApiErrorBody>().error.code).toBe('DRAFT_ALREADY_PAID');
    const retrieveAgain = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/retrieve`,
      payload: { kioskId: 'kiosk-01', token },
    });
    expect(retrieveAgain.json<ApiErrorBody>().error.code).toBe('DRAFT_ALREADY_PAID');
  });

  it('le paiement est refusé sur un brouillon non récupéré (smartphone)', async () => {
    const { draft, token } = await createDraft();
    const res = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts/${draft.id}/pay`,
      headers: { [TOKEN_HEADER]: token },
      payload: { kioskId: 'kiosk-01', method: 'card' },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json<ApiErrorBody>().error.code).toBe('DRAFT_NOT_RETRIEVED');
  });

  it('modification du brouillon avec le bon jeton uniquement', async () => {
    const { draft, token } = await createDraft();
    const payload = { mode: 'takeaway', locale: 'fr', lines: USUAL_LINES };
    const denied = await app.inject({
      method: 'PUT',
      url: `${API}/order-drafts/${draft.id}`,
      payload,
    });
    expect(denied.statusCode).toBe(403);
    const ok = await app.inject({
      method: 'PUT',
      url: `${API}/order-drafts/${draft.id}`,
      headers: { [TOKEN_HEADER]: token },
      payload,
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().draft.mode).toBe('takeaway');
  });

  it('validation : format d’erreur cohérent', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `${API}/order-drafts`,
      payload: { origin: 'smartphone' },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json<ApiErrorBody>().error.code).toBe('VALIDATION_ERROR');
    const unknown = await app.inject({ method: 'GET', url: `${API}/nope` });
    expect(unknown.statusCode).toBe(404);
    expect(unknown.json<ApiErrorBody>().error.code).toBe('NOT_FOUND');
    const bad = await app.inject({
      method: 'POST',
      url: `${API}/chat`,
      headers: { 'content-type': 'application/json' },
      payload: '{oops',
    });
    expect(bad.statusCode).toBe(400);
  });

  it('connexion par QR code : session borne -> confirmation smartphone -> profil', async () => {
    const created = await app.inject({
      method: 'POST',
      url: `${API}/kiosk-login/sessions`,
      payload: { kioskId: 'kiosk-01' },
    });
    const session = created.json<{ session: KioskLoginSessionDto }>().session;
    const login = await app.inject({
      method: 'POST',
      url: `${API}/auth/mock-login`,
      payload: { customerId: 'cust-jeremy' },
    });
    const { sessionToken } = login.json<MockLoginResponse>();
    const confirm = await app.inject({
      method: 'POST',
      url: `${API}/kiosk-login/sessions/${session.id}/confirm`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(confirm.statusCode).toBe(200);
    const polled = await app.inject({
      method: 'GET',
      url: `${API}/kiosk-login/sessions/${session.id}`,
    });
    expect(polled.json<{ session: KioskLoginSessionDto }>().session.customer?.displayName).toBe(
      'Jérémy Martin',
    );
    const me = await app.inject({
      method: 'GET',
      url: `${API}/auth/me`,
      headers: { authorization: `Bearer ${sessionToken}` },
    });
    expect(me.json().customer.orderCount).toBe(5);
  });

  it('catalogue localisé avec nutrition, compositions populaires et chatbot', async () => {
    const products = await app.inject({
      method: 'GET',
      url: `${API}/catalog/products?locale=ru&kind=topping`,
    });
    const chicken = products.json().products.find((p: { id: string }) => p.id === 'top-poulet');
    expect(chicken).toMatchObject({
      name: 'Курица на гриле',
      kcal: 165,
      proteinG: 31,
      priceCents: 250,
    });
    const compositions = await app.inject({
      method: 'GET',
      url: `${API}/catalog/compositions?locale=fr`,
    });
    expect(compositions.json().compositions.map((c: { name: string }) => c.name)).toEqual([
      'La Classique',
      'La Veggie',
      'La Protéinée',
    ]);
    const categories = await app.inject({
      method: 'GET',
      url: `${API}/catalog/categories?locale=en`,
    });
    expect(categories.json().categories.map((c: { name: string }) => c.name)).toContain('Drinks');
    const chat = await app.inject({
      method: 'POST',
      url: `${API}/chat`,
      payload: { message: 'beaucoup de protéines', locale: 'fr' },
    });
    expect(chat.json().suggestions.length).toBeGreaterThan(0);
  });

  it('CORS : la pré-requête autorise PUT et les en-têtes de jeton (modification de brouillon depuis Vite)', async () => {
    const res = await app.inject({
      method: 'OPTIONS',
      url: `${API}/order-drafts/abc`,
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type,x-draft-token',
      },
    });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('PUT');
    expect(res.headers['access-control-allow-headers']).toContain('x-draft-token');
  });

  it('santé et en-têtes CORS pour le serveur de dev Vite', async () => {
    const health = await app.inject({
      method: 'GET',
      url: `${API}/health`,
      headers: { origin: 'http://localhost:5173' },
    });
    expect(health.statusCode).toBe(200);
    expect(health.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
