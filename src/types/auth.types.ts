export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isTrialUser?: boolean;
  createdAt?: string; // ✅ ADDED
}

export interface StartSignupRequest {
  fullName: string;
  email: string;
}

/** start-signup never returns a token: the verification link is only emailed. */
export interface StartSignupResponse {
  success: boolean;
  message: string;
}

/** Resend issues a brand-new emailed link for this name/email (no token involved). */
export interface ResendVerificationRequest {
  fullName: string;
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  data?: {
    email?: string;
  };
}

export interface SetPasswordRequest {
  signupToken: string; // ✅ Use token instead of email
  password: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  /** True once a login/refresh succeeded. The access token itself is in src/auth/tokenStore.ts. */
  isAuthenticated: boolean;
  /** 'pending' until the boot-time POST /auth/refresh has settled. */
  bootstrapStatus: 'pending' | 'done';
  /** Token from the emailed /verify-email link (in memory only); needed by set-password. */
  signupToken: string | null;
  isLoading: boolean;
  error: string | null;
  signupEmail: string | null;
  signupFullName: string | null;
  tempPassword: string | null;
  tempPlanId: string | null;
  selectedCompanyId: string | null;
  accessStatus: 'LOADING' | 'ACTIVE' | 'BLOCKED';
}
