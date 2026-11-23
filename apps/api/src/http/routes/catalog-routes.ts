import type { FastifyInstance } from 'fastify';
import { catalogQuerySchema } from '@pastalavista/shared';
import type { Container } from '../../composition-root';

export function catalogRoutes(app: FastifyInstance, container: Container): void {
  app.get('/catalog/categories', async (request) => {
    const { locale } = catalogQuerySchema.parse(request.query);
    return { categories: await container.catalog.listCategories(locale) };
  });

  // La nutrition (kcal, protéines) fait partie de chaque produit
  app.get('/catalog/products', async (request) => {
    const { locale, kind, categoryId } = catalogQuerySchema.parse(request.query);
    return { products: await container.catalog.listProducts(locale, { kind, categoryId }) };
  });

  app.get('/catalog/compositions', async (request) => {
    const { locale } = catalogQuerySchema.parse(request.query);
    return { compositions: await container.catalog.listCompositions(locale) };
  });
}
