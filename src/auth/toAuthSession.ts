import { jwtDecode } from 'jwt-decode';
import type { User } from '../types/auth.types';
import type { AuthSession, AuthSessionPayload } from './authSession.types';

interface AccessTokenClaims {
  userId?: string;
  role?: string;
  fullName?: string;
  email?: string;
  isTrialUser?: boolean;
}

function decodeClaims(token: string): AccessTokenClaims | null {
  try {
    return jwtDecode<AccessTokenClaims>(token);
  } catch (error) {
    console.error('Failed to decode access token', error);
    return null;
  }
}

/**
 * Builds the client-side identity. Prefers the `user` object from the API
 * response and falls back to the (non-secret) claims of the in-memory token.
 * Only whitelisted, non-sensitive fields are kept.
 */
function buildUser(token: string, raw: Partial<User> | null | undefined): User | null {
  const claims = decodeClaims(token);
  const id = raw?.id ?? claims?.userId;
  if (!id) {
    return null;
  }
  return {
    id,
    fullName: raw?.fullName ?? claims?.fullName ?? '',
    email: raw?.email ?? claims?.email ?? '',
    role: raw?.role ?? claims?.role ?? '',
    isTrialUser: raw?.isTrialUser ?? claims?.isTrialUser,
    createdAt: raw?.createdAt,
  };
}

/** Normalises a login/refresh `data` payload. Returns null if it has no usable token. */
export function toAuthSession(payload: AuthSessionPayload | null | undefined): AuthSession | null {
  const token = payload?.token;
  if (!token) {
    return null;
  }
  const user = buildUser(token, payload.user);
  if (!user) {
    return null;
  }
  return {
    token,
    user,
    hasActivePlan: payload.hasActivePlan === true,
    hasCompany: payload.hasCompany === true,
  };
}
