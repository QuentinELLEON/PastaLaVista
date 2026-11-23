import type {
  CustomerProfileDto,
  KioskLoginSessionDto,
  MockLoginResponse,
} from '@pastalavista/shared';
import type { Customer, KioskLoginSession } from '../entities';
import { DomainError } from '../errors';
import type {
  AuthSessionRepository,
  CustomerRepository,
  KioskLoginSessionRepository,
  KioskRepository,
  OrderRepository,
  SavedPaymentMethodRepository,
} from '../ports/repositories';
import type { Clock, IdGenerator } from '../ports/system';

const MS_PER_SECOND = 1000;

export interface AuthPolicy {
  mockAuthEnabled: boolean;
  loginSessionTtlSeconds: number;
}

export interface AuthServiceDeps {
  customers: CustomerRepository;
  authSessions: AuthSessionRepository;
  loginSessions: KioskLoginSessionRepository;
  kiosks: KioskRepository;
  orders: OrderRepository;
  savedPaymentMethods: SavedPaymentMethodRepository;
  clock: Clock;
  ids: IdGenerator;
  policy: AuthPolicy;
}

/**
 * Authentification SIMULÉE : aucun mot de passe, un identifiant client suffit.
 * Sert uniquement à démontrer la connexion par QR code de la borne.
 */
export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async mockLogin(customerId: string): Promise<MockLoginResponse> {
    this.assertMockEnabled();
    const customer = await this.requireCustomer(customerId);
    const session = await this.deps.authSessions.create({
      token: this.deps.ids.newToken(),
      customerId: customer.id,
      createdAt: this.deps.clock.now().toISOString(),
    });
    return { sessionToken: session.token, customer: await this.toProfile(customer) };
  }

  async me(sessionToken: string | undefined): Promise<CustomerProfileDto> {
    return this.toProfile(await this.customerFromToken(sessionToken));
  }

  async createKioskLoginSession(kioskId: string): Promise<KioskLoginSessionDto> {
    const kiosk = await this.deps.kiosks.findById(kioskId);
    if (!kiosk || !kiosk.active) throw new DomainError('KIOSK_NOT_FOUND', 'Borne inconnue.');
    const now = this.deps.clock.now();
    const session = await this.deps.loginSessions.create({
      id: this.deps.ids.newId(),
      kioskId,
      status: 'pending',
      customerId: null,
      createdAt: now.toISOString(),
      expiresAt: new Date(
        now.getTime() + this.deps.policy.loginSessionTtlSeconds * MS_PER_SECOND,
      ).toISOString(),
    });
    return this.toSessionDto(session);
  }

  async getKioskLoginSession(id: string): Promise<KioskLoginSessionDto> {
    return this.toSessionDto(await this.requireSession(id));
  }

  /** Le smartphone connecté confirme : la borne affichant ce QR code reconnaît alors le client. */
  async confirmKioskLogin(
    id: string,
    sessionToken: string | undefined,
  ): Promise<KioskLoginSessionDto> {
    const customer = await this.customerFromToken(sessionToken);
    const session = await this.requireSession(id);
    if (this.isExpired(session))
      throw new DomainError('LOGIN_SESSION_EXPIRED', 'Le QR code de connexion a expiré.');
    const confirmed = await this.deps.loginSessions.save({
      ...session,
      status: 'authenticated',
      customerId: customer.id,
    });
    return this.toSessionDto(confirmed);
  }

  private assertMockEnabled(): void {
    if (!this.deps.policy.mockAuthEnabled) {
      throw new DomainError('MOCK_AUTH_DISABLED', 'La connexion de démonstration est désactivée.');
    }
  }

  private async requireCustomer(customerId: string): Promise<Customer> {
    const customer = await this.deps.customers.findById(customerId);
    if (!customer) throw new DomainError('CUSTOMER_NOT_FOUND', 'Client introuvable.');
    return customer;
  }

  private async customerFromToken(sessionToken: string | undefined): Promise<Customer> {
    const session = sessionToken ? await this.deps.authSessions.findByToken(sessionToken) : null;
    if (!session) throw new DomainError('UNAUTHORIZED', 'Session absente ou invalide.');
    return this.requireCustomer(session.customerId);
  }

  private async requireSession(id: string): Promise<KioskLoginSession> {
    const session = await this.deps.loginSessions.findById(id);
    if (!session)
      throw new DomainError('LOGIN_SESSION_NOT_FOUND', 'Session de connexion introuvable.');
    return session;
  }

  private isExpired(session: KioskLoginSession): boolean {
    return this.deps.clock.now().getTime() >= Date.parse(session.expiresAt);
  }

  private async toSessionDto(session: KioskLoginSession): Promise<KioskLoginSessionDto> {
    const authenticated = session.status === 'authenticated' && session.customerId;
    const customer = authenticated
      ? await this.deps.customers.findById(session.customerId as string)
      : null;
    // Une session déjà authentifiée reste lisible jusqu'à son expiration, puis disparaît (écran public)
    const status = this.isExpired(session) ? 'expired' : session.status;
    return {
      id: session.id,
      kioskId: session.kioskId,
      status,
      expiresAt: session.expiresAt,
      customer: status === 'authenticated' && customer ? await this.toProfile(customer) : null,
    };
  }

  private async toProfile(customer: Customer): Promise<CustomerProfileDto> {
    const { orders, savedPaymentMethods } = this.deps;
    const [orderCount, usual, card] = await Promise.all([
      orders.countByCustomerId(customer.id),
      customer.usualOrderId ? orders.findById(customer.usualOrderId) : Promise.resolve(null),
      savedPaymentMethods.findByCustomerId(customer.id),
    ]);
    return {
      id: customer.id,
      displayName: customer.displayName,
      locale: customer.locale,
      orderCount,
      usualOrder: usual ? { mode: usual.mode, lines: usual.lines } : null,
      savedCard: card ? { brand: card.brand, last4: card.last4 } : null,
    };
  }
}
