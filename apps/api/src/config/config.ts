import { z } from 'zod';

const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;

const envSchema = z.object({
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  API_CORS_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  LOG_LEVEL: z.enum(LOG_LEVELS).default('info'),
  DRAFT_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  LOGIN_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(120),
  MOCK_AUTH_ENABLED: z.stringbool().default(true),
});

export interface AppConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  logLevel: (typeof LOG_LEVELS)[number];
  draftTtlMinutes: number;
  loginSessionTtlSeconds: number;
  mockAuthEnabled: boolean;
}

/** Lit et valide les variables d'environnement ; échoue au démarrage avec un message clair. */
export function loadConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join('.')} : ${issue.message}`);
    throw new Error(`Configuration invalide :\n${issues.join('\n')}`);
  }
  const values = parsed.data;
  return {
    host: values.API_HOST,
    port: values.API_PORT,
    corsOrigins: values.API_CORS_ORIGINS.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    logLevel: values.LOG_LEVEL,
    draftTtlMinutes: values.DRAFT_TTL_MINUTES,
    loginSessionTtlSeconds: values.LOGIN_SESSION_TTL_SECONDS,
    mockAuthEnabled: values.MOCK_AUTH_ENABLED,
  };
}
