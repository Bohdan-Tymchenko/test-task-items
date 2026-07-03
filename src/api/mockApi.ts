import { ApiError } from '../lib/errors';
import type {
    Item,
    ItemStatus,
    ItemPriority,
    CreateItemPayload,
    UpdateItemPayload,
    UpdateItemsPayload,
    AuthTokens,
    AuthAccessToken,
} from '../types';

const ACCESS_TTL_MS = 30_000; // 30 seconds
const SESSION_TTL_MS = 5 * 60_000; // 5 minutes

type AccessRecord = {
    sessionToken: string;
    expiresAt: number;
};

type SessionRecord = {
    expiresAt: number;
};

// MOCKED ITEMS
function createItem(name: string, status: ItemStatus, priority: ItemPriority) {
    return {
        id: crypto.randomUUID(),
        name,
        status,
        priority,
        updatedAt: Date.now(),
    };
}

export let items: Item[] = [
    createItem('A Item 1', 'open', 1),
    createItem('B Item 2', 'in_progress', 2),
    createItem('C Item 3', 'done', 3),
    createItem('C Item 4', 'open', 4),
];

// MOCKED TOKENS
// In-memory storage for access tokens.
// access token -> expires at
const accessTokens = new Map<string, AccessRecord>();

// In-memory storage for session tokens.
// session token -> expires at
const sessions = new Map<string, SessionRecord>();

function createAccessToken(sessionToken: string) {
    const accessToken = `access_${crypto.randomUUID()}`;
    const accessExpiresAt = Date.now() + ACCESS_TTL_MS;
    accessTokens.set(accessToken, {
        sessionToken,
        expiresAt: accessExpiresAt,
    });

    return { accessToken, accessExpiresAt };
}

function createSession() {
    const sessionToken = `session_${crypto.randomUUID()}`;
    const sessionExpiresAt = Date.now() + SESSION_TTL_MS;
    sessions.set(sessionToken, { expiresAt: sessionExpiresAt });

    return { sessionToken, sessionExpiresAt };
}


async function delay() {
    // 250-700ms delay
    const duration = 250 + Math.floor(Math.random() * 450);

    return new Promise(resolve => setTimeout(resolve, duration));
}

function randomFakeFailure() {
    // 5% chance of failure
    if (Math.random() < 0.05) {
        throw new ApiError(500, 'Immitation failure');
    }
}

// Validate access token and session token
function validateAccess(accessToken?: string) {
    if (!accessToken) {
        throw new ApiError(401, 'Missing access token');
    }

    const token = accessTokens.get(accessToken);
    if (!token || token.expiresAt <= Date.now()) {
        accessTokens.delete(accessToken);
        throw new ApiError(401, 'Access token expired or invalid');
    }

    const session = sessions.get(token.sessionToken);
    if (!session || session.expiresAt <= Date.now()) {
        sessions.delete(token.sessionToken);
        accessTokens.delete(accessToken);
        throw new ApiError(401, 'Session expired or invalid');
    }
}


// Validate session token
function validateSession(sessionToken?: string) {
    if (!sessionToken) {
        throw new ApiError(401, 'Missing session token');
    }

    const session = sessions.get(sessionToken);
    if (!session || session.expiresAt <= Date.now()) {
        sessions.delete(sessionToken);
        throw new ApiError(401, 'Session token expired or invalid');
    }
}

// Support required verification item fileds by requirements
function normalizePayload<T extends CreateItemPayload | UpdateItemPayload | UpdateItemsPayload>(payload: T, existing?: Item): T {
    const newName = payload.name ?? existing?.name;
    if (newName !== undefined) {
        const trimmed = newName.trim();
        if (trimmed.length < 2 || trimmed.length > 60) {
            throw new ApiError(400, 'Name must be between 2 and 60 characters');
        }
        payload.name = trimmed;
    }

    if (payload.priority !== undefined && ![1, 2, 3, 4, 5].includes(payload.priority)) {
        throw new ApiError(400, 'Priority must be between 1 and 5');
    }

    if (
        payload.status !== undefined &&
        !['open', 'in_progress', 'done'].includes(payload.status)
    ) {
        throw new ApiError(400, 'Unsupported status');
    }

    return payload;
}

export const mockApi = {
    async login(username: string, password: string): Promise<AuthTokens> {
        await delay();

        if (username !== 'test' || password !== '123') {
            throw new ApiError(401, 'Incorrect username or password');
        }

        const { sessionToken, sessionExpiresAt } = createSession();
        const { accessToken, accessExpiresAt } = createAccessToken(sessionToken);

        return { sessionToken, sessionExpiresAt, accessToken, accessExpiresAt };
    },

    async refreshAccessToken(sessionToken: string): Promise<AuthAccessToken> {
        await delay();
        validateSession(sessionToken);

        const { accessToken, accessExpiresAt } = createAccessToken(sessionToken);

        return { accessToken, accessExpiresAt };
    },

    async getItems(accessToken: string | undefined): Promise<Item[]> {
        await delay();
        validateAccess(accessToken);
        randomFakeFailure();

        return [...items];
    },

    async createItem(accessToken: string | undefined, payload: CreateItemPayload): Promise<Item> {
        await delay();
        validateAccess(accessToken);
        randomFakeFailure();

        const normalizedPayload = normalizePayload(payload);

        const newItem = createItem(
            normalizedPayload.name,
            normalizedPayload.status ?? 'open',
            normalizedPayload.priority ?? 3,
        );

        items = [...items, newItem];

        return newItem;
    },

    async updateItem(accessToken: string | undefined, id: string, payload: UpdateItemPayload): Promise<Item> {
        await delay();
        validateAccess(accessToken);
        randomFakeFailure();

        const current = items.find((item) => item.id === id);
        if (!current) {
            throw new ApiError(404, 'Item not found');
        }

        const normalized = normalizePayload({ ...payload }, current);
        const updatedItem = {
            ...current,
            ...normalized,
            updatedAt: Date.now(),
        };

        items = items.map((item) => (item.id === id ? updatedItem : item));

        return updatedItem;
    },

    async updateItems(accessToken: string | undefined, ids: string[], payload: UpdateItemsPayload): Promise<Item[]> {
        await delay();
        validateAccess(accessToken);
        randomFakeFailure();

        const allItemsIds = new Set(ids);
        const now = Date.now();
        const updatedItems: Item[] = [];

        items = items.map((item) => {
            if (!allItemsIds.has(item.id)) {
                return item;
            }

            const normalized = normalizePayload({ ...payload }, item);
            const updated = { ...item, ...normalized, updatedAt: now };
            updatedItems.push(updated);
            return updated;
        });

        return updatedItems;
    },

    async deleteItem(accessToken: string | undefined, id: string): Promise<{ id: string }> {
        await delay();
        validateAccess(accessToken);
        randomFakeFailure();

        const exists = items.some((item) => item.id === id);
        if (!exists) {
            throw new ApiError(404, 'Item not found');
        }

        items = items.filter((item) => item.id !== id);
        return { id };
    },

    async deleteItems(accessToken: string | undefined, ids: string[]): Promise<{ ids: string[] }> {
        await delay();
        validateAccess(accessToken);
        randomFakeFailure();

        const allItemsIds = new Set(ids);
        items = items.filter((item) => !allItemsIds.has(item.id));
        return { ids };
    },
};
