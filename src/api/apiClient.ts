import type {
    Item,
    CreateItemPayload,
    UpdateItemPayload,
    UpdateItemsPayload,
    AuthTokens,
} from '../types';
import { isUnauthorized } from '../lib/errors';
import { mockApi } from './mockApi';

type SessionListener = (session: AuthTokens | null) => void;

class ApiClient {
    // the session is the user's session data
    private session: AuthTokens | null = null;

    // listeners to notify when the session changes
    private listeners = new Set<SessionListener>();

    // promise to refresh the access token
    private refreshPromise: Promise<void> | null = null;

    getSession(): AuthTokens | null {
        // return a copy of the session to avoid mutating the original object
        return this.session ? { ...this.session } : null;
    }

    private setSession(session: AuthTokens | null) {
        this.session = session;

        // notify listeners about the session change
        this.listeners.forEach((listener) => listener(session));
    }

    // subscribe to session changes
    subscribe(listener: SessionListener) {
        this.listeners.add(listener);

        return () => {
            this.listeners.delete(listener);
        };
    }

    private handleRefreshFailure() {
        this.setSession(null);
        window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    private async refreshAccessToken(): Promise<void> {
        const currentSession = this.getSession();
        // check if there is an active session
        if (!currentSession) {
            throw new Error('No active session');
        }

        // if no refresh promise is in progress, create a new one
        // it is a place where we prevent additional requests
        // only one refresh runs even if multiple calls fail
        if (!this.refreshPromise) {
            // create a new promise to refresh the access token
            this.refreshPromise = mockApi
                .refreshAccessToken(currentSession.sessionToken)
                .then((session) => {
                    const latestSession = this.getSession();
                    if (!latestSession) {
                        return;
                    }

                    this.setSession({
                        ...latestSession,
                        accessToken: session.accessToken,
                        accessExpiresAt: session.accessExpiresAt,
                    });
                })
                .catch((error) => {
                    this.handleRefreshFailure();
                    throw error;
                })
                .finally(() => {
                    this.refreshPromise = null;
                });
        }

        // if request already in progress, we use the same promise to avoid multiple requests
        return this.refreshPromise;
    }

    // Generic helper function to add authentication to the request
    private async withAuth<T>(
        request: (accessToken: string | undefined) => Promise<T>,
        // check if the request has been retried to avoid infinite loop
        hasRetried = false,
    ): Promise<T> {
        // get 401 error and refresh the token
        if (!this.getSession()) {
            throw new Error('Not logged in');
        }

        try {
            return await request(this.getSession()?.accessToken);
        }
        catch (error) {
            // if the error is not a 401 or the request has been retried, throw the error
            if (!isUnauthorized(error) || hasRetried) {
                throw error;
            }

            await this.refreshAccessToken();
            // here we set the hasRetried to true to avoid infinite loop of retries
            // we allow only one retry in case of repeated 401 errors
            return this.withAuth(request, true);

        }
    }

    async login(username: string, password: string): Promise<AuthTokens> {
        const session = await mockApi.login(username, password);
        this.setSession(session);

        return session;
    }

    async logout(): Promise<void> {
        this.setSession(null);
    }

    async getItems(): Promise<Item[]> {
        return this.withAuth((accessToken) => mockApi.getItems(accessToken));
    }

    async createItem(payload: CreateItemPayload): Promise<Item> {
        return this.withAuth((accessToken) => mockApi.createItem(accessToken, payload));
    }

    async updateItem(id: string, payload: UpdateItemPayload): Promise<Item> {
        return this.withAuth((accessToken) => mockApi.updateItem(accessToken, id, payload));
    }

    async updateItems(ids: string[], payload: UpdateItemsPayload): Promise<Item[]> {
        return this.withAuth((accessToken) => mockApi.updateItems(accessToken, ids, payload));
    }

    async deleteItem(id: string): Promise<{ id: string }> {
        return this.withAuth((accessToken) => mockApi.deleteItem(accessToken, id));
    }

    async deleteItems(ids: string[]): Promise<{ ids: string[] }> {
        return this.withAuth((accessToken) => mockApi.deleteItems(accessToken, ids));
    }
}

export const apiClient = new ApiClient();
