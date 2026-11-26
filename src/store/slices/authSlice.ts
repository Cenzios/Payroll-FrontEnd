import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axiosInstance from '../../api/axios';
import { bootstrapSession, loginUser, logout } from './sessionThunks';
import type { AuthSession } from '../../auth/authSession.types';
import {
  clearSignupIdentity,
  clearUserFlowStorage,
  readSignupIdentity,
  saveSignupIdentity,
} from '../../auth/userFlowStorage';

import {
  AuthState,
  StartSignupRequest,
  StartSignupResponse,
  VerifyEmailResponse,
  SetPasswordRequest,
  SetPasswordResponse,
  User,
  ResendVerificationRequest,
  ResendVerificationResponse,
} from '../../types/auth.types';

// Auth identity is NOT persisted: the access token lives in memory
// (src/auth/tokenStore.ts) and the session is restored on boot via
// POST /auth/refresh (see bootstrapSession). The signup token only ever comes
// from the emailed /verify-email link and is kept in memory. The signup
// name/email (not secrets) are kept in sessionStorage so "resend" survives a reload.
const signupIdentity = readSignupIdentity();

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  bootstrapStatus: 'pending',
  signupToken: null,
  signupEmail: signupIdentity?.email ?? null,
  signupFullName: signupIdentity?.fullName ?? null,
  isLoading: false,
  error: null,
  tempPassword: null,
  tempPlanId: null,
  selectedCompanyId: localStorage.getItem('selectedCompanyId') || null,
  accessStatus: 'LOADING', // 'LOADING' | 'ACTIVE' | 'BLOCKED'
};


export const startSignup = createAsyncThunk(
  'auth/startSignup',
  async (userData: StartSignupRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<StartSignupResponse>(
        '/auth/start-signup',
        userData
      );
      saveSignupIdentity({ fullName: userData.fullName, email: userData.email });
      return {
        email: userData.email,
        fullName: userData.fullName,
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

export const resendVerificationEmail = createAsyncThunk(
  'auth/resendVerificationEmail',
  async (data: ResendVerificationRequest, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post<ResendVerificationResponse>(
        '/auth/resend-verification',
        data
      );
      return { message: response.data.message };
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to resend verification email';
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
      const code = error.response?.data?.data?.code ?? error.response?.data?.code;
      if (error.response?.status === 403 && code === 'SUBSCRIPTION_BLOCKED') {
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
      const response = await axiosInstance.get<VerifyEmailResponse>('/auth/verify-email', {
        params: { token },
      });
      // The emailed token (from the link the user opened) is kept in memory for set-password
      return {
        message: response.data.message,
        email: response.data.data?.email,
        signupToken: token,
      };
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

/** Clears the in-memory identity. */
function clearIdentity(state: AuthState): void {
  state.user = null;
  state.isAuthenticated = false;
}

/** Explicit logout: clears identity, signup state and every per-user flow key in storage. */
function clearAuthState(state: AuthState): void {
  clearIdentity(state);
  state.error = null;
  state.signupEmail = null;
  state.signupFullName = null;
  state.signupToken = null;
  state.tempPassword = null;
  state.tempPlanId = null;
  clearUserFlowStorage();
  // The selected company belongs to this user; never carry it into the next session
  state.selectedCompanyId = null;
  localStorage.removeItem('selectedCompanyId');
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {

    /** Called whenever /auth/refresh (bootstrap or interceptor) yields a session. */
    sessionEstablished: (state, action: PayloadAction<AuthSession>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    /** Called when the session can no longer be refreshed. */
    sessionCleared: (state) => {
      clearIdentity(state);
    },
    clearError: (state) => {
      state.error = null;
    },
    setSignupEmail: (state, action: PayloadAction<string | null>) => {
      state.signupEmail = action.payload;
    },
    clearSignupEmail: (state) => {
      state.signupEmail = null;
      state.signupFullName = null;
      clearSignupIdentity();
    },
    setSignupToken: (state, action) => {
      state.signupToken = action.payload;
    },
    setTempPassword: (state, action) => {
      state.tempPassword = action.payload;
    },
    setTempPlanId: (state, action) => {
      state.tempPlanId = action.payload;
    },
    setSelectedCompanyId: (state, action: PayloadAction<string>) => {
      // Ignore late dispatches from pages still mounted during logout: a company id
      // must never be stored while nobody is signed in.
      if (!state.isAuthenticated) return;
      state.selectedCompanyId = action.payload;
      localStorage.setItem('selectedCompanyId', action.payload);
    },
    clearSelectedCompanyId: (state) => {
      state.selectedCompanyId = null;
      localStorage.removeItem('selectedCompanyId');
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
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
        state.signupFullName = action.payload.fullName;
        state.signupToken = null;
        state.error = null;
      })
      .addCase(startSignup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(resendVerificationEmail.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendVerificationEmail.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendVerificationEmail.rejected, (state, action) => {
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
        clearSignupIdentity();
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
        state.isAuthenticated = true;
        state.signupEmail = null;
        state.signupFullName = null;
        state.signupToken = null;
        clearSignupIdentity();
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed';
      })
      .addCase(logout.pending, (state) => {
        clearAuthState(state);
      })
      .addCase(bootstrapSession.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
        state.bootstrapStatus = 'done';
      })
      .addCase(bootstrapSession.rejected, (state) => {
        state.bootstrapStatus = 'done';
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

export const { sessionEstablished, sessionCleared, clearError, setSignupEmail, clearSignupEmail, setSignupToken, setTempPassword, setTempPlanId, setSelectedCompanyId, clearSelectedCompanyId, updateUser } = authSlice.actions;
export default authSlice.reducer;