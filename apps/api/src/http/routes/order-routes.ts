import type { FastifyInstance } from 'fastify';
import {
  chatRequestSchema,
  createDraftSchema,
  payDraftSchema,
  retrieveDraftSchema,
  updateDraftSchema,
  type DraftWithTokenResponse,
  type PayDraftResponse,
} from '@pastalavista/shared';
import type { Container } from '../../composition-root';
import { draftToDto, draftToken, orderToDto, paymentToDto, ticketToDto } from '../helpers';

const HTTP_CREATED = 201;

export function orderRoutes(app: FastifyInstance, container: Container): void {
  app.post('/order-drafts', async (request, reply) => {
    const draft = await container.drafts.create(createDraftSchema.parse(request.body));
    const response: DraftWithTokenResponse = {
      draft: await draftToDto(container, draft),
      token: draft.token,
    };
    return reply.status(HTTP_CREATED).send(response);
  });

  // Jeton (QR code) ou code PL-xxxx présenté à la borne
  app.post('/order-drafts/retrieve', async (request) => {
    const draft = await container.drafts.retrieve(retrieveDraftSchema.parse(request.body));
    const response: DraftWithTokenResponse = {
      draft: await draftToDto(container, draft),
      token: draft.token,
    };
    return response;
  });

  app.get<{ Params: { id: string } }>('/order-drafts/:id', async (request) => ({
    draft: await draftToDto(
      container,
      await container.drafts.get(request.params.id, draftToken(request)),
    ),
  }));

  app.put<{ Params: { id: string } }>('/order-drafts/:id', async (request) => {
    const draft = await container.drafts.update(
      request.params.id,
      draftToken(request),
      updateDraftSchema.parse(request.body),
    );
    return { draft: await draftToDto(container, draft) };
  });

  // Paiement SIMULÉ, réservé à la borne qui a récupéré la commande
  app.post<{ Params: { id: string } }>('/order-drafts/:id/pay', async (request) => {
    const result = await container.payments.pay(
      request.params.id,
      draftToken(request),
      payDraftSchema.parse(request.body),
    );
    const response: PayDraftResponse = {
      order: orderToDto(result.order),
      payment: paymentToDto(result.payment),
      ticket: ticketToDto(result.ticket),
    };
    return response;
  });

  app.get('/kitchen/tickets', async () => ({
    tickets: (await container.kitchen.listTickets()).map(ticketToDto),
  }));

  app.post('/chat', async (request) => container.chat.reply(chatRequestSchema.parse(request.body)));
}
