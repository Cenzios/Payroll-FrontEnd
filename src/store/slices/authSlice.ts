import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';
import {
  AuthState,
  StartSignupRequest,
  StartSignupResponse,
  VerifyEmailResponse,
  SetPasswordRequest,
  SetPasswordResponse,
  LoginRequest,
  LoginResponse,
} from '../../types/auth.types';

const initialState: AuthState = {
  user: localStorage.getItem('user')
    ? JSON.parse(localStorage.getItem('user')!)
    : null,
  token: localStorage.getItem('token') || null,
  signupEmail: null,
  isLoading: false,
  error: null,
};

export const startSignup = createAsyncThunk(
  'auth/startSignup',
  async (userData: StartSignupRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<StartSignupResponse>(
        '/auth/start-signup',
        userData
      );
      return { email: userData.email, message: response.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Signup failed';
      return rejectWithValue(message);
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
      return response.data;
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
        '/auth/set-password',
        data
      );
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
      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { user, token };
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || 'Login failed';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.error = null;
      state.signupEmail = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError: (state) => {
      state.error = null;
    },
    setSignupEmail: (state, action) => {
      state.signupEmail = action.payload;
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
      .addCase(verifyEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
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
      });
  },
});

export const { logout, clearError, setSignupEmail } = authSlice.actions;
export default authSlice.reducer;
