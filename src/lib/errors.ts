// 400 - Invalid payload / validation error.
// 401 - Unauthorized / token expired or invalid.
// 404 - Not Found / item not found.
// 500 - imitation failure.

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
    }
}

export const isUnauthorized = (error: unknown) =>
    error instanceof ApiError && error.status === 401;