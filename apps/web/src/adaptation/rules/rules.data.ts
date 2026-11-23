import type { Rule } from '@pastalavista/shared';

/**
 * Règles d'adaptation EXPRIMÉES COMME DES DONNÉES (RU = axe Utilisateurs, RD = axe Dispositifs).
 * Chaque règle correspond à une ligne du catalogue de docs/reponse-sujet-adaptation.md (section 6).
 * Les seuils sont des références `{ threshold: 'chemin' }` vers thresholds.config.ts.
 *
 * Priorités : accessibilité 1000 > langue 900 > dispositif 500 > utilisateur explicite (compte) 300
 * > utilisateur inféré (comportement) 200. Une règle de priorité supérieure l'emporte en cas de conflit.
 */
export const RULES: readonly Rule[] = [
  {
    id: 'RA1',
    summary: 'Contraste élevé demandé : accessibilité prioritaire sur toute adaptation',
    levels: ['presentation'],
    axis: 'accessibility',
    priority: 1000,
    when: { fact: 'highContrast', op: 'eq', value: true },
    patch: { presentation: { highContrast: true } },
  },
  {
    id: 'RU1',
    summary: 'Compte connu avec assez de commandes : profil habitué, habituelle en premier',
    levels: ['content'],
    axis: 'user',
    priority: 300,
    when: { fact: 'customerOrderCount', op: 'gte', value: { threshold: 'regularMinOrders' } },
    patch: { profile: 'regular', content: { showUsualFirst: true } },
  },
  {
    id: 'RU2',
    summary:
      'Profil habitué : parcours express, une seule suggestion, carte enregistrée par défaut',
    levels: ['dialogue', 'content'],
    axis: 'user',
    priority: 300,
    when: { fact: 'customerOrderCount', op: 'gte', value: { threshold: 'regularMinOrders' } },
    patch: {
      content: { upsell: 'single' },
      dialogue: { journey: 'express', defaultPayment: 'saved-card' },
    },
  },
  {
    id: 'RU3',
    summary: 'Langue différente du français : interface traduite, présentation du concept',
    levels: ['content'],
    axis: 'language',
    priority: 900,
    when: { fact: 'language', op: 'neq', value: 'fr' },
    patch: { content: { conceptIntro: true } },
  },
  {
    id: 'RU4',
    summary: 'Score de guidage atteint : proposer l’aide (jamais imposée)',
    levels: ['dialogue'],
    axis: 'user',
    priority: 200,
    when: {
      all: [
        { fact: 'guidanceMode', op: 'eq', value: 'guided' },
        { fact: 'helpAnswer', op: 'eq', value: 'none' },
      ],
    },
    patch: { dialogue: { helpPrompt: true } },
  },
  {
    id: 'RU5',
    summary: 'Aide acceptée : descriptions, kcal, protéines, grands boutons, un sujet par écran',
    levels: ['content', 'presentation', 'dialogue'],
    axis: 'user',
    priority: 200,
    when: {
      all: [
        { fact: 'guidanceMode', op: 'eq', value: 'guided' },
        { fact: 'helpAnswer', op: 'eq', value: 'accepted' },
      ],
    },
    patch: {
      profile: 'guided',
      content: { showNutrition: true, showDescriptions: true, showWherePayGuide: true },
      presentation: { density: 'comfortable', optionStyle: 'rows' },
      dialogue: { journey: 'guided', confirmEachStep: true },
    },
  },
  {
    id: 'RU6',
    summary: 'Mode guidé sur la borne : délai d’inactivité allongé',
    levels: ['dialogue'],
    axis: 'user',
    priority: 200,
    when: {
      all: [
        { fact: 'guidanceMode', op: 'eq', value: 'guided' },
        { fact: 'helpAnswer', op: 'eq', value: 'accepted' },
        { fact: 'device', op: 'eq', value: 'kiosk' },
      ],
    },
    patch: { dialogue: { inactivityTimeoutMs: { threshold: 'inactivity.guidedMs' } } },
  },
  {
    id: 'RU7',
    summary: 'Mode guidé : vente additionnelle liée au besoin, sans pression',
    levels: ['content'],
    axis: 'user',
    priority: 200,
    when: {
      all: [
        { fact: 'guidanceMode', op: 'eq', value: 'guided' },
        { fact: 'helpAnswer', op: 'eq', value: 'accepted' },
      ],
    },
    patch: { content: { upsell: 'need-based' } },
  },
  {
    id: 'RU8',
    summary:
      'Aide refusée : retour au standard à la fin de l’étape (la sortie par score < seuil est gérée par l’hystérésis du contexte)',
    levels: ['dialogue'],
    axis: 'user',
    priority: 250,
    when: { fact: 'helpAnswer', op: 'eq', value: 'declined' },
    patch: { profile: 'standard', dialogue: { helpPrompt: false } },
  },
  {
    id: 'RD1',
    summary: 'Appareil tactile étroit hors mode borne : disposition smartphone',
    levels: ['presentation'],
    axis: 'device',
    priority: 500,
    when: { fact: 'device', op: 'eq', value: 'smartphone' },
    patch: { layout: 'smartphone' },
  },
  {
    id: 'RD2',
    summary: 'Smartphone : pas de paiement, génération du jeton, du QR code et du code',
    levels: ['dialogue'],
    axis: 'device',
    priority: 500,
    when: { fact: 'device', op: 'eq', value: 'smartphone' },
    patch: { dialogue: { paymentOnDevice: false, issueOrderToken: true } },
  },
  {
    id: 'RD3',
    summary:
      'Borne qui reçoit un jeton valide : écran « Commande retrouvée », panier et langue repris',
    levels: ['content', 'dialogue'],
    axis: 'device',
    priority: 500,
    when: {
      all: [
        { fact: 'device', op: 'eq', value: 'kiosk' },
        { fact: 'handoverReceived', op: 'eq', value: true },
      ],
    },
    patch: { content: { showRetrievedBanner: true } },
  },
  {
    id: 'RD4',
    summary: 'Borne : saisie du code de commande possible si le téléphone est indisponible',
    levels: ['dialogue'],
    axis: 'device',
    priority: 500,
    when: { fact: 'device', op: 'eq', value: 'kiosk' },
    patch: { dialogue: { codeEntryFallback: true } },
  },
  {
    id: 'RD5',
    summary: 'Brouillon expiré ou déjà payé : message explicite et proposition de recommencer',
    levels: ['content'],
    axis: 'device',
    priority: 500,
    when: {
      any: [
        { fact: 'draftProblem', op: 'eq', value: 'expired' },
        { fact: 'draftProblem', op: 'eq', value: 'already-paid' },
      ],
    },
    patch: { content: { restartOffer: true } },
  },
  {
    id: 'RD6-chatbot',
    summary: 'Smartphone, aide demandée ou profil guidé : proposer le chatbot',
    levels: ['dialogue'],
    axis: 'device',
    priority: 500,
    when: {
      all: [
        { fact: 'device', op: 'eq', value: 'smartphone' },
        {
          any: [
            { fact: 'helpRequested', op: 'eq', value: true },
            { fact: 'guidanceMode', op: 'eq', value: 'guided' },
          ],
        },
      ],
    },
    patch: { dialogue: { chatbotOffer: true } },
  },
  {
    id: 'RD6-staff',
    summary: 'Borne, aide demandée ou profil guidé : proposer d’appeler un employé',
    levels: ['dialogue'],
    axis: 'device',
    priority: 500,
    when: {
      all: [
        { fact: 'device', op: 'eq', value: 'kiosk' },
        {
          any: [
            { fact: 'helpRequested', op: 'eq', value: true },
            { fact: 'guidanceMode', op: 'eq', value: 'guided' },
          ],
        },
      ],
    },
    patch: { dialogue: { callStaffOffer: true } },
  },
];
