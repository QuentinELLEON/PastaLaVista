import type { ActionDelay, Context } from '../src/adaptation/context/types';
import { EMPTY_SIGNALS } from '../src/adaptation/context/types';

export function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    device: 'kiosk',
    language: 'fr',
    customerId: null,
    customerOrderCount: 0,
    signals: EMPTY_SIGNALS,
    guidanceScore: 0,
    guidanceMode: 'standard',
    helpAnswer: 'none',
    helpRequested: false,
    highContrast: false,
    handoverReceived: false,
    draftProblem: 'none',
    ...overrides,
  };
}

/** Contextes types des personas. */
export const jeremyContext = (overrides: Partial<Context> = {}) =>
  makeContext({ customerId: 'cust-jeremy', customerOrderCount: 5, ...overrides });

export const alexeiContext = (overrides: Partial<Context> = {}) =>
  makeContext({
    language: 'ru',
    guidanceScore: 0.6,
    guidanceMode: 'guided',
    helpAnswer: 'accepted',
    ...overrides,
  });

export function slowDelays(count: number, referenceMs = 10_000, ratio = 3): ActionDelay[] {
  return Array.from({ length: count }, () => ({ delayMs: referenceMs * ratio, referenceMs }));
}
