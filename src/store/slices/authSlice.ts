import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';
import { jwtDecode } from 'jwt-decode';

import {
  AuthState,
  StartSignupRequest,
  StartSignupResponse,
  VerifyEmailResponse,
  SetPasswordRequest,
  SetPasswordResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
} from '../../types/auth.types';

const initialState: AuthState = {
  user: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null,
  token: localStorage.getItem('token') || null,
  signupToken: localStorage.getItem('signup_token') || null, // ✅ Persist signup token
  signupEmail: localStorage.getItem('reg_email') || null,
  isLoading: false,
  error: null,
  tempPassword: null,
  tempPlanId: null,
  selectedCompanyId: localStorage.getItem('selectedCompanyId') || null,
  accessStatus: 'LOADING', // 'LOADING' | 'ACTIVE' | 'BLOCKED'
};

interface DecodedToken {
  userId: string;
  role: string;
  iat: number;
  exp: number;
}


export const startSignup = createAsyncThunk(
  'auth/startSignup',
  async (userData: StartSignupRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<StartSignupResponse>(
        '/auth/start-signup',
        userData
      );
      // ✅ Store in localStorage
      localStorage.setItem('reg_email', userData.email);
      if (response.data.signupToken) {
        localStorage.setItem('signup_token', response.data.signupToken);
      }
      return {
        email: userData.email,
        signupToken: response.data.signupToken,
        message: response.data.message
      };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Signup failed';
      return rejectWithValue(message);
    }
  }
);

export const checkAccessStatus = createAsyncThunk(
  'auth/checkAccessStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get('/subscription/access-status');
      return response.data.data; // { status: 'ACTIVE' | 'BLOCKED', message?: string }
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_BLOCKED') {
        return { status: 'BLOCKED', message: error.response.data.message };
      }
      return rejectWithValue(error.response?.data?.message || 'Failed to check access status');
    }
  }
);

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get<VerifyEmailResponse>(
        `/auth/verify-email?token=${token}`
      );
      // Store the verification JWT as signupToken for the next step
      localStorage.setItem('signup_token', token);
      return { ...response.data, signupToken: token };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Email verification failed';
      return rejectWithValue(message);
    }
  }
);

export const setPassword = createAsyncThunk(
  'auth/setPassword',
  async (data: SetPasswordRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<SetPasswordResponse>(
        '/auth/set-password', // ✅ Changed from /save-password
        data
      );
      // Clear signup token upon success
      localStorage.removeItem('signup_token');
      return response.data;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Password setup failed';
      return rejectWithValue(message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        '/auth/login',
        credentials
      );
      const { user, token, hasActivePlan } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token, hasActivePlan };
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<RegisterResponse>(
        '/auth/register',
        data
      );
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.removeItem('reg_email');
      localStorage.removeItem('reg_password');
      localStorage.removeItem('reg_planId');
      return { user, token };
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Registration failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    setAuthFromToken: (state, action) => {
      try {
        const decodedToken = jwtDecode<DecodedToken>(action.payload);

        // ✅ Create user object from token
        const user = {
          id: decodedToken.userId,
          fullName: (decodedToken as any).fullName || '',
          email: (decodedToken as any).email || '',
          role: decodedToken.role,
        };

        // ✅ Update Redux state
        state.user = user;
        state.token = action.payload;

        // ✅ Ensure localStorage is synced
        localStorage.setItem('token', action.payload);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('✅ User data set in Redux:', user);
      } catch (error) {
        console.error('❌ Error decoding token:', error);
        state.error = 'Failed to decode authentication token';
      }
    },

    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.signupEmail = null;
      state.signupToken = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('reg_email');
      localStorage.removeItem('reg_password');
      localStorage.removeItem('reg_planId');
      localStorage.removeItem('signup_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    setSignupEmail: (state, action) => {
      state.signupEmail = action.payload;
      localStorage.setItem('reg_email', action.payload);
    },
    clearSignupEmail: (state) => {
      state.signupEmail = null;
      localStorage.removeItem('reg_email');
    },
    setSignupToken: (state, action) => {
      state.signupToken = action.payload;
      localStorage.setItem('signup_token', action.payload);
    },
    setTempPassword: (state, action) => {
      state.tempPassword = action.payload;
    },
    setTempPlanId: (state, action) => {
      state.tempPlanId = action.payload;
    },
    setSelectedCompanyId: (state, action) => {
      state.selectedCompanyId = action.payload;
      localStorage.setItem('selectedCompanyId', action.payload);
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(startSignup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startSignup.fulfilled, (state, action) => {
        state.isLoading = false;
        state.signupEmail = action.payload.email;
        state.signupToken = action.payload.signupToken || null;
        state.error = null;
      })
      .addCase(startSignup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(verifyEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyEmail.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        if (action.payload.email) {
          state.signupEmail = action.payload.email;
        }
        if (action.payload.signupToken) {
          state.signupToken = action.payload.signupToken;
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(setPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.signupToken = null;
      })
      .addCase(setPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.signupEmail = null;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.signupEmail = null;
        state.tempPassword = null;
        state.tempPlanId = null;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(checkAccessStatus.pending, (state) => {
        state.accessStatus = 'LOADING';
      })
      .addCase(checkAccessStatus.fulfilled, (state, action) => {
        state.accessStatus = action.payload.status;
      })
      .addCase(checkAccessStatus.rejected, (state) => {
        // If it fails, default to ACTIVE so we don't break the app due to network errors
        // unless it's a hard 403 which is handled in try/catch block
        state.accessStatus = 'ACTIVE';
      });
  },
});

export const { logout, clearError, setSignupEmail, clearSignupEmail, setSignupToken, setTempPassword, setTempPlanId, setAuthFromToken, setSelectedCompanyId, updateUser } = authSlice.actions;
export default authSlice.reducer;