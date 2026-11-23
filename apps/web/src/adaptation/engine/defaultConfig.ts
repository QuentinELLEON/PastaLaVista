import type { Locale, UiConfig } from '@pastalavista/shared';
import { THRESHOLDS } from '../rules/thresholds.config';

/**
 * IHM STANDARD : satisfaisante pour tous les clients, utilisable sans aucune adaptation.
 * Le moteur ne fait que superposer des correctifs à cette base.
 */
export function standardUiConfig(language: Locale = 'fr'): UiConfig {
  return {
    profile: 'standard',
    layout: 'kiosk',
    language,
    content: {
      showUsualFirst: false,
      showNutrition: false,
      showDescriptions: false,
      conceptIntro: false,
      upsell: 'generic',
      showRetrievedBanner: false,
      restartOffer: false,
      showWherePayGuide: false,
    },
    presentation: { density: 'standard', optionStyle: 'tiles', highContrast: false },
    dialogue: {
      journey: 'free',
      defaultPayment: 'choice',
      helpPrompt: false,
      chatbotOffer: false,
      callStaffOffer: false,
      paymentOnDevice: true,
      issueOrderToken: false,
      codeEntryFallback: false,
      confirmEachStep: false,
      inactivityTimeoutMs: THRESHOLDS.inactivity.standardMs,
    },
  };
}

export const STANDARD_UI_CONFIG: UiConfig = standardUiConfig();
