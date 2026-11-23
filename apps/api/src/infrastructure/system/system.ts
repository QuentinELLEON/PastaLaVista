import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { DRAFT_CODE_DIGITS, DRAFT_CODE_PREFIX } from '@pastalavista/shared';
import type { Clock, IdGenerator } from '../../domain/ports/system';

const TOKEN_BYTES = 24;

export const systemClock: Clock = { now: () => new Date() };

export const cryptoIdGenerator: IdGenerator = {
  newId: () => randomUUID(),
  newToken: () => randomBytes(TOKEN_BYTES).toString('base64url'),
  newDraftCode: () => {
    const max = 10 ** DRAFT_CODE_DIGITS;
    return `${DRAFT_CODE_PREFIX}${String(randomInt(max)).padStart(DRAFT_CODE_DIGITS, '0')}`;
  },
};
