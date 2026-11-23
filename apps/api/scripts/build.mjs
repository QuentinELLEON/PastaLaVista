// Empaquette l'API en un seul fichier : le package partagé est exporté en TypeScript source,
// Node ne peut donc pas le charger tel quel en production.
import { build } from 'esbuild';

await build({
  entryPoints: ['src/main.ts'],
  outfile: 'dist/main.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  sourcemap: true,
  // Les dépendances installées restent externes ; seul le code du dépôt est empaqueté
  external: ['fastify', '@fastify/cors'],
});
