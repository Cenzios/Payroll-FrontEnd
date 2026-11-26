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
    // The shared refresh cookie now belongs to another user (logged in from another tab):
    // never mix that user's token with this tab's state; reload into the new session
    // (CompanySelectionGuard revalidates the company id on load).
    const currentUserId = store.getState().auth.user?.id;
    if (currentUserId && currentUserId !== session.user.id) {
      window.location.replace('/dashboard');
      return;
    }
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
    localStorage.removeItem('reg_email');
    localStorage.removeItem('reg_password');
  } catch (error) {
    console.warn('Unable to purge legacy auth storage', error);
  }
}
