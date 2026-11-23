import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { buildCatalog, type Catalog } from '../domain/catalog/catalog';
import { catalogApi } from '../services/api';
import { useSession } from './SessionProvider';

type Status = 'loading' | 'ready' | 'error';

interface CatalogContextValue {
  catalog: Catalog | null;
  status: Status;
  reload: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

/** Charge le catalogue dans la langue courante ; un changement de langue le recharge sans toucher au panier. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { state } = useSession();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus((current) => (current === 'ready' ? current : 'loading'));
    Promise.all([catalogApi.products(state.language), catalogApi.categories(state.language)])
      .then(([products, categories]) => {
        if (cancelled) return;
        setCatalog(buildCatalog(products, categories));
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [state.language, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const value = useMemo(() => ({ catalog, status, reload }), [catalog, status, reload]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalogState(): CatalogContextValue {
  const value = useContext(CatalogContext);
  if (!value) throw new Error('useCatalogState doit être utilisé dans un CatalogProvider');
  return value;
}

/** Catalogue garanti chargé : à utiliser sous <CatalogGate>. */
export function useCatalog(): Catalog {
  const { catalog } = useCatalogState();
  if (!catalog) throw new Error('Catalogue non chargé : envelopper l’écran dans <CatalogGate>');
  return catalog;
}
