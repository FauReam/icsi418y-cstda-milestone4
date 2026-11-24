# Architecture and API

The browser uses React components for the M3 UI screens. `/api` requests use a same-origin HttpOnly session cookie. Vite proxies `/api` during development; the Express server serves `client/dist` after a build. MongoDB is mandatory: there is no in-memory or localStorage substitute for saved records.

## Collections

| Store | Collection and important fields | Constraints |
|---|---|---|
| D1 | `users`: `_id`, `username`, `password_hash` | Lowercase unique username; salted scrypt hash. Accounts provisioned by seed. |
| D2 | `tabs`: `_id`, `user_id`, `name`, `name_key`, `default_color` | Account-scoped unique lowercase name; General provisioned initially. |
| D3 | `events`: `_id`, `tab_id`, `title`, `date`, `start_time`, `end_time`, `color_override` | Ownership through Tab; indexed by tab/date; single-day validation. |
| D4 | `tasks`: `_id`, `user_id`, `title`, `priority`, `is_completed` | Owner index; validated priority and Boolean completion. |
| Supporting | `sessions`: `_id` token digest, `user_id`, `expires_at` | Eight-hour expiry checked per request; TTL cleanup; logout removes record. |

MongoDB does not enforce foreign keys. Routes enforce the M3 ownership and reference rules before writes. The MVP has no tab/account deletion routes, so those references cannot become orphaned through the API. Event reassignment is one document update after ownership checks; `tab_id` replaces the previous membership. Full-record PUT requests are validated before writing and ignore server-managed identity/ownership fields.

## Routes

| Method and route | Request / result |
|---|---|
| `GET /api/health` | Public status and database ping. |
| `POST /api/auth/login` | `{username,password}` → `{user:{username}}`; sets session cookie. |
| `GET /api/auth/me` | Current public account identity. |
| `POST /api/auth/logout` | Invalidates session and clears cookie. |
| `GET /api/palette` | Approved palette values. |
| `GET /api/tabs` | Own tabs. |
| `POST /api/tabs` | `{name,default_color}` → new tab. |
| `PUT /api/tabs/:id/color` | `{default_color}` → updated own tab. |
| `GET /api/events` | Own events with `effective_color`. Optional `tab_id`, or inclusive `from` and `to` ISO date filters. |
| `POST /api/events` | `{title,date,start_time,end_time?,tab_id,color_override?}` → event. |
| `PUT /api/events/:id` | Full event form; supports changing tab and clearing override with null. |
| `DELETE /api/events/:id` | Remove own event; 204. |
| `GET /api/tasks` | Own tasks independent of tabs. |
| `POST /api/tasks` | `{title,priority?,is_completed?}` → task. |
| `PUT /api/tasks/:id` | Full task form, including priority/completion. |
| `DELETE /api/tasks/:id` | Remove own task; 204. |

All routes except login/health require authentication. Errors use `{message}` with 400 validation, 401 authentication, 404 unavailable/unowned record, 409 duplicate tab, 429 login limit, or 500 storage/server error. The frontend retains forms on failed writes and reloads canonical server data after successful writes. It does not optimistically mark checkboxes completed. Cancel writes nothing; deletion requires an explicit confirmation.

No cross-account sharing, recurrence, signup, password reset, or tab deletion is exposed. Concurrency uses last valid write wins; collaborative editing and conflict resolution are outside the prototype scope. A save response lost to a network failure can be ambiguous; inspect saved state before repeating creation.
