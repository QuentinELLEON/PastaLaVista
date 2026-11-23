import type { FastifyInstance } from 'fastify';
import { createLoginSessionSchema, mockLoginSchema } from '@pastalavista/shared';
import type { Container } from '../../composition-root';
import { bearerToken } from '../helpers';

const HTTP_CREATED = 201;

/** Authentification SIMULÉE : aucun mot de passe, voir AuthService. */
export function authRoutes(app: FastifyInstance, container: Container): void {
  app.post('/auth/mock-login', async (request) => {
    const { customerId } = mockLoginSchema.parse(request.body);
    return container.auth.mockLogin(customerId);
  });

  app.get('/auth/me', async (request) => ({
    customer: await container.auth.me(bearerToken(request)),
  }));

  // La borne crée une session et affiche un QR code qui la désigne ; le smartphone la confirme
  app.post('/kiosk-login/sessions', async (request, reply) => {
    const { kioskId } = createLoginSessionSchema.parse(request.body);
    const session = await container.auth.createKioskLoginSession(kioskId);
    return reply.status(HTTP_CREATED).send({ session });
  });

  app.get<{ Params: { id: string } }>('/kiosk-login/sessions/:id', async (request) => ({
    session: await container.auth.getKioskLoginSession(request.params.id),
  }));

  app.post<{ Params: { id: string } }>('/kiosk-login/sessions/:id/confirm', async (request) => ({
    session: await container.auth.confirmKioskLogin(request.params.id, bearerToken(request)),
  }));
}
