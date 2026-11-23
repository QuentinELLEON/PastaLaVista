export const DOMAIN_ERROR_CODES = [
  'VALIDATION_ERROR',
  'UNKNOWN_PRODUCT',
  'CUSTOMER_NOT_FOUND',
  'KIOSK_NOT_FOUND',
  'DRAFT_NOT_FOUND',
  'DRAFT_EXPIRED',
  'DRAFT_ALREADY_PAID',
  'DRAFT_ALREADY_RETRIEVED',
  'DRAFT_NOT_RETRIEVED',
  'INVALID_DRAFT_TOKEN',
  'CONCURRENT_UPDATE',
  'UNAUTHORIZED',
  'MOCK_AUTH_DISABLED',
  'LOGIN_SESSION_NOT_FOUND',
  'LOGIN_SESSION_EXPIRED',
  'NO_SAVED_CARD',
  'CODE_GENERATION_FAILED',
  'WRONG_KIOSK',
] as const;
export type DomainErrorCode = (typeof DOMAIN_ERROR_CODES)[number];

/** Erreur métier : le domaine ignore HTTP, la couche http associe un statut à chaque code. */
export class DomainError extends Error {
  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

/** Violation de clé unique à l'écriture (identifiant, code ou jeton déjà pris). */
export class DuplicateKeyError extends Error {
  constructor(entity: string, key: string) {
    super(`${entity} : clé déjà utilisée (${key})`);
    this.name = 'DuplicateKeyError';
  }
}
