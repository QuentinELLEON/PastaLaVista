import type { ApiErrorBody } from '@pastalavista/shared';
import { API_URL } from '../shared/env';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_PREFIX = '/api/v1';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT';
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/** Fonction de transport remplaçable (tests : API réelle appelée sans réseau). */
export type Fetcher = typeof fetch;
let fetcher: Fetcher = (...args) => fetch(...args);

export function setFetcher(next: Fetcher): void {
  fetcher = next;
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  return typeof value === 'object' && value !== null && 'error' in value;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetcher(`${API_URL}${API_PREFIX}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...options.headers,
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : 'Réseau indisponible';
    throw new ApiError(0, 'NETWORK_ERROR', reason);
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = isErrorBody(payload) ? payload.error : null;
    throw new ApiError(
      response.status,
      detail?.code ?? 'HTTP_ERROR',
      detail?.message ?? response.statusText,
    );
  }
  return payload as T;
}
