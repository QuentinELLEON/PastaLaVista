import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { ChatReplyDto, ChatSuggestionDto, OrderLineInput } from '@pastalavista/shared';
import { chatApi } from '../../services/api';
import { useSession } from '../../state/SessionProvider';
import { Button } from './Button';
import { Icon } from './Icon';
import { SuggestionCard } from './SuggestionCard';

interface Message {
  id: number;
  from: 'bot' | 'me';
  text: string;
  suggestions?: ChatSuggestionDto[];
}

interface Props {
  onAddSuggestion: (lines: OrderLineInput[]) => void;
  onModifySuggestion: (lines: OrderLineInput[]) => void;
  onShowMenu: () => void;
  onCallStaff: () => void;
}

/** Chatbot de prise de commande : réponses du serveur, limitées au catalogue réel. */
export function ChatPanel({ onAddSuggestion, onModifySuggestion, onShowMenu, onCallStaff }: Props) {
  const { state, t } = useSession();
  const [messages, setMessages] = useState<Message[]>(() => [
    { id: 0, from: 'bot', text: t('chat.welcome') },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [messages]);

  function append(message: Omit<Message, 'id'>) {
    setMessages((previous) => [...previous, { ...message, id: nextId.current++ }]);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft('');
    append({ from: 'me', text });
    setBusy(true);
    try {
      const reply: ChatReplyDto = await chatApi.reply(text, state.language);
      append({ from: 'bot', text: reply.text, suggestions: reply.suggestions });
      if (reply.callStaff) onCallStaff();
    } catch {
      append({ from: 'bot', text: t('chat.error') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="p-chat">
        <div className="chat" role="log" aria-label={t('chat.messages')} aria-live="polite">
          {messages.map((message) => (
            <div key={message.id} style={{ display: 'contents' }}>
              <p className={`chat__bubble chat__bubble--${message.from}`}>{message.text}</p>
              {message.suggestions?.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onAdd={() => {
                    onAddSuggestion(suggestion.lines);
                    append({ from: 'bot', text: t('chat.added') });
                  }}
                  onModify={() => onModifySuggestion(suggestion.lines)}
                />
              ))}
            </div>
          ))}
          <div ref={endRef} />
        </div>
      </div>
      <div className="chips">
        <button type="button" className="chip" onClick={onShowMenu}>
          {t('chat.showMenu')}
        </button>
        <button type="button" className="chip" onClick={onCallStaff}>
          {t('chat.callStaff')}
        </button>
      </div>
      <form className="chat-input" onSubmit={send}>
        <label htmlFor="chat-message" className="sr-only">
          {t('chat.placeholder')}
        </label>
        <input
          id="chat-message"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('chat.placeholder')}
          autoComplete="off"
        />
        <Button
          type="submit"
          variant="primary"
          aria-label={t('chat.send')}
          disabled={busy}
          style={{ width: 52, padding: 0 }}
        >
          <Icon name="send" size={24} strokeWidth={4} />
        </Button>
      </form>
    </>
  );
}
