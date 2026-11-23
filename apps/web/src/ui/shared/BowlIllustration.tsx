import type { ReactNode } from 'react';

/** Illustrations alimentaires (SVG inline) : plats populaires, pâtes, garnitures. Décoratives. */
type Art =
  | 'classique'
  | 'veggie'
  | 'proteinee'
  | 'penne'
  | 'spaghetti'
  | 'tagliatelle'
  | 'complete'
  | 'sauce'
  | 'chicken'
  | 'tuna'
  | 'egg'
  | 'generic'
  | 'drink';

const ART_BY_PRODUCT: Record<string, Art> = {
  'comp-classique': 'classique',
  'comp-veggie': 'veggie',
  'comp-proteinee': 'proteinee',
  'pasta-penne': 'penne',
  'pasta-spaghetti': 'spaghetti',
  'pasta-tagliatelle': 'tagliatelle',
  'pasta-complete': 'complete',
  'top-poulet': 'chicken',
  'top-thon': 'tuna',
  'top-oeuf': 'egg',
  'drink-eau': 'drink',
  'drink-limonade': 'drink',
  'drink-jus': 'drink',
};

export function artFor(productId: string, fallback: Art = 'generic'): Art {
  return ART_BY_PRODUCT[productId] ?? (productId.startsWith('sauce-') ? 'sauce' : fallback);
}

const PENNE = (fill: string, stroke: string) => (
  <g fill={fill} stroke={stroke} strokeWidth="2">
    <rect x="6" y="20" width="34" height="14" rx="7" transform="rotate(-25 23 27)" />
    <rect x="24" y="32" width="34" height="14" rx="7" transform="rotate(-25 41 39)" />
  </g>
);

const WAVES = (stroke: string, width: number, ys: number[]) => (
  <g fill="none" stroke={stroke} strokeWidth={width} strokeLinecap="round">
    {ys.map((y) => (
      <path key={y} d={`M8 ${y}c8-8 12 8 20 0s12 8 20 0`} />
    ))}
  </g>
);

function bowl(sauce: string, content: ReactNode) {
  return (
    <>
      <circle cx="32" cy="32" r="29" fill="#fff" stroke="#DDD7CF" strokeWidth="2" />
      <circle cx="32" cy="32" r="22" fill={sauce} />
      {content}
    </>
  );
}

function render(art: Art) {
  switch (art) {
    case 'classique':
      return bowl('#D9452B', PENNE('#E9B44C', '#B9831A'));
    case 'veggie':
      return bowl('#5E9A3C', WAVES('#E9B44C', 5, [30, 40]));
    case 'proteinee':
      return bowl(
        '#8E2A1A',
        <>
          {PENNE('#B98A4E', '#7C5522')}
          <circle cx="42" cy="22" r="4" fill="#D9A25B" />
        </>,
      );
    case 'penne':
      return PENNE('#E9B44C', '#B9831A');
    case 'complete':
      return PENNE('#B98A4E', '#7C5522');
    case 'spaghetti':
      return WAVES('#E9B44C', 4, [18, 32, 46]);
    case 'tagliatelle':
      return WAVES('#E9B44C', 9, [22, 40]);
    case 'sauce':
      return <circle cx="32" cy="32" r="20" fill="#D9452B" stroke="#8E2A1A" strokeWidth="2" />;
    case 'chicken':
      return bowl(
        '#fff',
        <path
          d="M18 36c0-10 8-16 18-14 6 2 9 8 8 14-1 6-8 8-14 8s-12-2-12-8z"
          fill="#D9A25B"
          stroke="#A46A25"
          strokeWidth="2"
        />,
      );
    case 'tuna':
      return bowl(
        '#fff',
        <>
          <path
            d="M14 32c8-12 24-12 34 0-10 12-26 12-34 0z"
            fill="#E7A9A0"
            stroke="#B5675D"
            strokeWidth="2"
          />
          <circle cx="22" cy="30" r="2" fill="#1C1B1A" />
        </>,
      );
    case 'egg':
      return bowl(
        '#fff',
        <>
          <ellipse cx="32" cy="32" rx="14" ry="18" fill="#fff" stroke="#A8A29A" strokeWidth="2" />
          <circle cx="32" cy="34" r="7" fill="#E9B44C" />
        </>,
      );
    case 'drink':
      return (
        <g fill="#fff" stroke="#1C1B1A" strokeWidth="3" strokeLinejoin="round">
          <path d="M18 12h28l-3 42H21z" />
          <path d="M20 28h24" />
        </g>
      );
    case 'generic':
      return bowl('#E9B44C', null);
  }
}

interface Props {
  productId?: string;
  art?: Art;
  size?: number;
}

export function BowlIllustration({ productId, art, size = 112 }: Props) {
  const key = art ?? (productId ? artFor(productId) : 'generic');
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {render(key)}
    </svg>
  );
}
