import cors from '@fastify/cors';
import Fastify, { type FastifyInstance } from 'fastify';
import type { Container } from '../composition-root';
import { handleError, handleNotFound } from './errors';
import { authRoutes } from './routes/auth-routes';
import { catalogRoutes } from './routes/catalog-routes';
import { orderRoutes } from './routes/order-routes';

export const API_PREFIX = '/api/v1';

export interface AppOptions {
  corsOrigins: string[];
  logLevel: string;
}

/**
 * Journalisation sans données personnelles : on ne consigne que la méthode et le MOTIF de route
 * (jamais les paramètres, la requête, les en-têtes ni les corps de message).
 */
function loggerOptions(level: string) {
  return {
    level,
    serializers: {
      req: (request: { method: string; routeOptions?: { url?: string } }) => ({
        method: request.method,
        route: request.routeOptions?.url ?? 'inconnue',
      }),
    },
  };
}

export async function buildApp(
  container: Container,
  options: AppOptions,
): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logLevel === 'silent' ? false : loggerOptions(options.logLevel),
  });

  await app.register(cors, { origin: options.corsOrigins });
  app.setErrorHandler(handleError);
  app.setNotFoundHandler(handleNotFound);

  await app.register(
    async (api) => {
      api.get('/health', async () => ({ status: 'ok', time: new Date().toISOString() }));
      catalogRoutes(api, container);
      authRoutes(api, container);
      orderRoutes(api, container);
    },
    { prefix: API_PREFIX },
  );
  return app;
}
