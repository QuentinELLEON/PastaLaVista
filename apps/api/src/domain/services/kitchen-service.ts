import type { KitchenTicket } from '../entities';
import type { KitchenQueueRepository } from '../ports/repositories';

export class KitchenService {
  constructor(private readonly queue: KitchenQueueRepository) {}

  listTickets(): Promise<KitchenTicket[]> {
    return this.queue.list();
  }
}
