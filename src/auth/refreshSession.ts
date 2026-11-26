import axios from 'axios';
import { clearAccessToken, setAccessToken } from './tokenStore';
import { emitSessionRefreshed } from './authEvents';
import { toAuthSession } from './toAuthSession';
import type { AuthSession, AuthSessionPayload } from './authSession.types';

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

export interface RefreshOutcome {
  session: AuthSession | null;
  /** Server message when the refresh was rejected (empty string otherwise). */
  failureMessage: string;
}

interface RefreshResponseBody {
  data?: AuthSessionPayload;
  message?: string;
}

let inFlight: Promise<RefreshOutcome> | null = null;

function extractMessage(error: unknown): string {
  if (axios.isAxiosError<RefreshResponseBody>(error)) {
    return error.response?.data?.message ?? '';
  }
  return '';
}

async function requestRefresh(): Promise<RefreshOutcome> {
  try {
    // Bare axios (no app interceptors): the refresh cookie is the credential.
    const response = await axios.post<RefreshResponseBody>(
      `${API_BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );
    const session = toAuthSession(response.data.data);
    if (!session) {
      clearAccessToken();
      return { session: null, failureMessage: 'Invalid refresh response' };
    }
    setAccessToken(session.token);
    emitSessionRefreshed(session);
    return { session, failureMessage: '' };
  } catch (error) {
    clearAccessToken();
    return { session: null, failureMessage: extractMessage(error) };
  }
}

/**
 * Single-flight refresh: concurrent callers (parallel 401s, StrictMode double
 * effects, bootstrap) all share one POST /auth/refresh so the rotating refresh
 * cookie is only used once.
 */
export function refreshAccessToken(): Promise<RefreshOutcome> {
  if (!inFlight) {
    inFlight = requestRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
