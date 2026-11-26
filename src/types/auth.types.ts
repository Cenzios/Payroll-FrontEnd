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

export interface StartSignupResponse {
  success: boolean;
  message: string;
  // signupToken?: string; 
  data?: {
      signupToken?: string;
    };
}

export interface ResendVerificationRequest {
  signupToken: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  // signupToken?: string;
  data?: {
      signupToken?: string;
    };
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  email?: string; // ✅ ADD
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
  signupToken: string | null; // in memory only
  isLoading: boolean;
  error: string | null;
  signupEmail: string | null;
  tempPassword: string | null;
  tempPlanId: string | null;
  selectedCompanyId: string | null;
  accessStatus: 'LOADING' | 'ACTIVE' | 'BLOCKED';
}
