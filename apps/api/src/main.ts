import { loadConfig } from './config/config';
import { createContainer } from './composition-root';
import { buildApp } from './http/app';

const config = loadConfig();
const container = createContainer({
  policy: {
    ttlMinutes: config.draftTtlMinutes,
    loginSessionTtlSeconds: config.loginSessionTtlSeconds,
    mockAuthEnabled: config.mockAuthEnabled,
  },
});
const app = await buildApp(container, {
  corsOrigins: config.corsOrigins,
  logLevel: config.logLevel,
});

try {
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  app.log.error(error, 'démarrage impossible');
  process.exit(1);
}
