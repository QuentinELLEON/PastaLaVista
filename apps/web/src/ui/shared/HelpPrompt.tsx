import { useT } from '../../state/SessionProvider';
import { Button } from './Button';
import { Icon } from './Icon';

export interface HelpPromptProps {
  /** Offre d'aide en attente de réponse (accepter / refuser). */
  offered: boolean;
  /** Aide acceptée : on propose de la désactiver. */
  active: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onCallStaff?: () => void;
  onOpenChatbot?: () => void;
  onClose: () => void;
  className?: string;
}

/**
 * Proposition d'aide : l'aide est PROPOSÉE, jamais imposée. Le client peut l'accepter,
 * appeler un employé, ou la refuser (retour au standard).
 */
export function HelpPrompt({
  offered,
  active,
  onAccept,
  onDecline,
  onCallStaff,
  onOpenChatbot,
  onClose,
  className = '',
}: HelpPromptProps) {
  const t = useT();
  return (
    <section
      className={`help-prompt ${className}`.trim()}
      role="region"
      aria-label={t('help.title')}
    >
      <h2 className="help-prompt__title">
        <Icon name="help" size={36} />
        {active ? t('help.activeTitle') : t('help.title')}
      </h2>
      <div className="help-prompt__actions">
        {offered ? (
          <Button variant="success" onClick={onAccept}>
            {t('help.accept')}
          </Button>
        ) : null}
        {onOpenChatbot ? <Button onClick={onOpenChatbot}>{t('help.chatbot')}</Button> : null}
        {onCallStaff ? <Button onClick={onCallStaff}>{t('help.callStaff')}</Button> : null}
        <Button onClick={offered ? onDecline : active ? onDecline : onClose}>
          {offered ? t('help.decline') : active ? t('help.switchOff') : t('common.close')}
        </Button>
      </div>
    </section>
  );
}
