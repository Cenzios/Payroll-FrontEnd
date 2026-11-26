import type { store as appStore } from '../store/store';
import { onSessionExpired, onSessionRefreshed } from './authEvents';
import { sessionCleared, sessionEstablished } from '../store/slices/authSlice';
import { apiSlice } from '../store/apiSlice';

type AppStore = typeof appStore;

let registered = false;

/**
 * Bridges the HTTP layer's session events into Redux. Called once from main.tsx.
 */
export function registerAuthListeners(store: AppStore): void {
  if (registered) return;
  registered = true;

  onSessionRefreshed((session) => {
    store.dispatch(sessionEstablished(session));
  });

  onSessionExpired(() => {
    store.dispatch(sessionCleared());
    store.dispatch(apiSlice.util.resetApiState());
  });
}

/** Removes auth artefacts left in storage by older builds. Safe to call every boot. */
export function purgeLegacyAuthStorage(): void {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('signup_token');
  } catch (error) {
    console.warn('Unable to purge legacy auth storage', error);
  }
}
