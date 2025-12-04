export interface User {
  id: string;
  email: string;
  role: string;
}

export interface Subscription {
  id?: string;
  userId?: string;
  planId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface Plan {
  id?: string;
  name?: string;
  price?: number;
  features?: string[];
}

export interface RegisterRequest {
  email: string;
  password: string;
  planId: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    subscription: Subscription;
    plan: Plan;
    token: string;
  };
}

export interface LoginResponse {
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
}
