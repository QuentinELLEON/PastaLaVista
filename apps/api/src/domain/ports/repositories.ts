import type { DraftStatus } from '@pastalavista/shared';
import type {
  AuthSession,
  Category,
  Customer,
  Kiosk,
  KioskLoginSession,
  KitchenTicket,
  Order,
  OrderDraft,
  Payment,
  Product,
  SavedPaymentMethod,
} from '../entities';

// Contrat commun à toutes les implémentations (mémoire aujourd'hui, SQL demain) :
// méthodes asynchrones, objets simples renvoyés par COPIE, jamais de type propre au stockage.

export interface CategoryRepository {
  list(): Promise<Category[]>;
}

export interface ProductRepository {
  list(): Promise<Product[]>;
  findById(id: string): Promise<Product | null>;
}

export interface CustomerRepository {
  findById(id: string): Promise<Customer | null>;
}

export interface SavedPaymentMethodRepository {
  findByCustomerId(customerId: string): Promise<SavedPaymentMethod | null>;
}

export interface KioskRepository {
  findById(id: string): Promise<Kiosk | null>;
}

export interface OrderDraftRepository {
  /** Lève DuplicateKeyError si l'identifiant, le code ou le jeton existe déjà. */
  create(draft: OrderDraft): Promise<OrderDraft>;
  findById(id: string): Promise<OrderDraft | null>;
  findByToken(token: string): Promise<OrderDraft | null>;
  findByCode(code: string): Promise<OrderDraft | null>;
  /**
   * Remplace le brouillon seulement si son statut stocké vaut `expectedStatus`
   * (verrou optimiste : empêche deux bornes de récupérer ou de payer le même brouillon).
   * Renvoie null si le statut a changé entre-temps ou si le brouillon n'existe pas.
   */
  update(draft: OrderDraft, expectedStatus: DraftStatus): Promise<OrderDraft | null>;
}

export interface OrderRepository {
  create(order: Order): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  countByCustomerId(customerId: string): Promise<number>;
  /** Séquence des numéros de commande (séquence SQL plus tard). */
  nextNumber(): Promise<number>;
}

export interface PaymentRepository {
  create(payment: Payment): Promise<Payment>;
  findByOrderId(orderId: string): Promise<Payment | null>;
}

export interface KitchenQueueRepository {
  enqueue(ticket: KitchenTicket): Promise<KitchenTicket>;
  /** Tickets dans l'ordre d'arrivée. */
  list(): Promise<KitchenTicket[]>;
}

export interface KioskLoginSessionRepository {
  create(session: KioskLoginSession): Promise<KioskLoginSession>;
  findById(id: string): Promise<KioskLoginSession | null>;
  save(session: KioskLoginSession): Promise<KioskLoginSession>;
}

export interface AuthSessionRepository {
  create(session: AuthSession): Promise<AuthSession>;
  findByToken(token: string): Promise<AuthSession | null>;
}

export interface Repositories {
  categories: CategoryRepository;
  products: ProductRepository;
  customers: CustomerRepository;
  savedPaymentMethods: SavedPaymentMethodRepository;
  kiosks: KioskRepository;
  orderDrafts: OrderDraftRepository;
  orders: OrderRepository;
  payments: PaymentRepository;
  kitchenQueue: KitchenQueueRepository;
  kioskLoginSessions: KioskLoginSessionRepository;
  authSessions: AuthSessionRepository;
}
