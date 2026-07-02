import type { AuthTokens } from '../types';
const STORAGE_KEY = 'auth:session';

export const getAuthSession = (): AuthTokens | null => {
    const session = localStorage.getItem(STORAGE_KEY);
    if (!session) {
        return null;
    }

    try {
        return JSON.parse(session) as AuthTokens;
    } catch {
        clearAuthSession();
        return null;
    }
};

export const setAuthSession = (session: AuthTokens) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = (): void => {
    localStorage.removeItem(STORAGE_KEY);
};