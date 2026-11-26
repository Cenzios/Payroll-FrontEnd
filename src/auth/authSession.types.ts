import type { User } from '../types/auth.types';

/** Normalised result of POST /auth/login and POST /auth/refresh. */
export interface AuthSession {
  token: string;
  user: User;
  hasActivePlan: boolean;
  hasCompany: boolean;
}

/** Raw `data` payload returned by /auth/login and /auth/refresh. */
export interface AuthSessionPayload {
  token?: string;
  user?: Partial<User> | null;
  hasActivePlan?: boolean;
  hasCompany?: boolean;
}
