import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { clearAccessToken, getAccessToken } from '../auth/tokenStore';
import { refreshAccessToken } from '../auth/refreshSession';
import { emitSessionExpired } from '../auth/authEvents';

// Use environment variable from Vite
const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

/**
 * The ONE shared HTTP client for the main backend. `withCredentials` lets the
 * browser send the HttpOnly refresh cookie to /auth/refresh and /auth/logout.
 */
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _authRetried?: boolean;
}

interface ApiErrorBody {
  /** Legacy top-level code; the standard envelope carries it in data.code. */
  code?: string;
  message?: string;
  data?: { code?: string } | null;
}

/** 401s from these endpoints are final; never try to refresh for them. */
const NO_REFRESH_ENDPOINTS: readonly string[] = ['/auth/login', '/auth/refresh', '/auth/logout'];

function isNoRefreshEndpoint(url: string | undefined): boolean {
  return NO_REFRESH_ENDPOINTS.some((endpoint) => (url ?? '').includes(endpoint));
}

/* =========================
   REQUEST INTERCEPTOR
========================= */
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: unknown): Promise<never> => Promise.reject(error)
);

/* =========================
   RESPONSE INTERCEPTOR
========================= */

// 🔒 Prevent duplicate modal triggers (important for React 18 / prod)
let renewModalOpened = false;

function openModalOnce(openEvent: string, closedEvent: string): void {
  if (renewModalOpened) return;
  renewModalOpened = true;
  window.dispatchEvent(new CustomEvent(openEvent));
  window.addEventListener(
    closedEvent,
    () => {
      renewModalOpened = false;
    },
    { once: true }
  );
}

/** Session is gone: clear memory state and send the user to /login. */
function endSession(message: string): void {
  clearAccessToken();
  const suspended = message.toLowerCase().includes('suspended');
  emitSessionExpired({ suspended });
  if (window.location.pathname !== '/login') {
    window.location.href = suspended ? '/login?reason=suspended' : '/login';
  }
}

async function handleUnauthorized(error: AxiosError<ApiErrorBody>): Promise<AxiosResponse> {
  const config = error.config as RetriableRequestConfig | undefined;
  if (!config || isNoRefreshEndpoint(config.url)) {
    return Promise.reject(error);
  }

  const originalMessage = error.response?.data?.message ?? '';
  if (config._authRetried) {
    endSession(originalMessage);
    return Promise.reject(error);
  }

  config._authRetried = true;
  const outcome = await refreshAccessToken();
  if (!outcome.session) {
    endSession(outcome.failureMessage || originalMessage);
    return Promise.reject(error);
  }

  config.headers.Authorization = `Bearer ${outcome.session.token}`;
  return axiosInstance(config);
}

axiosInstance.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError<ApiErrorBody>): Promise<AxiosResponse> => {
    const status = error.response?.status;
    const code = error.response?.data?.data?.code ?? error.response?.data?.code;

    /* 🔥 TRIAL EXPIRATION HANDLING */
    if (status === 403 && code === 'TRIAL_EXPIRED') {
      openModalOnce('open-trial-upgrade-modal', 'trial-modal-closed');
      return Promise.reject(error);
    }

    /* 🔥 SUBSCRIPTION BLOCK HANDLING */
    if (status === 403 && code === 'SUBSCRIPTION_BLOCKED') {
      // Reset flag after modal is closed (frontend emits 'renew-modal-closed')
      openModalOnce('open-renew-modal', 'renew-modal-closed');
      // Always reject so API callers still fail safely
      return Promise.reject(error);
    }

    /* 🔐 AUTH HANDLING: single-flight refresh → retry once → logout */
    if (status === 401) {
      return handleUnauthorized(error);
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
