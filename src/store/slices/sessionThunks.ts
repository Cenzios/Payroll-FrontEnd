import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../api/axios';
import { clearAccessToken, setAccessToken } from '../../auth/tokenStore';
import { refreshAccessToken } from '../../auth/refreshSession';
import { toAuthSession } from '../../auth/toAuthSession';
import type { AuthSession, AuthSessionPayload } from '../../auth/authSession.types';
import type { LoginRequest, User } from '../../types/auth.types';

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

export interface LoginResult {
  user: User;
  hasActivePlan: boolean;
  hasCompany: boolean;
}

function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiEnvelope<unknown>>(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

/**
 * Runs once at app start: exchanges the HttpOnly refresh cookie for an
 * in-memory access token. Resolves to null when the visitor is logged out.
 * (The refreshed session itself reaches Redux via the authEvents bridge.)
 */
export const bootstrapSession = createAsyncThunk<AuthSession | null, void>(
  'auth/bootstrapSession',
  async (): Promise<AuthSession | null> => {
    const outcome = await refreshAccessToken();
    return outcome.session;
  }
);

export const loginUser = createAsyncThunk<LoginResult, LoginRequest, { rejectValue: string }>(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ApiEnvelope<AuthSessionPayload>>(
        '/auth/login',
        credentials
      );
      const session = toAuthSession(response.data.data);
      if (!session) {
        return rejectWithValue('Login failed');
      }
      setAccessToken(session.token);
      return {
        user: session.user,
        hasActivePlan: session.hasActivePlan,
        hasCompany: session.hasCompany,
      };
    } catch (error) {
      return rejectWithValue(errorMessage(error, 'Login failed'));
    }
  }
);

/** Revokes the server session (cookie is enough; Bearer optional) and clears memory. */
export const logout = createAsyncThunk<void, void>(
  'auth/logout',
  async (): Promise<void> => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (error) {
      console.warn('Logout request failed; clearing local session anyway', error);
    } finally {
      clearAccessToken();
    }
  }
);
