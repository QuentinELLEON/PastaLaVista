import type { ChatReplyDto, ChatRequest } from '@pastalavista/shared';

export interface Clock {
  now(): Date;
}

/** Génération des identifiants et secrets : injectable pour des tests déterministes. */
export interface IdGenerator {
  newId(): string;
  newToken(): string;
  /** Code court de brouillon au format PL-xxxx. */
  newDraftCode(): string;
}

/** Moteur de conversation : l'implémentation à règles pourra être remplacée par un modèle de langage contraint par le catalogue. */
export interface ChatEngine {
  reply(request: ChatRequest): Promise<ChatReplyDto>;
}
