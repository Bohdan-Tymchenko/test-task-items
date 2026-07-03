# Profero Test Task

Vite + React + TypeScript app with a browser-local mock API, auth tokens, refresh flow, and an items table with CRUD-oriented interactions.

## Run Locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite, usually `http://localhost:5173`.

Build check:

```bash
npm run build
```

## Login

Use the hardcoded mock credentials:

- Username: `test`
- Password: `123`

## Routes

- `/login` - login form.
- `/items` - protected items page. Unauthenticated users are redirected to `/login`.

## Features

- Mock API with realistic async delay and random failures.
- Login returns an access token, session token, and expiration timestamps.
- Access token expires after 30 seconds.
- Session token expires after 5 minutes.
- Protected item API methods reject with `401` when the access token is missing, invalid, or expired.
- API client attaches the current access token to protected calls.
- On `401`, the API client performs a single-flight refresh, retries the failed call once, and prevents retry loops.
- On refresh failure, the client clears the session and emits an auth expiration event.
- Items page includes search, selection, bulk status update, bulk delete, single delete, and inline edit.
- Inline edit uses controlled fields with select inputs for `status` and `priority`.
- Row-level item mutations disable only the affected rows while they are saving.

## Architecture Notes

The app uses Redux Toolkit for UI/application state and async thunks for API calls. Reducers keep synchronous state transitions in one place, while thunks call the mock API through the API client wrapper.

The mock API is implemented in `src/api/mockApi.ts`. It stores items, access tokens, and session tokens in module-level memory to simulate a backend during one running app session.

The API client is implemented in `src/api/apiClient.ts`. It owns the current auth session, attaches the access token to protected mock API calls, handles `401` responses, performs single-flight token refresh, and retries the original request once after refresh.

Auth state is intentionally kept in memory to match the in-memory mock API. A full browser refresh resets mock-issued tokens and requires logging in again. Within one app session, access tokens expire after 30 seconds and are refreshed using the 5-minute session token.

With a real backend, a browser refresh would not reset server-side session state. The session/refresh token would typically be stored and validated on the backend, for example in Redis or a database, so the frontend could restore the client session and refresh the access token after reloading the page.

## Item Model

```ts
type Item = {
  id: string;
  name: string;
  status: 'open' | 'in_progress' | 'done';
  priority: 1 | 2 | 3 | 4 | 5;
  updatedAt: number;
};
```

Validation is handled in the mock API:

- `name` is required and must be 2-60 characters.
- `status` must be `open`, `in_progress`, or `done`.
- `priority` must be from `1` to `5`.
