import type { ChatEngine, Clock, IdGenerator } from './domain/ports/system';
import type { Repositories } from './domain/ports/repositories';
import { AuthService, type AuthPolicy } from './domain/services/auth-service';
import { CatalogService } from './domain/services/catalog-service';
import { DraftLifecycle } from './domain/services/draft-lifecycle';
import { KitchenService } from './domain/services/kitchen-service';
import { OrderDraftService, type DraftPolicy } from './domain/services/order-draft-service';
import { PaymentService } from './domain/services/payment-service';
import { RuleBasedChatEngine } from './chat/rule-based-chat-engine';
import { createMemoryRepositories } from './infrastructure/memory';
import { cryptoIdGenerator, systemClock } from './infrastructure/system/system';

export interface Container {
  catalog: CatalogService;
  drafts: OrderDraftService;
  payments: PaymentService;
  kitchen: KitchenService;
  auth: AuthService;
  chat: ChatEngine;
}

export interface ContainerOptions {
  policy: DraftPolicy & AuthPolicy;
  /** Surcharges pour les tests ou pour brancher d'autres implémentations. */
  repositories?: Repositories;
  clock?: Clock;
  ids?: IdGenerator;
  chatEngine?: ChatEngine;
}

/**
 * COMPOSITION ROOT : le seul fichier qui connaît les implémentations concrètes.
 * Pour passer à une base de données, remplacer `createMemoryRepositories()` par des dépôts SQL
 * respectant les mêmes interfaces (voir docs/migration-base-de-donnees.md).
 */
export function createContainer(options: ContainerOptions): Container {
  const repositories = options.repositories ?? createMemoryRepositories();
  const clock = options.clock ?? systemClock;
  const ids = options.ids ?? cryptoIdGenerator;

  const catalog = new CatalogService(repositories.categories, repositories.products);
  const lifecycle = new DraftLifecycle(repositories.orderDrafts, clock);

  return {
    catalog,
    drafts: new OrderDraftService({
      drafts: repositories.orderDrafts,
      customers: repositories.customers,
      kiosks: repositories.kiosks,
      catalog,
      lifecycle,
      clock,
      ids,
      policy: { ttlMinutes: options.policy.ttlMinutes },
    }),
    payments: new PaymentService({
      drafts: repositories.orderDrafts,
      orders: repositories.orders,
      payments: repositories.payments,
      kitchenQueue: repositories.kitchenQueue,
      kiosks: repositories.kiosks,
      savedPaymentMethods: repositories.savedPaymentMethods,
      catalog,
      lifecycle,
      clock,
      ids,
    }),
    kitchen: new KitchenService(repositories.kitchenQueue),
    auth: new AuthService({
      customers: repositories.customers,
      authSessions: repositories.authSessions,
      loginSessions: repositories.kioskLoginSessions,
      kiosks: repositories.kiosks,
      orders: repositories.orders,
      savedPaymentMethods: repositories.savedPaymentMethods,
      clock,
      ids,
      policy: {
        mockAuthEnabled: options.policy.mockAuthEnabled,
        loginSessionTtlSeconds: options.policy.loginSessionTtlSeconds,
      },
    }),
    chat: options.chatEngine ?? new RuleBasedChatEngine(catalog),
  };
}
