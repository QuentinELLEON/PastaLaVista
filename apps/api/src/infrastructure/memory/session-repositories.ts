import type { AuthSession, KioskLoginSession } from '../../domain/entities';
import { DuplicateKeyError } from '../../domain/errors';
import type {
  AuthSessionRepository,
  KioskLoginSessionRepository,
} from '../../domain/ports/repositories';
import { copy } from './reference-repositories';

export class MemoryKioskLoginSessionRepository implements KioskLoginSessionRepository {
  private readonly rows = new Map<string, KioskLoginSession>();

  async create(session: KioskLoginSession): Promise<KioskLoginSession> {
    if (this.rows.has(session.id)) throw new DuplicateKeyError('kiosk_login_session', session.id);
    this.rows.set(session.id, copy(session));
    return copy(session);
  }

  async findById(id: string): Promise<KioskLoginSession | null> {
    const row = this.rows.get(id);
    return row ? copy(row) : null;
  }

  async save(session: KioskLoginSession): Promise<KioskLoginSession> {
    this.rows.set(session.id, copy(session));
    return copy(session);
  }
}

export class MemoryAuthSessionRepository implements AuthSessionRepository {
  private readonly rows = new Map<string, AuthSession>();

  async create(session: AuthSession): Promise<AuthSession> {
    if (this.rows.has(session.token)) throw new DuplicateKeyError('auth_session', 'token');
    this.rows.set(session.token, copy(session));
    return copy(session);
  }

  async findByToken(token: string): Promise<AuthSession | null> {
    const row = this.rows.get(token);
    return row ? copy(row) : null;
  }
}
