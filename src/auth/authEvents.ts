import type { AuthSession } from './authSession.types';

/**
 * Tiny event bus so the HTTP layer (which must not import the Redux store,
 * to avoid an import cycle) can tell the app that the session was refreshed
 * or has ended.
 */

export interface SessionExpiredInfo {
  suspended: boolean;
}

type RefreshedListener = (session: AuthSession) => void;
type ExpiredListener = (info: SessionExpiredInfo) => void;

const refreshedListeners = new Set<RefreshedListener>();
const expiredListeners = new Set<ExpiredListener>();

export function onSessionRefreshed(listener: RefreshedListener): () => void {
  refreshedListeners.add(listener);
  return (): void => {
    refreshedListeners.delete(listener);
  };
}

export function onSessionExpired(listener: ExpiredListener): () => void {
  expiredListeners.add(listener);
  return (): void => {
    expiredListeners.delete(listener);
  };
}

export function emitSessionRefreshed(session: AuthSession): void {
  refreshedListeners.forEach((listener) => listener(session));
}

export function emitSessionExpired(info: SessionExpiredInfo): void {
  expiredListeners.forEach((listener) => listener(info));
}
