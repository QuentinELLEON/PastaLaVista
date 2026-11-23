import type { ReactNode } from 'react';
import { useCatalogState } from '../../state/CatalogProvider';
import { useT } from '../../state/SessionProvider';
import { Button } from './Button';

/** N'affiche l'écran que lorsque le catalogue est chargé ; sinon chargement ou erreur avec relance. */
export function CatalogGate({ children }: { children: ReactNode }) {
  const { catalog, status, reload } = useCatalogState();
  const t = useT();
  if (catalog) return <>{children}</>;
  return (
    <div className="screen-center" role={status === 'error' ? 'alert' : 'status'}>
      <p style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>
        {status === 'error' ? t('error.api') : t('common.loading')}
      </p>
      {status === 'error' ? (
        <Button variant="primary" onClick={reload}>
          {t('common.retry')}
        </Button>
      ) : null}
    </div>
  );
}
