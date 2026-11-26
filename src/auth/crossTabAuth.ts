/**
 * Cross-tab auth sync. A login or logout in one tab is announced to every other
 * tab of the app (same origin) so none of them keeps showing a stale user.
 *
 * Transport: BroadcastChannel 'cenzpayroll-auth', or, where that API is missing,
 * a `storage` event on a short-lived localStorage key. Messages never carry a
 * token: only the event type and the (non-secret) user id.
 */

export type CrossTabAuthEvent =
  | { type: 'logout' }
  | { type: 'login'; userId: string };

type Listener = (event: CrossTabAuthEvent) => void;

const CHANNEL_NAME = 'cenzpayroll-auth';
const STORAGE_KEY = 'cenzpayroll-auth-event';

const channel: BroadcastChannel | null =
  typeof BroadcastChannel === 'function' ? new BroadcastChannel(CHANNEL_NAME) : null;

function parseEvent(value: unknown): CrossTabAuthEvent | null {
  if (typeof value !== 'object' || value === null || !('type' in value)) return null;
  const { type } = value as { type: unknown };
  if (type === 'logout') return { type: 'logout' };
  if (type === 'login' && 'userId' in value) {
    const { userId } = value as { userId: unknown };
    return typeof userId === 'string' && userId !== '' ? { type: 'login', userId } : null;
  }
  return null;
}

/** Tells every other tab about a login or logout in this tab (never echoed back to this tab). */
export function publishAuthEvent(event: CrossTabAuthEvent): void {
  if (channel) {
    channel.postMessage(event);
    return;
  }
  try {
    // A unique value so repeated identical events still fire `storage` in other tabs
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...event, at: `${Date.now()}-${Math.random()}` }));
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Cross-tab auth sync unavailable', error);
  }
}

/** Listens for auth events from other tabs. Returns the unsubscribe function. */
export function subscribeAuthEvents(listener: Listener): () => void {
  if (channel) {
    const onMessage = (message: MessageEvent<unknown>): void => {
      const event = parseEvent(message.data);
      if (event) listener(event);
    };
    channel.addEventListener('message', onMessage);
    return (): void => channel.removeEventListener('message', onMessage);
  }

  const onStorage = (storageEvent: StorageEvent): void => {
    if (storageEvent.key !== STORAGE_KEY || !storageEvent.newValue) return;
    try {
      const event = parseEvent(JSON.parse(storageEvent.newValue));
      if (event) listener(event);
    } catch {
      // Not ours / malformed: ignore
    }
  };
  window.addEventListener('storage', onStorage);
  return (): void => window.removeEventListener('storage', onStorage);
}
