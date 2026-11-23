import type { DraftStatus } from '@pastalavista/shared';
import type { KitchenTicket, Order, OrderDraft, Payment } from '../../domain/entities';
import { DuplicateKeyError } from '../../domain/errors';
import type {
  KitchenQueueRepository,
  OrderDraftRepository,
  OrderRepository,
  PaymentRepository,
} from '../../domain/ports/repositories';
import { copy } from './reference-repositories';

export class MemoryOrderDraftRepository implements OrderDraftRepository {
  private readonly rows = new Map<string, OrderDraft>();

  async create(draft: OrderDraft): Promise<OrderDraft> {
    const clash = [...this.rows.values()].find(
      (row) => row.id === draft.id || row.code === draft.code || row.token === draft.token,
    );
    if (clash) throw new DuplicateKeyError('order_draft', `${draft.id}/${draft.code}`);
    this.rows.set(draft.id, copy(draft));
    return copy(draft);
  }

  async findById(id: string): Promise<OrderDraft | null> {
    const row = this.rows.get(id);
    return row ? copy(row) : null;
  }

  async findByToken(token: string): Promise<OrderDraft | null> {
    const row = [...this.rows.values()].find((draft) => draft.token === token);
    return row ? copy(row) : null;
  }

  async findByCode(code: string): Promise<OrderDraft | null> {
    const row = [...this.rows.values()].find((draft) => draft.code === code);
    return row ? copy(row) : null;
  }

  async update(draft: OrderDraft, expectedStatus: DraftStatus): Promise<OrderDraft | null> {
    const current = this.rows.get(draft.id);
    if (!current || current.status !== expectedStatus) return null;
    this.rows.set(draft.id, copy(draft));
    return copy(draft);
  }
}

export class MemoryOrderRepository implements OrderRepository {
  private readonly rows = new Map<string, Order>();

  constructor(seed: Order[] = []) {
    seed.forEach((order) => this.rows.set(order.id, copy(order)));
  }

  async create(order: Order): Promise<Order> {
    if (this.rows.has(order.id)) throw new DuplicateKeyError('order', order.id);
    this.rows.set(order.id, copy(order));
    return copy(order);
  }

  async findById(id: string): Promise<Order | null> {
    const row = this.rows.get(id);
    return row ? copy(row) : null;
  }

  async countByCustomerId(customerId: string): Promise<number> {
    return [...this.rows.values()].filter((order) => order.customerId === customerId).length;
  }

  async nextNumber(): Promise<number> {
    const numbers = [...this.rows.values()].map((order) => order.number);
    return numbers.length === 0 ? 1 : Math.max(...numbers) + 1;
  }
}

export class MemoryPaymentRepository implements PaymentRepository {
  private readonly rows = new Map<string, Payment>();

  async create(payment: Payment): Promise<Payment> {
    if (this.rows.has(payment.id)) throw new DuplicateKeyError('payment', payment.id);
    this.rows.set(payment.id, copy(payment));
    return copy(payment);
  }

  async findByOrderId(orderId: string): Promise<Payment | null> {
    const row = [...this.rows.values()].find((payment) => payment.orderId === orderId);
    return row ? copy(row) : null;
  }
}

export class MemoryKitchenQueueRepository implements KitchenQueueRepository {
  private readonly rows: KitchenTicket[] = [];

  async enqueue(ticket: KitchenTicket): Promise<KitchenTicket> {
    if (this.rows.some((row) => row.id === ticket.id))
      throw new DuplicateKeyError('kitchen_ticket', ticket.id);
    this.rows.push(copy(ticket));
    return copy(ticket);
  }

  async list(): Promise<KitchenTicket[]> {
    return copy(this.rows);
  }
}
