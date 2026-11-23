import type { Category, Customer, Kiosk, Product, SavedPaymentMethod } from '../../domain/entities';
import type {
  CategoryRepository,
  CustomerRepository,
  KioskRepository,
  ProductRepository,
  SavedPaymentMethodRepository,
} from '../../domain/ports/repositories';

/** Copie défensive : l'appelant ne doit jamais pouvoir modifier l'état interne du « stockage ». */
export function copy<T>(value: T): T {
  return structuredClone(value);
}

export class MemoryCategoryRepository implements CategoryRepository {
  constructor(private readonly rows: Category[]) {}
  async list(): Promise<Category[]> {
    return copy(this.rows);
  }
}

export class MemoryProductRepository implements ProductRepository {
  constructor(private readonly rows: Product[]) {}
  async list(): Promise<Product[]> {
    return copy(this.rows);
  }
  async findById(id: string): Promise<Product | null> {
    const row = this.rows.find((product) => product.id === id);
    return row ? copy(row) : null;
  }
}

export class MemoryCustomerRepository implements CustomerRepository {
  constructor(private readonly rows: Customer[]) {}
  async findById(id: string): Promise<Customer | null> {
    const row = this.rows.find((customer) => customer.id === id);
    return row ? copy(row) : null;
  }
}

export class MemorySavedPaymentMethodRepository implements SavedPaymentMethodRepository {
  constructor(private readonly rows: SavedPaymentMethod[]) {}
  async findByCustomerId(customerId: string): Promise<SavedPaymentMethod | null> {
    const row = this.rows.find((method) => method.customerId === customerId);
    return row ? copy(row) : null;
  }
}

export class MemoryKioskRepository implements KioskRepository {
  constructor(private readonly rows: Kiosk[]) {}
  async findById(id: string): Promise<Kiosk | null> {
    const row = this.rows.find((kiosk) => kiosk.id === id);
    return row ? copy(row) : null;
  }
}
