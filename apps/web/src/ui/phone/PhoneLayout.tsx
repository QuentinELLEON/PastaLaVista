import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdaptation } from '../../adaptation/provider/AdaptationProvider';
import { useSession } from '../../state/SessionProvider';
import { HelpPrompt } from '../shared/HelpPrompt';
import { Icon, Logo } from '../shared/Icon';
import './phone.css';

function PhoneHelp() {
  const { state, dispatch } = useSession();
  const { config, commitNow } = useAdaptation();
  const navigate = useNavigate();
  const offered = config.dialogue.helpPrompt;
  if (!offered && !state.helpRequested) return null;
  const answer = (value: 'accepted' | 'declined') => {
    dispatch({ type: 'answerHelp', answer: value });
    commitNow();
  };
  return (
    <HelpPrompt
      offered={offered}
      active={config.profile === 'guided'}
      onAccept={() => answer('accepted')}
      onDecline={() => answer('declined')}
      onOpenChatbot={config.dialogue.chatbotOffer ? () => navigate('/m/chat') : undefined}
      onClose={() => dispatch({ type: 'requestHelp', requested: false })}
    />
  );
}

interface Props {
  children: ReactNode;
  /** Bouton principal en bas de l'écran (une seule action par écran). */
  footer?: ReactNode;
  /** Chat : le corps gère lui-même son défilement. */
  fill?: boolean;
  showUrlBar?: boolean;
}

/**
 * Ossature du smartphone : barre du haut, corps en une colonne, barre d'action en bas.
 * Elle partage jetons, boutons et composants avec la borne ; seule la disposition diffère.
 */
export function PhoneLayout({ children, footer, fill, showUrlBar }: Props) {
  const { state, dispatch, t } = useSession();
  const { config } = useAdaptation();
  const navigate = useNavigate();
  return (
    <div
      className="phone"
      data-density={config.presentation.density}
      data-profile={config.profile}
      lang={state.language}
    >
      {showUrlBar ? (
        <div className="p-url">
          <Icon name="lock" size={16} strokeWidth={4} />
          <span>pastalavista.example/{state.language}</span>
        </div>
      ) : null}
      <header className="p-top">
        <button
          type="button"
          className="p-logo"
          style={{ background: 'none', border: 0 }}
          onClick={() => navigate('/m')}
          aria-label={t('app.name')}
        >
          <Logo size={30} />
          {t('app.name')}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="p-badge"
            aria-label={t('tool.help')}
            aria-pressed={state.helpRequested}
            onClick={() => dispatch({ type: 'requestHelp', requested: !state.helpRequested })}
            style={{ cursor: 'pointer' }}
          >
            ?
          </button>
          {state.customer ? (
            <span className="p-badge">
              <Icon name="check" size={16} strokeWidth={6} />
              {state.customer.displayName.split(' ')[0]}
            </span>
          ) : (
            <span className="p-badge" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
              <Icon name="globe" size={18} strokeWidth={4} />
              {state.language.toUpperCase()}
            </span>
          )}
        </div>
      </header>
      <main
        className={fill ? '' : 'p-body'}
        style={
          fill ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined
        }
      >
        <PhoneHelp />
        {children}
      </main>
      {footer ? <div className="p-bar">{footer}</div> : null}
    </div>
  );
}
