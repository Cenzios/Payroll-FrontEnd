export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
}

export interface StartSignupRequest {
  fullName: string;
  email: string;
}

export interface StartSignupResponse {
  success: boolean;
  message: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface SetPasswordRequest {
  email: string;
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

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  planId: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  signupEmail: string | null;
  tempPassword: string | null;
  tempPlanId: string | null;
  selectedCompanyId: string | null;
}
