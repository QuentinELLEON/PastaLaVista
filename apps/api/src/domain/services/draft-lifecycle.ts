import type { OrderDraft } from '../entities';
import { DomainError } from '../errors';
import type { Clock } from '../ports/system';
import type { OrderDraftRepository } from '../ports/repositories';

/**
 * Règles de cycle de vie partagées par le service de brouillons et le service de paiement :
 * expiration paresseuse (calculée à la lecture) et refus explicites des brouillons inutilisables.
 */
export class DraftLifecycle {
  constructor(
    private readonly drafts: OrderDraftRepository,
    private readonly clock: Clock,
  ) {}

  /** Passe un brouillon `draft` ou `retrieved` dépassé à `expired` (et le persiste). */
  async expireIfNeeded(draft: OrderDraft): Promise<OrderDraft> {
    const isOpen = draft.status === 'draft' || draft.status === 'retrieved';
    if (!isOpen || this.clock.now().getTime() < Date.parse(draft.expiresAt)) return draft;
    const expired: OrderDraft = { ...draft, status: 'expired' };
    // Si un autre appel a changé le statut entre-temps, on relit l'état réel
    return (await this.drafts.update(expired, draft.status)) ?? (await this.reload(draft.id));
  }

  assertUsable(draft: OrderDraft): void {
    if (draft.status === 'expired') {
      throw new DomainError(
        'DRAFT_EXPIRED',
        'Cette commande a expiré : recommencez la préparation.',
      );
    }
    if (draft.status === 'paid' || draft.status === 'sent-to-kitchen') {
      throw new DomainError('DRAFT_ALREADY_PAID', 'Cette commande est déjà payée.');
    }
  }

  assertToken(draft: OrderDraft, token: string | undefined): void {
    if (!token || token !== draft.token) {
      throw new DomainError('INVALID_DRAFT_TOKEN', 'Jeton de commande invalide.');
    }
  }

  private async reload(id: string): Promise<OrderDraft> {
    const draft = await this.drafts.findById(id);
    if (!draft) throw new DomainError('DRAFT_NOT_FOUND', 'Commande introuvable.');
    return draft;
  }
}
