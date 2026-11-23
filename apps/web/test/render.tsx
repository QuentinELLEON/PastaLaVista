import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SessionProvider } from '../src/state/SessionProvider';
import type { SessionState } from '../src/domain/session/session';

/** Rend un composant dans une session réelle (langue, panier...) et un routeur en mémoire. */
export function renderWithSession(ui: ReactElement, initial?: Partial<SessionState>) {
  return render(
    <MemoryRouter>
      <SessionProvider initial={initial}>{ui}</SessionProvider>
    </MemoryRouter>,
  );
}
