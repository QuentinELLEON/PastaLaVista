import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react';
import { createTranslator, type Translate } from '../i18n';
import {
  INITIAL_SESSION,
  sessionReducer,
  type SessionAction,
  type SessionState,
} from '../domain/session/session';
import { STORAGE_KEYS } from '../shared/constants';

interface SessionContextValue {
  state: SessionState;
  dispatch: Dispatch<SessionAction>;
  t: Translate;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/** Seuls ces champs survivent à un rechargement du smartphone (le jeton du brouillon en fait partie). */
type PersistedSession = Pick<
  SessionState,
  'language' | 'mode' | 'customer' | 'sessionToken' | 'cart' | 'draft'
>;

function loadPersisted(storageKey: string | null): SessionState {
  if (!storageKey) return INITIAL_SESSION;
  try {
    const raw = window.sessionStorage.getItem(storageKey);
    return raw ? { ...INITIAL_SESSION, ...(JSON.parse(raw) as PersistedSession) } : INITIAL_SESSION;
  } catch {
    return INITIAL_SESSION;
  }
}

function persist(storageKey: string, state: SessionState): void {
  const { language, mode, customer, sessionToken, cart, draft } = state;
  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({ language, mode, customer, sessionToken, cart, draft }),
    );
  } catch {
    // Stockage indisponible (navigation privée) : l'application fonctionne sans persistance
  }
}

interface Props {
  children: ReactNode;
  /** Clé de persistance (smartphone uniquement) ; absente pour la borne : rien n'est conservé. */
  storageKey?: string | null;
  initial?: Partial<SessionState>;
}

export function SessionProvider({ children, storageKey = null, initial }: Props) {
  const [state, dispatch] = useReducer(sessionReducer, storageKey, (key) => ({
    ...loadPersisted(key),
    ...initial,
  }));

  useEffect(() => {
    if (storageKey) persist(storageKey, state);
  }, [state, storageKey]);

  const t = useMemo(() => createTranslator(state.language), [state.language]);
  const value = useMemo(() => ({ state, dispatch, t }), [state, t]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession doit être utilisé dans un SessionProvider');
  return value;
}

export function useT(): Translate {
  return useSession().t;
}

export const PHONE_STORAGE_KEY = STORAGE_KEYS.phoneSession;
