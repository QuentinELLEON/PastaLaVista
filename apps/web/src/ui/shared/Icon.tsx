import type { ReactNode } from 'react';

/** Pictogrammes inline (pas de dépendance) : toujours décoratifs, le libellé est porté par le bouton. */
const PATHS: Record<string, ReactNode> = {
  globe: (
    <>
      <circle cx="24" cy="24" r="18" />
      <path d="M6 24h36M24 6c-9 10-9 26 0 36M24 6c9 10 9 26 0 36" />
    </>
  ),
  accessibility: (
    <>
      <circle cx="24" cy="9" r="4" />
      <path d="M11 18h26M24 18v14M24 32l-8 12M24 32l8 12" />
    </>
  ),
  check: <path d="M10 25l10 10 18-20" />,
  plate: (
    <>
      <circle cx="24" cy="24" r="17" />
      <circle cx="24" cy="24" r="8" />
    </>
  ),
  bag: (
    <>
      <path d="M10 16h28l-2 26H12z" />
      <path d="M18 20v-5a6 6 0 0 1 12 0v5" />
    </>
  ),
  plus: (
    <>
      <circle cx="24" cy="24" r="17" />
      <path d="M24 15v18M15 24h18" />
    </>
  ),
  star: <path d="M24 6l5.5 11.5L42 19l-9 8.8L35.2 41 24 35l-11.2 6L15 27.8 6 19l12.5-1.5z" />,
  drink: (
    <>
      <path d="M12 12h24l-3 30H15z" />
      <path d="M12 12l3-6h18l3 6" />
    </>
  ),
  dessert: <path d="M8 30h32v12H8zM12 30v-8h24v8M24 22v-8" />,
  menus: (
    <>
      <rect x="6" y="14" width="36" height="22" rx="4" />
      <path d="M6 24h36" />
    </>
  ),
  card: (
    <>
      <rect x="5" y="11" width="38" height="26" rx="5" />
      <path d="M5 20h38" />
    </>
  ),
  phone: (
    <>
      <rect x="14" y="5" width="20" height="38" rx="5" />
      <path d="M21 38h6" />
    </>
  ),
  cash: (
    <>
      <rect x="4" y="12" width="40" height="24" rx="4" />
      <circle cx="24" cy="24" r="6" />
    </>
  ),
  arrowDown: <path d="M24 6v32M12 26l12 12 12-12" />,
  help: (
    <>
      <circle cx="24" cy="24" r="18" />
      <path d="M19 19a5 5 0 1 1 7 4.5c-1.5.8-2 1.8-2 3.5M24 33v1" />
    </>
  ),
  send: <path d="M6 24l36-16-12 32-8-12z" />,
  lock: (
    <>
      <rect x="9" y="21" width="30" height="21" rx="4" />
      <path d="M16 21v-6a8 8 0 0 1 16 0v6" />
    </>
  ),
  chat: <path d="M8 10h32v22H20l-8 8v-8H8z" />,
};

interface IconProps {
  name: keyof typeof PATHS;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 32, strokeWidth = 3 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}

export function Logo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#C8321B" />
      <path
        d="M14 30c6-8 10 8 18 0s12 8 18 0"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M16 42c6-8 10 8 16 0s10 8 16 0"
        fill="none"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
