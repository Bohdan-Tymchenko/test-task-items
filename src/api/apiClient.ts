import type {
    Item,
    ItemPayload,
    AuthTokens,
} from '../types';
import { isUnauthorized } from '../lib/errors';
import { mockApi } from './mockApi';

class ApiClient {
    // the session is the user's session data
    private session: AuthTokens | null = null;

    // if request already in progress, we use the same promise to avoid multiple requests
    private refreshPromise: Promise<void> | null = null;

    private async refreshAccessToken(): Promise<void> {
        // check if there is an active session
        if (!this.session) {
            throw new Error('No active session');
        }

        // if no refresh promise is in progress, create a new one
        // it is a place where we prevent additional requests
        // only one refresh runs even if multiple calls fail
        if (!this.refreshPromise) {
            // create a new promise to refresh the access token
            this.refreshPromise = mockApi
                .refreshAccessToken(this.session.sessionToken)
                .then((session) => {
                    if (!this.session) {
                        return;
                    }

                    this.session = {
                        ...this.session,
                        accessToken: session.accessToken,
                        accessExpiresAt: session.accessExpiresAt,
                    };
                })
                .finally(() => {
                    this.refreshPromise = null;
                });
        }

        // return the promise to wait for the refresh to complete
        return this.refreshPromise;


    }

    // Generic helper function to add authentication to the request
    private async withAuth<T>(
        request: (accessToken: string | undefined) => Promise<T>,
        // check if the request has been retried to avoid infinite loop
        hasRetried = false,
    ): Promise<T> {
        // get 401 error and refresh the token
        if (!this.session) {
            throw new Error('Not logged in');
        }

        try {
            return request(this.session?.accessToken);
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
        this.session = session;

        return session;
    }

    async logout(): Promise<void> {
        this.session = null;
    }

    async getItems(): Promise<Item[]> {
        return this.withAuth((accessToken) => mockApi.getItems(accessToken));
    }

    async createItem(payload: ItemPayload): Promise<Item> {
        return this.withAuth((accessToken) => mockApi.createItem(accessToken, payload));
    }

    async updateItem(id: string, payload: ItemPayload): Promise<Item> {
        return this.withAuth((accessToken) => mockApi.updateItem(accessToken, id, payload));
    }

    async updateItems(ids: string[], payload: ItemPayload): Promise<Item[]> {
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
