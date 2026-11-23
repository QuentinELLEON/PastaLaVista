/**
 * Comptes de DÉMONSTRATION de l'authentification simulée (voir AuthService côté API) : aucun mot de passe.
 * Les identifiants correspondent aux clients fictifs du seed de l'API.
 */
export interface DemoAccount {
  id: string;
  firstName: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { id: 'cust-jeremy', firstName: 'Jérémy' },
  { id: 'cust-camille', firstName: 'Camille' },
];
