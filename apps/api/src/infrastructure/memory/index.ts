import type { Repositories } from '../../domain/ports/repositories';
import { CATEGORY_SEED, PRODUCT_SEED } from '../seed/catalog.seed';
import {
  CUSTOMER_SEED,
  KIOSK_SEED,
  PAST_ORDER_SEED,
  SAVED_CARD_SEED,
} from '../seed/customers.seed';
import {
  MemoryKitchenQueueRepository,
  MemoryOrderDraftRepository,
  MemoryOrderRepository,
  MemoryPaymentRepository,
} from './order-repositories';
import {
  MemoryCategoryRepository,
  MemoryCustomerRepository,
  MemoryKioskRepository,
  MemoryProductRepository,
  MemorySavedPaymentMethodRepository,
} from './reference-repositories';
import {
  MemoryAuthSessionRepository,
  MemoryKioskLoginSessionRepository,
} from './session-repositories';

/** Dépôts en mémoire alimentés par les seeds : remplacés par des dépôts SQL dans le composition root. */
export function createMemoryRepositories(): Repositories {
  return {
    categories: new MemoryCategoryRepository(structuredClone(CATEGORY_SEED)),
    products: new MemoryProductRepository(structuredClone(PRODUCT_SEED)),
    customers: new MemoryCustomerRepository(structuredClone(CUSTOMER_SEED)),
    savedPaymentMethods: new MemorySavedPaymentMethodRepository(structuredClone(SAVED_CARD_SEED)),
    kiosks: new MemoryKioskRepository(structuredClone(KIOSK_SEED)),
    orderDrafts: new MemoryOrderDraftRepository(),
    orders: new MemoryOrderRepository(PAST_ORDER_SEED),
    payments: new MemoryPaymentRepository(),
    kitchenQueue: new MemoryKitchenQueueRepository(),
    kioskLoginSessions: new MemoryKioskLoginSessionRepository(),
    authSessions: new MemoryAuthSessionRepository(),
  };
}
