import {
  computeTotals,
  normalizeDraftCode,
  UnknownProductError,
  type CreateDraftRequest,
  type OrderDraftDto,
  type OrderLine,
  type OrderLineInput,
  type RetrieveDraftRequest,
  type Totals,
  type UpdateDraftRequest,
} from '@pastalavista/shared';
import type { OrderDraft } from '../entities';
import { DomainError, DuplicateKeyError } from '../errors';
import type {
  CustomerRepository,
  KioskRepository,
  OrderDraftRepository,
} from '../ports/repositories';
import type { Clock, IdGenerator } from '../ports/system';
import type { CatalogService } from './catalog-service';
import type { DraftLifecycle } from './draft-lifecycle';

const MS_PER_MINUTE = 60_000;
const MAX_CODE_ATTEMPTS = 20;

export interface DraftPolicy {
  ttlMinutes: number;
}

export interface OrderDraftServiceDeps {
  drafts: OrderDraftRepository;
  customers: CustomerRepository;
  kiosks: KioskRepository;
  catalog: CatalogService;
  lifecycle: DraftLifecycle;
  clock: Clock;
  ids: IdGenerator;
  policy: DraftPolicy;
}

export class OrderDraftService {
  constructor(private readonly deps: OrderDraftServiceDeps) {}

  async create(input: CreateDraftRequest): Promise<OrderDraft> {
    const { clock, customers, drafts, ids } = this.deps;
    if (input.origin === 'kiosk' && !input.kioskId) {
      throw new DomainError('VALIDATION_ERROR', 'Un brouillon de borne doit indiquer son kioskId.');
    }
    if (input.kioskId) await this.requireKiosk(input.kioskId);
    if (input.customerId && !(await customers.findById(input.customerId))) {
      throw new DomainError('CUSTOMER_NOT_FOUND', 'Client introuvable.');
    }
    await this.totalsFor(input.lines);

    const now = clock.now();
    const isKiosk = input.origin === 'kiosk';
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt += 1) {
      const draft: OrderDraft = {
        id: ids.newId(),
        code: ids.newDraftCode(),
        token: ids.newToken(),
        // Sur la borne, la commande est déjà « retrouvée » : elle est liée à cette borne
        status: isKiosk ? 'retrieved' : 'draft',
        origin: input.origin,
        mode: input.mode,
        locale: input.locale,
        customerId: input.customerId,
        kioskId: input.kioskId ?? null,
        lines: this.withIds(input.lines),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: this.expiryFrom(now),
        retrievedAt: isKiosk ? now.toISOString() : null,
      };
      try {
        return await drafts.create(draft);
      } catch (error) {
        if (!(error instanceof DuplicateKeyError)) throw error;
      }
    }
    throw new DomainError(
      'CODE_GENERATION_FAILED',
      'Impossible de générer un code de commande unique.',
    );
  }

  async get(id: string, token: string | undefined): Promise<OrderDraft> {
    const draft = await this.loadWithToken(id, token);
    return this.deps.lifecycle.expireIfNeeded(draft);
  }

  async update(
    id: string,
    token: string | undefined,
    input: UpdateDraftRequest,
  ): Promise<OrderDraft> {
    const { lifecycle, clock, drafts } = this.deps;
    const current = await lifecycle.expireIfNeeded(await this.loadWithToken(id, token));
    lifecycle.assertUsable(current);
    await this.totalsFor(input.lines);

    const now = clock.now();
    const next: OrderDraft = {
      ...current,
      mode: input.mode,
      locale: input.locale,
      lines: this.withIds(input.lines),
      updatedAt: now.toISOString(),
      // Délai glissant tant que le client prépare sur son smartphone ; fixe une fois à la borne
      expiresAt: current.status === 'draft' ? this.expiryFrom(now) : current.expiresAt,
    };
    const saved = await drafts.update(next, current.status);
    if (!saved) throw new DomainError('CONCURRENT_UPDATE', 'La commande a changé, rechargez-la.');
    return saved;
  }

  /** Le jeton (QR code) ou le code (PL-xxxx) est présenté à une borne : le brouillon lui est lié. */
  async retrieve(input: RetrieveDraftRequest): Promise<OrderDraft> {
    const { drafts, lifecycle, clock } = this.deps;
    await this.requireKiosk(input.kioskId);

    const found = await this.find(input);
    if (!found) throw new DomainError('DRAFT_NOT_FOUND', 'Commande introuvable.');
    const draft = await lifecycle.expireIfNeeded(found);
    lifecycle.assertUsable(draft);

    if (draft.status === 'retrieved') {
      // Relecture par la même borne (rechargement de page) : autorisée ; une autre borne : refusée
      if (draft.kioskId === input.kioskId) return draft;
      throw new DomainError(
        'DRAFT_ALREADY_RETRIEVED',
        'Cette commande a déjà été récupérée sur une autre borne.',
      );
    }
    const now = clock.now().toISOString();
    const next: OrderDraft = {
      ...draft,
      status: 'retrieved',
      kioskId: input.kioskId,
      retrievedAt: now,
      updatedAt: now,
    };
    const saved = await drafts.update(next, 'draft');
    if (!saved)
      throw new DomainError('CONCURRENT_UPDATE', 'La commande vient d’être récupérée ailleurs.');
    return saved;
  }

  async totalsOf(lines: OrderLineInput[]): Promise<Totals> {
    return this.totalsFor(lines);
  }

  toDto(draft: OrderDraft, totals: Totals): OrderDraftDto {
    return {
      id: draft.id,
      code: draft.code,
      status: draft.status,
      origin: draft.origin,
      mode: draft.mode,
      locale: draft.locale,
      customerId: draft.customerId,
      kioskId: draft.kioskId,
      lines: draft.lines,
      totals,
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt,
      expiresAt: draft.expiresAt,
    };
  }

  private find(input: RetrieveDraftRequest): Promise<OrderDraft | null> {
    const { drafts } = this.deps;
    if (input.token !== undefined) return drafts.findByToken(input.token);
    const code = normalizeDraftCode(input.code ?? '');
    return code ? drafts.findByCode(code) : Promise.resolve(null);
  }

  private async loadWithToken(id: string, token: string | undefined): Promise<OrderDraft> {
    const draft = await this.deps.drafts.findById(id);
    if (!draft) throw new DomainError('DRAFT_NOT_FOUND', 'Commande introuvable.');
    this.deps.lifecycle.assertToken(draft, token);
    return draft;
  }

  private async requireKiosk(kioskId: string): Promise<void> {
    const kiosk = await this.deps.kiosks.findById(kioskId);
    if (!kiosk || !kiosk.active) throw new DomainError('KIOSK_NOT_FOUND', 'Borne inconnue.');
  }

  private async totalsFor(lines: OrderLineInput[]): Promise<Totals> {
    try {
      return computeTotals(lines, await this.deps.catalog.pricingIndex());
    } catch (error) {
      if (error instanceof UnknownProductError) {
        throw new DomainError('UNKNOWN_PRODUCT', error.message, { productId: error.productId });
      }
      throw error;
    }
  }

  private withIds(lines: OrderLineInput[]): OrderLine[] {
    return lines.map((line) => ({
      ...line,
      id: this.deps.ids.newId(),
      options: line.options.map((o) => ({ ...o })),
    }));
  }

  private expiryFrom(now: Date): string {
    return new Date(now.getTime() + this.deps.policy.ttlMinutes * MS_PER_MINUTE).toISOString();
  }
}
