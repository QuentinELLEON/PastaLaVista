import type { CreateDraftRequest } from '@pastalavista/shared';
import { createContainer, type Container } from '../src/composition-root';
import type { Clock, IdGenerator } from '../src/domain/ports/system';
import { createMemoryRepositories } from '../src/infrastructure/memory';
import type { Repositories } from '../src/domain/ports/repositories';

export const START = '2026-11-25T11:50:00.000Z';
export const TTL_MINUTES = 30;
export const LOGIN_TTL_SECONDS = 120;

export class FakeClock implements Clock {
  private current: number;
  constructor(iso: string = START) {
    this.current = Date.parse(iso);
  }
  now(): Date {
    return new Date(this.current);
  }
  advanceMinutes(minutes: number): void {
    this.current += minutes * 60_000;
  }
  advanceSeconds(seconds: number): void {
    this.current += seconds * 1000;
  }
}

/** Identifiants prévisibles : id-1, token-1, PL-0001... */
export class SequentialIds implements IdGenerator {
  private n = 0;
  private codes = 0;
  newId(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
  newToken(): string {
    this.n += 1;
    return `token-${this.n}`;
  }
  newDraftCode(): string {
    this.codes += 1;
    return `PL-${String(this.codes).padStart(4, '0')}`;
  }
}

export interface TestContext {
  container: Container;
  clock: FakeClock;
  repositories: Repositories;
}

export interface TestOptions {
  mockAuthEnabled?: boolean;
  /** Permet d'envelopper les dépôts (espions) sans toucher aux services. */
  transform?: (repositories: Repositories) => Repositories;
}

export function buildTestContext(overrides: TestOptions = {}): TestContext {
  const clock = new FakeClock();
  const base = createMemoryRepositories();
  const repositories = overrides.transform ? overrides.transform(base) : base;
  const container = createContainer({
    repositories,
    clock,
    ids: new SequentialIds(),
    policy: {
      ttlMinutes: TTL_MINUTES,
      loginSessionTtlSeconds: LOGIN_TTL_SECONDS,
      mockAuthEnabled: overrides.mockAuthEnabled ?? true,
    },
  });
  return { container, clock, repositories };
}

export const USUAL_LINES: CreateDraftRequest['lines'] = [
  {
    productId: 'pasta-penne',
    quantity: 1,
    extraXl: false,
    options: [
      { productId: 'sauce-bolognaise', quantity: 1 },
      { productId: 'extra-parmesan', quantity: 1 },
    ],
  },
];

export function phoneDraft(overrides: Partial<CreateDraftRequest> = {}): CreateDraftRequest {
  return {
    origin: 'smartphone',
    mode: 'dine-in',
    locale: 'fr',
    customerId: 'cust-jeremy',
    lines: USUAL_LINES,
    ...overrides,
  };
}
