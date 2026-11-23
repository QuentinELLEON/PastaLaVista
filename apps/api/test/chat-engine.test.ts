import { beforeEach, describe, expect, it } from 'vitest';
import type { Locale } from '@pastalavista/shared';
import { buildTestContext, type TestContext } from './support';

describe('RuleBasedChatEngine', () => {
  let ctx: TestContext;
  beforeEach(() => {
    ctx = buildTestContext();
  });
  const ask = (message: string, locale: Locale) => ctx.container.chat.reply({ message, locale });

  it.each<[Locale, string]>([
    ['fr', 'Je veux beaucoup de sucres lents et de protéines'],
    ['en', 'lots of slow carbs and protein please'],
    ['ru', 'Много медленных углеводов и белка'],
  ])(
    'besoin « sucres lents + protéines » en %s : propose la meilleure assiette du catalogue',
    async (locale, message) => {
      const reply = await ask(message, locale);
      expect(reply.intent).toBe('recommend');
      expect(reply.locale).toBe(locale);
      const best = reply.suggestions[0];
      // Pâtes complètes XL, sauce bolognaise, poulet × 2 : 17,00 €, 1 300 kcal, 104 g de protéines
      expect(best?.totals).toEqual({ totalCents: 1700, kcal: 1300, proteinG: 104 });
      expect(best?.lines[0]).toMatchObject({ productId: 'pasta-complete', extraXl: true });
    },
  );

  it('les libellés suivent la langue de la conversation', async () => {
    const ru = await ask('Много белка', 'ru');
    expect(ru.suggestions[0]?.title).toContain('Курица на гриле');
    const en = await ask('lots of protein', 'en');
    expect(en.suggestions[0]?.title).toContain('Grilled chicken');
  });

  it('respecte un budget : rien au-dessus du plafond', async () => {
    const reply = await ask('beaucoup de protéines, moins de 12 €', 'fr');
    expect(reply.suggestions.length).toBeGreaterThan(0);
    for (const suggestion of reply.suggestions) {
      expect(suggestion.totals.totalCents).toBeLessThanOrEqual(1200);
    }
  });

  it('un budget trop bas renvoie l’option la moins chère avec un message dédié', async () => {
    const reply = await ask('moins de 3 €', 'fr');
    expect(reply.intent).toBe('recommend');
    expect(reply.text).toContain('moins chère');
    expect(reply.suggestions).toHaveLength(1);
  });

  it('ne propose que des produits existants du catalogue', async () => {
    const ids = new Set((await ctx.container.catalog.listProducts('fr')).map((p) => p.id));
    const reply = await ask('sucres lents et protéines', 'fr');
    for (const suggestion of reply.suggestions) {
      for (const line of suggestion.lines) {
        expect(ids.has(line.productId)).toBe(true);
        line.options.forEach((option) => expect(ids.has(option.productId)).toBe(true));
      }
    }
  });

  it.each<[Locale, string]>([
    ['fr', 'Je voudrais parler à un employé'],
    ['en', 'can I talk to a human?'],
    ['ru', 'Позовите сотрудника'],
  ])('intention « appeler un employé » en %s', async (locale, message) => {
    const reply = await ask(message, locale);
    expect(reply.intent).toBe('call-staff');
    expect(reply.callStaff).toBe(true);
    expect(reply.suggestions).toHaveLength(0);
  });

  it('affiche le menu populaire, salue, et reste dans son rôle sinon', async () => {
    const menu = await ask('montre-moi le menu', 'fr');
    expect(menu.intent).toBe('show-menu');
    expect(menu.suggestions).toHaveLength(3);
    expect((await ask('Bonjour', 'fr')).intent).toBe('greeting');
    expect((await ask('Quelle est la capitale de la France ?', 'fr')).intent).toBe('fallback');
  });
});
