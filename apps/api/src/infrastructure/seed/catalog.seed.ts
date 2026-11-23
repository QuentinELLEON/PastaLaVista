import type { ProductKind, TranslatedText } from '@pastalavista/shared';
import type { Category, Product } from '../../domain/entities';

// Données FICTIVES (menu, prix, kcal, protéines). Les textes russes sont à faire relire par un locuteur natif.

type Texts = [fr: [string, string], en: [string, string], ru: [string, string]];

function texts([fr, en, ru]: Texts): TranslatedText[] {
  return [
    { locale: 'fr', name: fr[0], description: fr[1] },
    { locale: 'en', name: en[0], description: en[1] },
    { locale: 'ru', name: ru[0], description: ru[1] },
  ];
}

export const CATEGORY_SEED: Category[] = [
  {
    id: 'cat-composer',
    sortOrder: 0,
    translations: texts([
      ['Composer', ''],
      ['Build your own', ''],
      ['Составить', ''],
    ]),
  },
  {
    id: 'cat-populaires',
    sortOrder: 1,
    translations: texts([
      ['Populaires', ''],
      ['Popular', ''],
      ['Популярное', ''],
    ]),
  },
  {
    id: 'cat-boissons',
    sortOrder: 2,
    translations: texts([
      ['Boissons', ''],
      ['Drinks', ''],
      ['Напитки', ''],
    ]),
  },
  {
    id: 'cat-desserts',
    sortOrder: 3,
    translations: texts([
      ['Desserts', ''],
      ['Desserts', ''],
      ['Десерты', ''],
    ]),
  },
  {
    id: 'cat-menus',
    sortOrder: 4,
    translations: texts([
      ['Menus', ''],
      ['Menus', ''],
      ['Меню', ''],
    ]),
  },
];

interface ProductSeedInput {
  id: string;
  kind: ProductKind;
  categoryId: string;
  priceCents: number;
  kcal: number;
  proteinG: number;
  xl?: [kcal: number, proteinG: number];
  slowCarb?: boolean;
  items?: Product['compositionItems'];
  text: Texts;
}

function product(order: number, input: ProductSeedInput): Product {
  return {
    id: input.id,
    kind: input.kind,
    categoryId: input.categoryId,
    priceCents: input.priceCents,
    kcal: input.kcal,
    proteinG: input.proteinG,
    xlKcal: input.xl?.[0] ?? null,
    xlProteinG: input.xl?.[1] ?? null,
    isSlowCarb: input.slowCarb ?? false,
    sortOrder: order,
    translations: texts(input.text),
    compositionItems: input.items ?? [],
  };
}

const COMPOSER = 'cat-composer';
const seeds: ProductSeedInput[] = [
  {
    id: 'pasta-penne',
    kind: 'pasta',
    categoryId: COMPOSER,
    priceCents: 850,
    kcal: 420,
    proteinG: 14,
    xl: [630, 21],
    text: [
      ['Penne', 'Pâtes tubulaires classiques'],
      ['Penne', 'Classic tube-shaped pasta'],
      ['Пенне', 'Классическая паста-трубочки'],
    ],
  },
  {
    id: 'pasta-spaghetti',
    kind: 'pasta',
    categoryId: COMPOSER,
    priceCents: 850,
    kcal: 410,
    proteinG: 14,
    xl: [615, 21],
    text: [
      ['Spaghetti', 'Longues pâtes fines'],
      ['Spaghetti', 'Long thin pasta'],
      ['Спагетти', 'Длинная тонкая паста'],
    ],
  },
  {
    id: 'pasta-tagliatelle',
    kind: 'pasta',
    categoryId: COMPOSER,
    priceCents: 900,
    kcal: 430,
    proteinG: 15,
    xl: [645, 22],
    text: [
      ['Tagliatelle', 'Rubans de pâtes larges'],
      ['Tagliatelle', 'Wide ribbon pasta'],
      ['Тальятелле', 'Широкая лентовидная паста'],
    ],
  },
  {
    id: 'pasta-complete',
    kind: 'pasta',
    categoryId: COMPOSER,
    priceCents: 900,
    kcal: 480,
    proteinG: 19,
    xl: [720, 28],
    slowCarb: true,
    text: [
      ['Complètes', 'Pâtes complètes : sucres lents'],
      ['Whole-wheat', 'Whole-wheat pasta: slow carbs'],
      ['Цельнозерновые', 'Цельнозерновая паста: медленные углеводы'],
    ],
  },
  {
    id: 'sauce-tomate',
    kind: 'sauce',
    categoryId: COMPOSER,
    priceCents: 0,
    kcal: 80,
    proteinG: 2,
    text: [
      ['Tomate basilic', 'Sauce tomate et basilic, incluse'],
      ['Tomato basil', 'Tomato and basil sauce, included'],
      ['Томатный с базиликом', 'Томатный соус с базиликом, включён'],
    ],
  },
  {
    id: 'sauce-bolognaise',
    kind: 'sauce',
    categoryId: COMPOSER,
    priceCents: 100,
    kcal: 250,
    proteinG: 14,
    text: [
      ['Bolognaise', 'Sauce tomate et bœuf haché'],
      ['Bolognese', 'Tomato and minced beef sauce'],
      ['Болоньезе', 'Томатный соус с говяжьим фаршем'],
    ],
  },
  {
    id: 'sauce-pesto',
    kind: 'sauce',
    categoryId: COMPOSER,
    priceCents: 100,
    kcal: 190,
    proteinG: 4,
    text: [
      ['Pesto', 'Basilic, pignons et parmesan'],
      ['Pesto', 'Basil, pine nuts and parmesan'],
      ['Песто', 'Базилик, кедровые орехи и пармезан'],
    ],
  },
  {
    id: 'sauce-creme',
    kind: 'sauce',
    categoryId: COMPOSER,
    priceCents: 100,
    kcal: 210,
    proteinG: 4,
    text: [
      ['Crème champignons', 'Sauce crémeuse aux champignons'],
      ['Mushroom cream', 'Creamy mushroom sauce'],
      ['Сливочно-грибной', 'Сливочный соус с грибами'],
    ],
  },
  {
    id: 'top-poulet',
    kind: 'topping',
    categoryId: COMPOSER,
    priceCents: 250,
    kcal: 165,
    proteinG: 31,
    text: [
      ['Poulet grillé', 'Blanc de poulet grillé'],
      ['Grilled chicken', 'Grilled chicken breast'],
      ['Курица на гриле', 'Куриная грудка'],
    ],
  },
  {
    id: 'top-thon',
    kind: 'topping',
    categoryId: COMPOSER,
    priceCents: 200,
    kcal: 110,
    proteinG: 24,
    text: [
      ['Thon', 'Thon au naturel'],
      ['Tuna', 'Tuna in its own juice'],
      ['Тунец', 'В собственном соку'],
    ],
  },
  {
    id: 'top-oeuf',
    kind: 'topping',
    categoryId: COMPOSER,
    priceCents: 100,
    kcal: 78,
    proteinG: 6,
    text: [
      ['Œuf', 'Un œuf dur'],
      ['Egg', 'One hard-boiled egg'],
      ['Яйцо вкрутую', 'Одно яйцо'],
    ],
  },
  {
    id: 'top-mozzarella',
    kind: 'topping',
    categoryId: COMPOSER,
    priceCents: 150,
    kcal: 85,
    proteinG: 6,
    text: [
      ['Mozzarella', 'Boules de mozzarella'],
      ['Mozzarella', 'Mozzarella pearls'],
      ['Моцарелла', 'Шарики моцареллы'],
    ],
  },
  {
    id: 'top-legumes',
    kind: 'topping',
    categoryId: COMPOSER,
    priceCents: 150,
    kcal: 60,
    proteinG: 2,
    text: [
      ['Légumes grillés', 'Courgette, poivron, aubergine'],
      ['Grilled vegetables', 'Zucchini, pepper, aubergine'],
      ['Овощи гриль', 'Цукини, перец, баклажан'],
    ],
  },
  {
    id: 'extra-parmesan',
    kind: 'extra',
    categoryId: COMPOSER,
    priceCents: 50,
    kcal: 40,
    proteinG: 4,
    text: [
      ['Parmesan', 'Parmesan râpé'],
      ['Parmesan', 'Grated parmesan'],
      ['Пармезан', 'Тёртый пармезан'],
    ],
  },
  {
    id: 'extra-pain-ail',
    kind: 'extra',
    categoryId: COMPOSER,
    priceCents: 150,
    kcal: 150,
    proteinG: 3,
    text: [
      ['Pain à l’ail', 'Deux tranches de pain à l’ail'],
      ['Garlic bread', 'Two slices of garlic bread'],
      ['Чесночный хлеб', 'Два ломтика чесночного хлеба'],
    ],
  },
  {
    id: 'drink-eau',
    kind: 'drink',
    categoryId: 'cat-boissons',
    priceCents: 150,
    kcal: 0,
    proteinG: 0,
    text: [
      ['Eau', 'Eau plate 50 cl'],
      ['Water', 'Still water 50 cl'],
      ['Вода', 'Негазированная вода 0,5 л'],
    ],
  },
  {
    id: 'drink-limonade',
    kind: 'drink',
    categoryId: 'cat-boissons',
    priceCents: 150,
    kcal: 90,
    proteinG: 0,
    text: [
      ['Limonade', 'Limonade 33 cl'],
      ['Lemonade', 'Lemonade 33 cl'],
      ['Лимонад', 'Лимонад 0,33 л'],
    ],
  },
  {
    id: 'drink-jus',
    kind: 'drink',
    categoryId: 'cat-boissons',
    priceCents: 200,
    kcal: 110,
    proteinG: 2,
    text: [
      ['Jus d’orange', 'Jus d’orange pressé 33 cl'],
      ['Orange juice', 'Pressed orange juice 33 cl'],
      ['Апельсиновый сок', 'Апельсиновый сок 0,33 л'],
    ],
  },
  {
    id: 'comp-classique',
    kind: 'composition',
    categoryId: 'cat-populaires',
    priceCents: 950,
    kcal: 0,
    proteinG: 0,
    items: [
      { productId: 'pasta-penne', quantity: 1 },
      { productId: 'sauce-tomate', quantity: 1 },
    ],
    text: [
      ['La Classique', 'Penne, tomate basilic'],
      ['The Classic', 'Penne, tomato basil'],
      ['Классика', 'Пенне, томат с базиликом'],
    ],
  },
  {
    id: 'comp-veggie',
    kind: 'composition',
    categoryId: 'cat-populaires',
    priceCents: 1000,
    kcal: 0,
    proteinG: 0,
    items: [
      { productId: 'pasta-spaghetti', quantity: 1 },
      { productId: 'sauce-pesto', quantity: 1 },
      { productId: 'top-legumes', quantity: 1 },
    ],
    text: [
      ['La Veggie', 'Spaghetti, pesto, légumes'],
      ['The Veggie', 'Spaghetti, pesto, vegetables'],
      ['Вегги', 'Спагетти, песто, овощи'],
    ],
  },
  {
    id: 'comp-proteinee',
    kind: 'composition',
    categoryId: 'cat-populaires',
    priceCents: 1300,
    kcal: 0,
    proteinG: 0,
    items: [
      { productId: 'pasta-complete', quantity: 1 },
      { productId: 'sauce-bolognaise', quantity: 1 },
      { productId: 'top-poulet', quantity: 1 },
    ],
    text: [
      ['La Protéinée', 'Complètes, bolognaise, poulet'],
      ['The Protein', 'Whole-wheat, bolognese, chicken'],
      ['Протеиновая', 'Цельнозерновые, болоньезе, курица'],
    ],
  },
];

export const PRODUCT_SEED: Product[] = seeds.map((input, index) => product(index, input));
