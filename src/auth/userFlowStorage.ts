/**
 * Per-user flow state kept in browser storage (signup / plan / onboarding steps).
 * None of it is secret, but it belongs to one user and must not leak into the
 * next session on the same browser, so it is wiped on logout.
 */

const SIGNUP_IDENTITY_KEY = 'signup_identity';

/** localStorage keys that hold one user's in-progress flow state. */
const USER_FLOW_KEYS: readonly string[] = [
  'termsAccepted',
  'subscriptionId',
  'signup_method',
  'reg_planId',
  'paid_employee_limit',
  'temp_companyName',
  'temp_companyEmail',
  'temp_companyAddress',
  'temp_companyPhone',
  // legacy keys from older builds
  'reg_email',
  'reg_password',
];

const EMPLOYEE_DRAFT_PREFIX = 'employee_add_draft_';

export interface SignupIdentity {
  fullName: string;
  email: string;
}

/** The name/email of a signup in progress (sessionStorage: this tab only, never a token). */
export function readSignupIdentity(): SignupIdentity | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_IDENTITY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { fullName, email } = parsed as Record<string, unknown>;
    return typeof fullName === 'string' && typeof email === 'string' ? { fullName, email } : null;
  } catch {
    return null;
  }
}

export function saveSignupIdentity(identity: SignupIdentity): void {
  try {
    sessionStorage.setItem(SIGNUP_IDENTITY_KEY, JSON.stringify(identity));
  } catch {
    // storage unavailable: the identity stays in memory only
  }
}

export function clearSignupIdentity(): void {
  try {
    sessionStorage.removeItem(SIGNUP_IDENTITY_KEY);
  } catch {
    // ignore
  }
}

/** Removes every per-user flow key (and employee form drafts) from browser storage. */
export function clearUserFlowStorage(): void {
  try {
    USER_FLOW_KEYS.forEach((key) => localStorage.removeItem(key));
    Object.keys(localStorage)
      .filter((key) => key.startsWith(EMPLOYEE_DRAFT_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Unable to clear user flow storage', error);
  }
  clearSignupIdentity();
}
