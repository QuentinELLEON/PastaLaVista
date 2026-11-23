import { z } from 'zod';
import { localeSchema } from './schemas';
import type { Locale } from './locale';

export const PROFILES = ['standard', 'regular', 'guided'] as const;
export type Profile = (typeof PROFILES)[number];
export const DEVICES = ['kiosk', 'smartphone'] as const;
export type Device = (typeof DEVICES)[number];
export const ADAPTATION_LEVELS = ['content', 'presentation', 'dialogue'] as const;
export type AdaptationLevel = (typeof ADAPTATION_LEVELS)[number];
/** Axe d'origine d'une règle : détermine ce qu'elle a le droit d'écrire (voir RULE_AXIS_WRITABLE_KEYS). */
export const RULE_AXES = ['accessibility', 'language', 'device', 'user'] as const;
export type RuleAxis = (typeof RULE_AXES)[number];

export const GUIDANCE_MODES = ['standard', 'guided'] as const;
export type GuidanceMode = (typeof GUIDANCE_MODES)[number];
export const HELP_ANSWERS = ['none', 'accepted', 'declined'] as const;
export type HelpAnswer = (typeof HELP_ANSWERS)[number];
export const DRAFT_PROBLEMS = ['none', 'expired', 'already-paid'] as const;
export type DraftProblem = (typeof DRAFT_PROBLEMS)[number];

/** Configuration d'IHM produite par le moteur ; les composants la lisent, jamais de styles bruts. */
export interface UiConfig {
  profile: Profile;
  layout: Device;
  language: Locale;
  content: {
    showUsualFirst: boolean;
    showNutrition: boolean;
    showDescriptions: boolean;
    conceptIntro: boolean;
    upsell: 'generic' | 'single' | 'need-based';
    showRetrievedBanner: boolean;
    restartOffer: boolean;
    showWherePayGuide: boolean;
  };
  presentation: {
    density: 'standard' | 'comfortable';
    optionStyle: 'tiles' | 'rows';
    highContrast: boolean;
  };
  dialogue: {
    journey: 'free' | 'express' | 'guided';
    defaultPayment: 'choice' | 'saved-card';
    helpPrompt: boolean;
    chatbotOffer: boolean;
    callStaffOffer: boolean;
    paymentOnDevice: boolean;
    issueOrderToken: boolean;
    codeEntryFallback: boolean;
    confirmEachStep: boolean;
    inactivityTimeoutMs: number;
  };
}

/** Faits évalués par les règles (aplatissement du Context). */
export const FACT_NAMES = [
  'device',
  'language',
  'customerOrderCount',
  'guidanceScore',
  'guidanceMode',
  'helpAnswer',
  'helpRequested',
  'highContrast',
  'handoverReceived',
  'draftProblem',
] as const;
export type FactName = (typeof FACT_NAMES)[number];

/** Une valeur est un littéral ou une référence vers un seuil de configuration (pas de nombre magique dans les règles). */
export type ThresholdRef = { threshold: string };
export type RuleValue = number | string | boolean | ThresholdRef;
export const COMPARATORS = ['eq', 'neq', 'gte', 'lt'] as const;
export type Comparator = (typeof COMPARATORS)[number];

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { fact: FactName; op: Comparator; value: RuleValue };

const thresholdRefSchema = z.object({ threshold: z.string().min(1) });
const ruleValueSchema = z.union([z.number(), z.string(), z.boolean(), thresholdRefSchema]);

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(conditionSchema).min(1) }),
    z.object({ any: z.array(conditionSchema).min(1) }),
    z.object({ not: conditionSchema }),
    z.object({ fact: z.enum(FACT_NAMES), op: z.enum(COMPARATORS), value: ruleValueSchema }),
  ]),
);

const contentShape = {
  showUsualFirst: z.boolean(),
  showNutrition: z.boolean(),
  showDescriptions: z.boolean(),
  conceptIntro: z.boolean(),
  upsell: z.enum(['generic', 'single', 'need-based']),
  showRetrievedBanner: z.boolean(),
  restartOffer: z.boolean(),
  showWherePayGuide: z.boolean(),
};
const presentationShape = {
  density: z.enum(['standard', 'comfortable']),
  optionStyle: z.enum(['tiles', 'rows']),
  highContrast: z.boolean(),
};
const dialogueShape = {
  journey: z.enum(['free', 'express', 'guided']),
  defaultPayment: z.enum(['choice', 'saved-card']),
  helpPrompt: z.boolean(),
  chatbotOffer: z.boolean(),
  callStaffOffer: z.boolean(),
  paymentOnDevice: z.boolean(),
  issueOrderToken: z.boolean(),
  codeEntryFallback: z.boolean(),
  confirmEachStep: z.boolean(),
  inactivityTimeoutMs: z.union([z.number().int().positive(), thresholdRefSchema]),
};

/** Correctif partiel d'une UiConfig : seule la clé écrite par la règle y figure. */
export const uiConfigPatchSchema = z.object({
  profile: z.enum(PROFILES).optional(),
  layout: z.enum(DEVICES).optional(),
  language: localeSchema.optional(),
  content: z.object(contentShape).partial().optional(),
  presentation: z.object(presentationShape).partial().optional(),
  dialogue: z.object(dialogueShape).partial().optional(),
});
export type UiConfigPatch = z.infer<typeof uiConfigPatchSchema>;

export const ruleSchema = z.object({
  id: z.string().min(1),
  summary: z.string().min(1),
  levels: z.array(z.enum(ADAPTATION_LEVELS)).min(1),
  axis: z.enum(RULE_AXES),
  priority: z.number().int(),
  when: conditionSchema,
  patch: uiConfigPatchSchema,
});
export type Rule = z.infer<typeof ruleSchema>;

/** Clés racines de UiConfig qu'une règle de chaque axe peut écrire : le dispositif décide de la disposition, l'utilisateur du contenu et du dialogue. */
export const RULE_AXIS_WRITABLE_KEYS: Record<RuleAxis, readonly (keyof UiConfig)[]> = {
  accessibility: ['presentation'],
  language: ['language', 'content'],
  device: ['layout', 'dialogue', 'content', 'presentation'],
  user: ['profile', 'content', 'presentation', 'dialogue'],
};
