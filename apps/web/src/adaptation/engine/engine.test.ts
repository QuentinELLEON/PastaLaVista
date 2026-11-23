import { describe, expect, it } from 'vitest';
import { alexeiContext, jeremyContext, makeContext } from '../../../test/factories';
import { RULES } from '../rules/rules.data';
import { THRESHOLDS } from '../rules/thresholds.config';
import { StaticRulesEngine } from './engine';
import { STANDARD_UI_CONFIG } from './defaultConfig';

const engine = new StaticRulesEngine();
const fired = (context = makeContext()) => engine.explain(context).firedRuleIds;

describe('StaticRulesEngine : règles utilisateur (RU)', () => {
  it('un client anonyme sur la borne obtient l’IHM standard (+ règles de dispositif de la borne)', () => {
    const { config } = engine.explain(makeContext());
    expect(config.profile).toBe('standard');
    expect(config.content).toEqual(STANDARD_UI_CONFIG.content);
    expect(config.presentation).toEqual(STANDARD_UI_CONFIG.presentation);
    expect(config.dialogue.journey).toBe('free');
  });

  it('RU1 + RU2 : un compte avec 3 commandes devient « habitué » (seuil en configuration)', () => {
    const below = engine.decide(
      jeremyContext({ customerOrderCount: THRESHOLDS.regularMinOrders - 1 }),
    );
    expect(below.profile).toBe('standard');
    const atThreshold = engine.decide(
      jeremyContext({ customerOrderCount: THRESHOLDS.regularMinOrders }),
    );
    expect(atThreshold).toMatchObject({
      profile: 'regular',
      content: { showUsualFirst: true, upsell: 'single' },
      dialogue: { journey: 'express', defaultPayment: 'saved-card' },
    });
  });

  it('RU3 : langue non française, concept présenté (la langue est portée par la config)', () => {
    const config = engine.decide(makeContext({ language: 'ru' }));
    expect(config.language).toBe('ru');
    expect(config.content.conceptIntro).toBe(true);
    expect(engine.decide(makeContext({ language: 'fr' })).content.conceptIntro).toBe(false);
  });

  it('RU4 : l’aide est PROPOSÉE quand le score est atteint, sans activer le mode guidé', () => {
    const config = engine.decide(
      makeContext({
        language: 'ru',
        guidanceScore: 0.6,
        guidanceMode: 'guided',
        helpAnswer: 'none',
      }),
    );
    expect(config.dialogue.helpPrompt).toBe(true);
    expect(config.profile).toBe('standard');
    expect(config.content.showNutrition).toBe(false);
    expect(config.presentation.density).toBe('standard');
  });

  it('RU5 + RU6 + RU7 : aide acceptée sur la borne', () => {
    const config = engine.decide(alexeiContext());
    expect(config).toMatchObject({
      profile: 'guided',
      content: {
        showNutrition: true,
        showDescriptions: true,
        showWherePayGuide: true,
        upsell: 'need-based',
      },
      presentation: { density: 'comfortable', optionStyle: 'rows' },
      dialogue: {
        journey: 'guided',
        confirmEachStep: true,
        helpPrompt: false,
        inactivityTimeoutMs: 90_000,
      },
    });
  });

  it('RU6 : le délai d’inactivité allongé ne s’applique QU’À LA BORNE', () => {
    const phone = engine.decide(alexeiContext({ device: 'smartphone' }));
    expect(phone.dialogue.inactivityTimeoutMs).toBe(THRESHOLDS.inactivity.standardMs);
    expect(phone.profile).toBe('guided');
  });

  it('RU8 : aide refusée, retour au standard sans réoffre ni mode guidé', () => {
    const config = engine.decide(alexeiContext({ helpAnswer: 'declined' }));
    expect(config.profile).toBe('standard');
    expect(config.dialogue.helpPrompt).toBe(false);
    expect(config.content.showNutrition).toBe(false);
    expect(config.presentation.optionStyle).toBe('tiles');
  });
});

describe('StaticRulesEngine : règles dispositif (RD)', () => {
  it('RD1 + RD2 : smartphone = disposition smartphone, pas de paiement, jeton à émettre', () => {
    const config = engine.decide(makeContext({ device: 'smartphone' }));
    expect(config.layout).toBe('smartphone');
    expect(config.dialogue).toMatchObject({ paymentOnDevice: false, issueOrderToken: true });
  });

  it('la borne garde la disposition borne, le paiement et la saisie de code (RD4)', () => {
    const config = engine.decide(makeContext({ device: 'kiosk' }));
    expect(config.layout).toBe('kiosk');
    expect(config.dialogue).toMatchObject({
      paymentOnDevice: true,
      issueOrderToken: false,
      codeEntryFallback: true,
    });
  });

  it('RD3 : la borne qui reçoit un jeton affiche « Commande retrouvée »', () => {
    expect(engine.decide(makeContext({ handoverReceived: true })).content.showRetrievedBanner).toBe(
      true,
    );
    expect(engine.decide(makeContext()).content.showRetrievedBanner).toBe(false);
    // Le smartphone n'affiche jamais ce bandeau
    expect(
      engine.decide(makeContext({ device: 'smartphone', handoverReceived: true })).content
        .showRetrievedBanner,
    ).toBe(false);
  });

  it.each(['expired', 'already-paid'] as const)(
    'RD5 : brouillon %s, proposition de recommencer',
    (problem) => {
      expect(engine.decide(makeContext({ draftProblem: problem })).content.restartOffer).toBe(true);
      expect(engine.decide(makeContext()).content.restartOffer).toBe(false);
    },
  );

  it('RD6 : chatbot sur smartphone, appel d’un employé sur la borne', () => {
    const phone = engine.decide(makeContext({ device: 'smartphone', helpRequested: true }));
    expect(phone.dialogue).toMatchObject({ chatbotOffer: true, callStaffOffer: false });
    const kiosk = engine.decide(makeContext({ device: 'kiosk', helpRequested: true }));
    expect(kiosk.dialogue).toMatchObject({ chatbotOffer: false, callStaffOffer: true });
    expect(engine.decide(makeContext({ device: 'smartphone' })).dialogue.chatbotOffer).toBe(false);
  });
});

describe('StaticRulesEngine : compositions utilisateur × dispositif (context.md §9)', () => {
  it('Jérémy × smartphone : disposition téléphone + contenu habitué + pas de paiement', () => {
    const config = engine.decide(jeremyContext({ device: 'smartphone' }));
    expect(config).toMatchObject({
      layout: 'smartphone',
      profile: 'regular',
      content: { showUsualFirst: true },
      dialogue: { paymentOnDevice: false, issueOrderToken: true, journey: 'express' },
    });
  });

  it('Jérémy × borne : disposition borne + habitué + paiement express', () => {
    const config = engine.decide(jeremyContext({ device: 'kiosk', handoverReceived: true }));
    expect(config).toMatchObject({
      layout: 'kiosk',
      profile: 'regular',
      content: { showRetrievedBanner: true },
      dialogue: { paymentOnDevice: true, defaultPayment: 'saved-card' },
    });
  });

  it('Alexovitch × smartphone : disposition téléphone + guidé + chatbot', () => {
    const config = engine.decide(alexeiContext({ device: 'smartphone' }));
    expect(config).toMatchObject({
      layout: 'smartphone',
      profile: 'guided',
      content: { showNutrition: true, conceptIntro: true },
      dialogue: { chatbotOffer: true, callStaffOffer: false, paymentOnDevice: false },
    });
  });

  it('Alexovitch × borne : disposition borne + guidé + appel d’un employé + « où payer »', () => {
    const config = engine.decide(alexeiContext({ device: 'kiosk' }));
    expect(config).toMatchObject({
      layout: 'kiosk',
      profile: 'guided',
      content: { showWherePayGuide: true },
      dialogue: { callStaffOffer: true, chatbotOffer: false, paymentOnDevice: true },
    });
  });
});

describe('StaticRulesEngine : priorités et conflits', () => {
  it('l’accessibilité l’emporte sur toute adaptation (contraste conservé en mode guidé)', () => {
    const config = engine.decide(alexeiContext({ highContrast: true }));
    expect(config.presentation.highContrast).toBe(true);
    expect(config.presentation.density).toBe('comfortable');
  });

  it('un compte reconnu (explicite, priorité 300) l’emporte sur le guidage inféré (200)', () => {
    const config = engine.decide(
      jeremyContext({ language: 'fr', guidanceMode: 'guided', helpAnswer: 'accepted' }),
    );
    expect(config.profile).toBe('regular');
    expect(config.dialogue.journey).toBe('express');
    expect(config.content.upsell).toBe('single');
    // Les ajouts non conflictuels du mode guidé restent appliqués
    expect(config.content.showNutrition).toBe(true);
  });

  it('la langue (900) l’emporte sur l’utilisateur : le concept reste présenté pour un habitué russophone', () => {
    const config = engine.decide(jeremyContext({ language: 'ru' }));
    expect(config.content.conceptIntro).toBe(true);
    expect(config.profile).toBe('regular');
  });

  it('les règles sont appliquées de la moins à la plus prioritaire', () => {
    const ids = fired(alexeiContext({ highContrast: true, device: 'smartphone' }));
    const priorities = ids.map((id) => RULES.find((rule) => rule.id === id)?.priority ?? 0);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
    expect(ids.at(-1)).toBe('RA1');
  });

  it('deux règles de même clé : la plus prioritaire gagne (test d’un jeu de règles dédié)', () => {
    const custom = new StaticRulesEngine(
      [
        {
          ...RULES[1]!,
          id: 'LOW',
          priority: 1,
          patch: { content: { upsell: 'single' } },
          when: { fact: 'device', op: 'eq', value: 'kiosk' },
        },
        {
          ...RULES[1]!,
          id: 'HIGH',
          priority: 2,
          patch: { content: { upsell: 'need-based' } },
          when: { fact: 'device', op: 'eq', value: 'kiosk' },
        },
      ],
      THRESHOLDS,
    );
    expect(custom.decide(makeContext()).content.upsell).toBe('need-based');
  });
});
