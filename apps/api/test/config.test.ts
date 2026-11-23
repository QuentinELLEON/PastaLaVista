import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config/config';

describe('loadConfig', () => {
  it('applique les valeurs par défaut (brouillon : 30 minutes)', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({ port: 3001, draftTtlMinutes: 30, mockAuthEnabled: true });
    expect(config.corsOrigins).toContain('http://localhost:5173');
  });

  it('lit les variables d’environnement', () => {
    const config = loadConfig({
      API_PORT: '4000',
      DRAFT_TTL_MINUTES: '5',
      MOCK_AUTH_ENABLED: 'false',
      API_CORS_ORIGINS: 'http://a, http://b',
    });
    expect(config).toMatchObject({ port: 4000, draftTtlMinutes: 5, mockAuthEnabled: false });
    expect(config.corsOrigins).toEqual(['http://a', 'http://b']);
  });

  it('échoue avec un message lisible si une valeur est invalide', () => {
    expect(() => loadConfig({ API_PORT: 'abc' })).toThrow(/Configuration invalide/);
    expect(() => loadConfig({ DRAFT_TTL_MINUTES: '0' })).toThrow(/DRAFT_TTL_MINUTES/);
  });
});
