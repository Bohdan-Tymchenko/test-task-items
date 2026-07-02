import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthTokens } from '../../types';
import { apiClient } from '../../api/apiClient';

export type LoginCredentials = {
    username: string;
    password: string;
};

type AuthState = {
    session: AuthTokens | null;
    isSubmitting: boolean;
    error: string;
};

const initialState: AuthState = {
    session: apiClient.getSession(),
    isSubmitting: false,
    error: '',
};

export const loginThunk = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials) => {
        const session = await apiClient.login(credentials.username, credentials.password);
        return session;
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        sessionChanged: (state, action: PayloadAction<AuthTokens | null>) => {
            state.session = action.payload;
        },
        logout: (state) => {
            apiClient.logout();
            state.session = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(loginThunk.pending, (state) => {
                state.isSubmitting = true;
                state.error = '';
            })
            .addCase(loginThunk.fulfilled, (state, action) => {
                state.isSubmitting = false;
                state.session = action.payload;
            })
            .addCase(loginThunk.rejected, (state, action) => {
                state.isSubmitting = false;
                state.error = action.error.message ?? 'Could not sign in';
            });
    },
});

export const authReducer = authSlice.reducer;
export const { logout, sessionChanged } = authSlice.actions;