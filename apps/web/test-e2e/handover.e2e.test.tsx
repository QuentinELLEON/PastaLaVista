import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createContainer } from '../../api/src/composition-root';
import { buildApp } from '../../api/src/http/app';
import { App } from '../src/App';
import { setFetcher } from '../src/services/apiClient';

/**
 * Parcours de bout en bout, SANS réseau ni navigateur : l'application React complète est rendue
 * et ses appels HTTP sont servis par la vraie API (Fastify, services, dépôts en mémoire) via inject().
 * Smartphone : Jérémy se connecte, commande son habituelle, obtient son QR code et son code.
 * Borne : il saisit le code, retrouve sa commande, paie ; la cuisine reçoit le ticket.
 */
describe('parcours complet smartphone -> borne (React + API réelle)', () => {
  let api: FastifyInstance;

  beforeEach(async () => {
    const container = createContainer({
      policy: { ttlMinutes: 30, loginSessionTtlSeconds: 120, mockAuthEnabled: true },
    });
    api = await buildApp(container, { corsOrigins: [], logLevel: 'silent' });
    setFetcher(async (input, init) => {
      const url = new URL(String(input));
      const response = await api.inject({
        method: (init?.method ?? 'GET') as 'GET' | 'POST' | 'PUT',
        url: `${url.pathname}${url.search}`,
        headers: (init?.headers ?? {}) as Record<string, string>,
        payload: typeof init?.body === 'string' ? init.body : undefined,
      });
      return new Response(response.body, {
        status: response.statusCode,
        headers: { 'content-type': String(response.headers['content-type'] ?? 'application/json') },
      });
    });
  });

  afterEach(async () => {
    cleanup();
    await api.close();
  });

  function openApp(path: string) {
    window.history.pushState({}, '', path);
    return render(
      <BrowserRouter>
        <App />
      </BrowserRouter>,
    );
  }

  it('Jérémy prépare sur son smartphone puis finit à la borne avec son code', async () => {
    // --- Smartphone ---
    const phone = openApp('/m');
    fireEvent.click(await screen.findByRole('button', { name: 'Se connecter comme Jérémy' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Commander en 1 touche' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Obtenir mon QR code' }));
    const codeNode = await screen.findByLabelText(/Code de commande PL-[0-9]{4}/);
    const code = /PL-[0-9]{4}/.exec(codeNode.getAttribute('aria-label') ?? '')?.[0];
    expect(code).toBeDefined();
    // Aucun paiement n'est proposé sur le smartphone
    expect(screen.queryByRole('button', { name: /^Payer$/ })).toBeNull();
    phone.unmount();

    // Rien en cuisine avant le paiement
    const before = await api.inject({ method: 'GET', url: '/api/v1/kitchen/tickets' });
    expect(before.json().tickets).toHaveLength(0);

    // --- Borne : saisie du code (téléphone déchargé) ---
    openApp('/kiosk/retrieve');
    fireEvent.change(await screen.findByLabelText('Code de commande'), { target: { value: code } });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(await screen.findByText(`Commande ${code} retrouvée`)).not.toBeNull();
    expect(screen.getByText('Jérémy M.')).not.toBeNull();
    expect(screen.getByText('Carte •••• 4242')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Payer' }));
    expect(await screen.findByText(/^A0[0-9]{2}$/)).not.toBeNull();

    await waitFor(async () => {
      const after = await api.inject({ method: 'GET', url: '/api/v1/kitchen/tickets' });
      expect(after.json().tickets).toHaveLength(1);
    });
  });

  it('un code expiré ou inconnu affiche un message explicite et propose de recommencer', async () => {
    openApp('/kiosk/retrieve');
    fireEvent.change(await screen.findByLabelText('Code de commande'), {
      target: { value: 'PL-0000' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(await screen.findByText('Code introuvable. Vérifiez et réessayez.')).not.toBeNull();
  });

  it('parcours standard à la borne sans rien avoir préparé : composer, payer, numéro de commande', async () => {
    openApp('/kiosk');
    fireEvent.click(await screen.findByRole('button', { name: 'Sur place' }));
    fireEvent.click(await screen.findByRole('button', { name: /Composer mon assiette/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Penne/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Étape suivante' }));
    fireEvent.click(await screen.findByRole('button', { name: /Tomate basilic/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Étape suivante' }));
    fireEvent.click(await screen.findByRole('button', { name: /Poulet grillé/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Étape suivante' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter à ma commande' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Payer' }));
    // Récapitulatif : 11,00 € (Penne + tomate basilic + poulet grillé)
    expect((await screen.findAllByText(/11,00/)).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Payer' }));
    expect(await screen.findByText(/^A0[0-9]{2}$/)).not.toBeNull();
  });
});
