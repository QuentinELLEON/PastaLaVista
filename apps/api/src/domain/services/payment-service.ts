import { computeTotals, type PayDraftRequest } from '@pastalavista/shared';
import type { KitchenTicket, Order, OrderDraft, Payment } from '../entities';
import { DomainError } from '../errors';
import type {
  KioskRepository,
  KitchenQueueRepository,
  OrderDraftRepository,
  OrderRepository,
  PaymentRepository,
  SavedPaymentMethodRepository,
} from '../ports/repositories';
import type { Clock, IdGenerator } from '../ports/system';
import type { CatalogService } from './catalog-service';
import type { DraftLifecycle } from './draft-lifecycle';

const ORDER_NUMBER_PAD = 3;

export function formatOrderNumber(number: number): string {
  return `A${String(number).padStart(ORDER_NUMBER_PAD, '0')}`;
}

export interface PaymentServiceDeps {
  drafts: OrderDraftRepository;
  orders: OrderRepository;
  payments: PaymentRepository;
  kitchenQueue: KitchenQueueRepository;
  kiosks: KioskRepository;
  savedPaymentMethods: SavedPaymentMethodRepository;
  catalog: CatalogService;
  lifecycle: DraftLifecycle;
  clock: Clock;
  ids: IdGenerator;
}

export interface PaymentResult {
  order: Order;
  payment: Payment;
  ticket: KitchenTicket;
}

/**
 * Paiement SIMULÉ à la borne. Règle centrale : rien n'atteint la cuisine avant le paiement,
 * et le paiement n'est possible que pour un brouillon récupéré par la borne qui paie.
 * (Avec une base SQL, les écritures ci-dessous seraient regroupées dans une transaction.)
 */
export class PaymentService {
  constructor(private readonly deps: PaymentServiceDeps) {}

  async pay(
    draftId: string,
    token: string | undefined,
    input: PayDraftRequest,
  ): Promise<PaymentResult> {
    const { drafts, lifecycle, clock, ids } = this.deps;
    const found = await drafts.findById(draftId);
    if (!found) throw new DomainError('DRAFT_NOT_FOUND', 'Commande introuvable.');
    lifecycle.assertToken(found, token);
    const draft = await lifecycle.expireIfNeeded(found);
    lifecycle.assertUsable(draft);
    await this.assertPayableAt(draft, input.kioskId);

    const totals = computeTotals(draft.lines, await this.deps.catalog.pricingIndex());
    const cardLast4 = await this.resolveCardLast4(draft, input);

    // 1. Paiement : verrou optimiste retrieved -> paid (deux paiements simultanés : un seul passe)
    const paidDraft = await drafts.update(
      { ...draft, status: 'paid', updatedAt: clock.now().toISOString() },
      'retrieved',
    );
    if (!paidDraft) throw new DomainError('CONCURRENT_UPDATE', 'Le paiement est déjà en cours.');

    const now = clock.now().toISOString();
    const orderId = ids.newId();
    const number = await this.deps.orders.nextNumber();
    const order = await this.deps.orders.create({
      id: orderId,
      number,
      draftId: draft.id,
      customerId: draft.customerId,
      mode: draft.mode,
      locale: draft.locale,
      lines: draft.lines,
      totalCents: totals.totalCents,
      kcal: totals.kcal,
      proteinG: totals.proteinG,
      status: 'sent-to-kitchen',
      createdAt: now,
    });
    const payment = await this.deps.payments.create({
      id: ids.newId(),
      orderId,
      amountCents: totals.totalCents,
      method: input.method,
      cardLast4,
      createdAt: now,
    });

    // 2. Cuisine : uniquement après l'enregistrement du paiement
    const ticket = await this.deps.kitchenQueue.enqueue({
      id: ids.newId(),
      orderId,
      displayNumber: formatOrderNumber(number),
      status: 'queued',
      lines: draft.lines,
      mode: draft.mode,
      createdAt: now,
    });
    await drafts.update({ ...paidDraft, status: 'sent-to-kitchen', updatedAt: now }, 'paid');
    return { order, payment, ticket };
  }

  private async assertPayableAt(draft: OrderDraft, kioskId: string): Promise<void> {
    const kiosk = await this.deps.kiosks.findById(kioskId);
    if (!kiosk || !kiosk.active) throw new DomainError('KIOSK_NOT_FOUND', 'Borne inconnue.');
    // Un brouillon encore au statut « draft » n'a jamais été présenté à une borne : pas de paiement sur smartphone
    if (draft.status !== 'retrieved') {
      throw new DomainError(
        'DRAFT_NOT_RETRIEVED',
        'Le paiement se fait uniquement à la borne, après avoir récupéré la commande.',
      );
    }
    if (draft.kioskId !== kioskId) {
      throw new DomainError('WRONG_KIOSK', 'Cette commande est liée à une autre borne.');
    }
  }

  private async resolveCardLast4(
    draft: OrderDraft,
    input: PayDraftRequest,
  ): Promise<string | null> {
    if (!input.useSavedCard) return null;
    const saved = draft.customerId
      ? await this.deps.savedPaymentMethods.findByCustomerId(draft.customerId)
      : null;
    if (!saved) throw new DomainError('NO_SAVED_CARD', 'Aucune carte enregistrée pour ce client.');
    return saved.last4;
  }
}
