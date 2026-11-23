import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import type { ApiErrorBody } from '@pastalavista/shared';
import { DomainError, type DomainErrorCode } from '../domain/errors';

const STATUS_BY_CODE: Record<DomainErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNKNOWN_PRODUCT: 422,
  CUSTOMER_NOT_FOUND: 404,
  KIOSK_NOT_FOUND: 404,
  DRAFT_NOT_FOUND: 404,
  DRAFT_EXPIRED: 410,
  DRAFT_ALREADY_PAID: 409,
  DRAFT_ALREADY_RETRIEVED: 409,
  DRAFT_NOT_RETRIEVED: 409,
  INVALID_DRAFT_TOKEN: 403,
  CONCURRENT_UPDATE: 409,
  UNAUTHORIZED: 401,
  MOCK_AUTH_DISABLED: 403,
  LOGIN_SESSION_NOT_FOUND: 404,
  LOGIN_SESSION_EXPIRED: 410,
  NO_SAVED_CARD: 422,
  CODE_GENERATION_FAILED: 503,
  WRONG_KIOSK: 403,
};

const HTTP_BAD_REQUEST = 400;
const HTTP_NOT_FOUND = 404;
const HTTP_INTERNAL_ERROR = 500;

function body(code: string, message: string, details?: unknown): ApiErrorBody {
  return { error: { code, message, ...(details === undefined ? {} : { details }) } };
}

/** Format d'erreur unique : { error: { code, message, details? } }. */
export function handleError(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof DomainError) {
    void reply
      .status(STATUS_BY_CODE[error.code])
      .send(body(error.code, error.message, error.details));
    return;
  }
  if (error instanceof ZodError) {
    void reply
      .status(HTTP_BAD_REQUEST)
      .send(body('VALIDATION_ERROR', 'Données invalides.', error.issues));
    return;
  }
  const statusCode = (error as FastifyError).statusCode;
  if (statusCode && statusCode >= HTTP_BAD_REQUEST && statusCode < HTTP_INTERNAL_ERROR) {
    // Erreurs de protocole (JSON mal formé, corps trop gros...) : on ne renvoie pas le détail interne
    void reply.status(statusCode).send(body('BAD_REQUEST', 'Requête invalide.'));
    return;
  }
  request.log.error({ err: error }, 'erreur non gérée');
  void reply.status(HTTP_INTERNAL_ERROR).send(body('INTERNAL_ERROR', 'Erreur interne du serveur.'));
}

export function handleNotFound(_request: FastifyRequest, reply: FastifyReply): void {
  void reply.status(HTTP_NOT_FOUND).send(body('NOT_FOUND', 'Route inconnue.'));
}
