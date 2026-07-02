export type ItemStatus = 'open' | 'in_progress' | 'done';
export type ItemPriority = 1 | 2 | 3 | 4 | 5;

export type Item = {
    id: string;
    name: string;
    status: ItemStatus;
    priority: ItemPriority;
    updatedAt: number;
}

export type ItemPayload = {
    name: string;
    status?: ItemStatus;
    priority?: ItemPriority;
}

export type AuthAccessToken = {
    accessToken: string;
    accessExpiresAt: number;
}

type AuthSessionToken = {
    sessionToken: string;
    sessionExpiresAt: number;
}

export type AuthTokens = AuthAccessToken & AuthSessionToken;