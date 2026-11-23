import { Fragment, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '../../state/SessionProvider';
import { Icon, Logo } from '../shared/Icon';

export type KioskStep = 'choose' | 'order' | 'pay';
const STEPS: readonly KioskStep[] = ['choose', 'order', 'pay'];

/** Barre du haut : logo, badge du client reconnu OU langue, accessibilité, aide. */
export function TopBar() {
  const { state, dispatch, t } = useSession();
  const navigate = useNavigate();
  return (
    <header className="k-top">
      <div className="k-logo">
        <Logo />
        {t('app.name')}
      </div>
      <div className="k-tools">
        {state.customer ? (
          <span className="tool-btn tool-btn--ok">
            <Icon name="check" size={30} strokeWidth={5} />
            {abbreviate(state.customer.displayName)}
          </span>
        ) : (
          <ToolButton label={t('tool.language')} onClick={() => navigate('/kiosk/language')}>
            <Icon name="globe" />
            {state.language.toUpperCase()}
          </ToolButton>
        )}
        <ToolButton
          label={t('tool.accessibility')}
          pressed={state.highContrast}
          onClick={() => dispatch({ type: 'setHighContrast', enabled: !state.highContrast })}
        >
          <Icon name="accessibility" size={34} strokeWidth={3.5} />
        </ToolButton>
        <ToolButton
          label={t('tool.help')}
          pressed={state.helpRequested}
          onClick={() => dispatch({ type: 'requestHelp', requested: !state.helpRequested })}
        >
          <span style={{ fontSize: 34 }} aria-hidden="true">
            ?
          </span>
        </ToolButton>
      </div>
    </header>
  );
}

/** « Jérémy Martin » -> « Jérémy M. » */
export function abbreviate(displayName: string): string {
  const [first, ...rest] = displayName.split(' ');
  const initial = rest[0]?.[0];
  return initial ? `${first} ${initial}.` : (first ?? displayName);
}

interface ToolButtonProps {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}

export function ToolButton({ label, pressed, onClick, children }: ToolButtonProps) {
  return (
    <button
      type="button"
      className="tool-btn"
      aria-label={label}
      aria-pressed={pressed}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Choisir › Commander › Payer : étapes passées en vert (avec coche), étape active en rouge. */
export function StepIndicator({ current }: { current: KioskStep }) {
  const t = useSession().t;
  const currentIndex = STEPS.indexOf(current);
  return (
    <ol className="k-steps" aria-label={t('step.label')}>
      {STEPS.map((step, index) => {
        const done = index < currentIndex;
        return (
          <Fragment key={step}>
            <li aria-current={index === currentIndex ? 'step' : undefined} data-done={done}>
              {done ? '✓ ' : ''}
              {index + 1} {t(`step.${step}`)}
            </li>
            {index < STEPS.length - 1 ? (
              <li aria-hidden="true" className="k-steps__sep">
                ›
              </li>
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

export interface RailEntry {
  id: string;
  label: string;
  icon?: Parameters<typeof Icon>[0]['name'];
  /** Étape numérotée (composition) : affiche le numéro ou la coche si terminée. */
  number?: number;
  done?: boolean;
}

interface RailProps {
  entries: RailEntry[];
  activeId: string;
  ariaLabel: string;
  onSelect: (id: string) => void;
}

/** Rail de gauche : catégories du menu OU étapes de composition (mêmes composants). */
export function CategoryRail({ entries, activeId, ariaLabel, onSelect }: RailProps) {
  return (
    <nav className="k-rail" aria-label={ariaLabel}>
      {entries.map((entry) => (
        <button
          key={entry.id}
          type="button"
          className="rail-item"
          data-done={entry.done ? 'true' : undefined}
          aria-current={entry.id === activeId ? 'step' : undefined}
          onClick={() => onSelect(entry.id)}
        >
          {entry.number !== undefined ? (
            <span className="rail-item__badge">{entry.done ? '✓' : entry.number}</span>
          ) : entry.icon ? (
            <Icon name={entry.icon} size={52} />
          ) : null}
          {entry.label}
        </button>
      ))}
    </nav>
  );
}

/** Rappel du lecteur de carte physique ; vert quand le paiement est attendu. */
export function TerminalStrip({ active }: { active: boolean }) {
  const t = useSession().t;
  return (
    <footer className={`k-terminal${active ? ' k-terminal--active' : ''}`}>
      <span className="k-terminal__slot" aria-hidden="true" />
      {active ? t('pay.terminalActive') : t('pay.terminalIdle')}
    </footer>
  );
}

export interface DockLine {
  id: string;
  label: string;
  priceLabel: string;
}

interface DockProps {
  variant: 'cart' | 'checkout';
  title?: string;
  subtitle?: ReactNode;
  lines?: DockLine[];
  totalLabel: string;
  totalValue: string;
  children: ReactNode;
}

/** Panier permanent : toujours au même endroit, avec les boutons critiques (retour, annuler, payer). */
export function CartDock({
  variant,
  title,
  subtitle,
  lines = [],
  totalLabel,
  totalValue,
  children,
}: DockProps) {
  if (variant === 'checkout') {
    return (
      <section className="k-dock k-dock--checkout" aria-label={title}>
        <div className="k-total">
          {totalLabel}
          <b>{totalValue}</b>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>{children}</div>
      </section>
    );
  }
  return (
    <section className="k-dock" aria-label={title}>
      <div className="k-dock__head">
        <span>{title}</span>
        {subtitle}
      </div>
      <div className="k-dock__lines">
        {lines.map((line) => (
          <div key={line.id} className="k-dock__line">
            <span>{line.label}</span>
            <b>{line.priceLabel}</b>
          </div>
        ))}
      </div>
      <div className="k-dock__row">
        <div className="k-total">
          {totalLabel}
          <b>{totalValue}</b>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>{children}</div>
      </div>
    </section>
  );
}
