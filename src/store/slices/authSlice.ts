import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import api from '../../api/axios';

interface User {
    id: string;
    email: string;
    role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}

// Check local storage for existing token
const token = localStorage.getItem('token');
const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null;

const initialState: AuthState = {
    user: user,
    token: token,
    isAuthenticated: !!token,
    loading: false,
    error: null,
};

interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token: string;
    };
}

interface LoginPayload {
    email: string;
    password: string;
}

export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginPayload, { rejectWithValue }) => {
        try {
            const response = await api.post<LoginResponse>('/auth/login', credentials);
            return response.data;
        } catch (error: any) {
            if (error.response && error.response.data) {
                return rejectWithValue(error.response.data.message || 'Login failed');
            }
            return rejectWithValue(error.message || 'Login failed');
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
            state.isAuthenticated = false;
            state.error = null;
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action: PayloadAction<LoginResponse>) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.user = action.payload.data.user;
                state.token = action.payload.data.token;
                localStorage.setItem('token', action.payload.data.token);
                localStorage.setItem('user', JSON.stringify(action.payload.data.user));
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
