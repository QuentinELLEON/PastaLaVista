import type { Locale } from '@pastalavista/shared';

// Réponses du chatbot à règles. Les textes russes sont à faire relire par un locuteur natif.

export interface ChatTexts {
  greeting: string;
  recommend: string;
  menu: string;
  callStaff: string;
  fallback: string;
  budgetTooLow: string;
}

export const CHAT_TEXTS: Record<Locale, ChatTexts> = {
  fr: {
    greeting:
      'Bonjour ! Dites-moi ce dont vous avez envie (sucres lents, protéines, budget) et je vous propose un plat.',
    recommend: 'Voici ce que je vous propose :',
    menu: 'Voici nos plats populaires. Vous pouvez aussi composer votre assiette.',
    callStaff: "D'accord, j'appelle un employé. Il arrive dans un instant.",
    fallback:
      'Je ne peux vous aider que sur notre menu. Essayez par exemple : « beaucoup de sucres lents et de protéines » ou « moins de 12 € ».',
    budgetTooLow: "Je n'ai rien dans ce budget. Voici notre option la moins chère :",
  },
  en: {
    greeting:
      'Hello! Tell me what you need (slow carbs, protein, budget) and I will suggest a dish.',
    recommend: 'Here is what I suggest:',
    menu: 'Here are our popular dishes. You can also build your own plate.',
    callStaff: 'Sure, I am calling a staff member. They will be with you shortly.',
    fallback:
      'I can only help with our menu. Try for example: "lots of slow carbs and protein" or "under 12 €".',
    budgetTooLow: 'I have nothing within that budget. Here is our cheapest option:',
  },
  ru: {
    greeting:
      'Здравствуйте! Расскажите, чего вам хочется (медленные углеводы, белок, бюджет), и я подберу блюдо.',
    recommend: 'Вот что я предлагаю:',
    menu: 'Вот наши популярные блюда. Вы также можете составить своё блюдо.',
    callStaff: 'Хорошо, зову сотрудника. Он подойдёт через минуту.',
    fallback:
      'Я могу помочь только с нашим меню. Например: «много медленных углеводов и белка» или «до 12 €».',
    budgetTooLow: 'В этот бюджет ничего не входит. Вот самый недорогой вариант:',
  },
};

/** Mots-clés par besoin et par langue (minuscules, correspondance par inclusion). */
export const KEYWORDS = {
  callStaff: [
    'employé',
    'employe',
    'personnel',
    'humain',
    'staff',
    'human',
    'person',
    'сотрудник',
    'человек',
    'персонал',
  ],
  menu: ['menu', 'carte', 'меню'],
  greeting: ['bonjour', 'salut', 'bonsoir', 'hello', 'hi ', 'hey', 'привет', 'здравствуй'],
  slowCarbs: [
    'sucre lent',
    'sucres lents',
    'glucide',
    'complet',
    'complèt',
    'slow carb',
    'complex carb',
    'whole',
    'медленн',
    'сложн',
    'цельнозерн',
  ],
  protein: ['protéine', 'proteine', 'protein', 'muscle', 'белк', 'белок', 'протеин'],
  budget: [
    'budget',
    'pas cher',
    'moins de',
    'économique',
    'under',
    'below',
    'less than',
    'cheap',
    'до ',
    'дешев',
    'бюджет',
  ],
} as const;
