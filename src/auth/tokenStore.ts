/**
 * In-memory access token store.
 *
 * The access token lives ONLY in this module-level variable. It is never
 * written to localStorage, sessionStorage, Redux, cookies or the URL.
 * The long-lived refresh token is an HttpOnly cookie managed by the backend.
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
