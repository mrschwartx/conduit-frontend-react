# Notes

## Verification status (read this first)

This code base was written in an environment **without network access**, so `npm install` could not
run. Consequently none of the following has been executed yet:

- `npm install` / `npm run gen:api`
- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`
- manual and Playwright runs against a real backend on :8080

What *was* checked offline: every `.ts/.tsx` file parses, every local import resolves to an
existing module and exports the imported names, and there are no unused imports/locals. The tests
were written against the components' real markup and reviewed by hand, but expect to fix a few
small things on the first real run (most likely candidates: exact library typings after
`npm install`, and timing in the async tests). Run in this order: `npm install && npm run typecheck
&& npm run lint && npm test && npm run build`, then start a backend and click through the app.

Also missing: `package-lock.json` (the scaffold's lock file only listed the template's
dependencies, so it was removed; `npm install` creates a new one), the Dockerfile and CI workflow in
the scaffold are still empty files.

## Understanding of the contract

JSON-only, camelCase, enveloped payloads; JWT in `Authorization: Token <jwt>`; errors always
`{"errors": {field: [messages]}}`; offset/limit pagination (UI page size 10); partial updates for
`PUT /user` and `PUT /articles/{slug}`; `/articles/feed` is static and distinct from
`/articles/{slug}`. The generated schema is the single source for types
(`src/api/types.ts` only derives aliases from it).

## Ambiguities and spec defects (with the assumption taken)

1. **Validation rules are not in `openapi.yml`** (no lengths, patterns, formats; only in the
   prompt). The client mirrors the prompt for fast feedback; the server stays the authority and
   its 422 messages are always shown.
2. **Optional-auth endpoints and 401.** The spec lists no 401 for `GET /articles/{slug}`,
   `GET /tags` etc., but an invalid/expired token must give 401. Assumption: the interceptor
   handles a 401 from any endpoint the same way (except login/register).
3. **Undocumented statuses.** 400, 403 (some endpoints), 409 (some), 415 and 500 are missing from
   several operations. Handled generically from the status code and the error body.
4. **`GET /user` documents a 422**, which cannot occur. Ignored.
5. **`POST /articles` documents a 409** although slug collisions are resolved server side
   (`-2`, `-3`). Any 409 there is shown as a form-level message.
6. **`UpdateUser`/`UpdateArticle` look identical to the create schemas but with all fields
   optional**; "at least one field" is only prose. The client never sends an empty update (settings
   shows a message; the editor skips the request).
7. **List items have no `body`** (inline schema in `MultipleArticlesResponse`) while `Article`
   requires it. `ArticleListItem` is derived from the list response and a full `Article` is used
   where it is a superset.
8. **`limit` defaults to 20 in the spec**; the UI always sends `limit=10&offset=page*10`.
9. **Error key naming.** `Forbidden`/`NotFound` examples use `resource`, the prompt says the key is
   the resource type (`article`, `comment`, `profile`). Not relied upon: any non-field key becomes
   a form-level message built as "<Key> <message>".
10. **`/health` is outside the contract file** and is not used by the frontend.

## Decisions

- **React Router 7** (declarative `createBrowserRouter`). A v8 major exists; migration notes could
  not be checked offline, so the proven API was kept. Route objects live in `app/routes.tsx` and
  are reused by the tests with `createMemoryRouter`.
- **Extra `/logout` route.** Logging out from inside a guarded page races the guard (the guard
  would bounce to `/login` before navigating to `/`). `/logout` is unguarded: it ends the session,
  shows "You've been logged out successfully!" and redirects to `/`. The Settings button navigates
  there. This is the only route beyond the listed pages.
- **Tab and page live in the URL** on the home page (`?feed=global`, `?tag=x`, `?page=2`) so Back,
  Forward and reload work. Profile pages keep the page number in component state.
- **401 redirect** is installed once (`app/session-guard.ts`); it also shows a toast, and skips the
  redirect when already on `/login`.
- **Toasts** are a tiny external store (`shared/toast`) so mutation callbacks and the Axios
  interceptor can raise them without a provider. One always-mounted `role="status"` region.
- **Favorite success** marks article lists stale with `refetchType: 'none'` so the server's answer
  is not immediately overwritten by a refetch; lists refresh next time they are shown.
- **Form schemas contain only string/array fields** (no transforms or coercion) so react-hook-form
  input and output types are identical; conversion to API payloads happens in
  `settings-patch.ts` and `article-payload.ts` (both unit tested).
- **Visuals** reuse the legacy app's `globals.css` for parity, plus skeleton, toast-error and
  screen-reader helpers. Dark mode comes from `prefers-color-scheme`.
- The `react-hooks` ESLint plugin (v7) may print *warnings* about react-hook-form's `useForm`
  ("incompatible library"); they are informational and do not fail `npm run lint`.

## Dependencies beyond the scaffold (and why)

| Package                        | Why                                                         |
| ------------------------------ | ----------------------------------------------------------- |
| `@tanstack/react-query`        | server state, caching, optimistic updates (required)        |
| `axios`                        | HTTP client with interceptors (required)                    |
| `react-router`                 | routing (v7 ships the DOM API in this package)              |
| `react-hook-form`, `zod`, `@hookform/resolvers` | forms and client-side validation (required) |
| `openapi-typescript`           | types generated from the contract (required)                |
| `vitest`, `jsdom`, `@testing-library/*`, `msw` | unit/component tests (required)             |
| `@playwright/test`             | optional e2e journey                                        |
| `prettier`                     | formatting (required)                                       |

## Backend-specific behaviour worked around

None observed yet, because no backend could be reached while writing this. If a backend needs a
frontend hack to work, that is a contract gap: record it here instead of patching the frontend.
