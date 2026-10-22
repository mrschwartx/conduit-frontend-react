# Conduit frontend (React)

A single-page app for [Conduit](https://github.com/realworld-apps/realworld) (a Medium-style
blogging platform). It depends **only** on the OpenAPI contract in
[`../conduit-openapi/openapi.yml`](../conduit-openapi/openapi.yml), so it runs unchanged against any
backend implementation (Spring, Go/Echo, FastAPI, .NET) listening on port 8080.

Stack: React 19, TypeScript (strict), Vite, TanStack Query v5, Axios, React Router 7,
react-hook-form + zod, openapi-typescript, Vitest + React Testing Library + MSW, Playwright.

## Prerequisites

- Node.js 22 or newer and npm
- A Conduit backend on `http://localhost:8080` (needed to use the app and for the e2e test, not for
  the unit/component tests)

## Install

```bash
npm install
```

`postinstall` generates the API types into `src/api/schema.d.ts` from the contract. That file is
git-ignored; it is regenerated before `dev`, `build`, `typecheck` and `test`
(`npm run gen:api` runs it by hand). The generated types are the only description of the API in
the code base.

## Configuration

| Variable            | Default   | Meaning                                    |
| ------------------- | --------- | ------------------------------------------ |
| `VITE_API_BASE_URL` | `/api/v1` | API base URL, read at **build time**       |

See `.env.example`. Keep the default so the browser stays same-origin: in development the Vite dev
server proxies `/api` to `http://localhost:8080` (no CORS needed); in production serve the build
behind a reverse proxy that forwards `/api` to the backend. Switching backend needs no frontend
change.

## Scripts

```bash
npm run dev          # dev server on http://localhost:5173 (proxies /api -> :8080)
npm run build        # typecheck + production build in dist/
npm run preview      # serve the production build locally
npm run typecheck    # tsc -b
npm run lint         # eslint
npm run format       # prettier --write .
npm test             # unit + component tests (Vitest, RTL, MSW) - no backend needed
npm run test:watch
npm run test:e2e     # Playwright journey; needs a backend on :8080
```

First time with Playwright: `npx playwright install chromium`.

## Project layout

```
src/app        providers, router, layout, nav, error boundary, session handling
src/api        Axios client, error mapping, query keys, types derived from the generated schema
src/features   auth | articles | profiles | comments  ->  api/ hooks/ components/ pages/
src/shared     ui primitives, hooks, validation schemas, toasts, config, utils
src/test       MSW server and handlers, typed fixtures, render helper
e2e            Playwright journey
```

## How it behaves

- Auth header is `Authorization: Token <jwt>` (not `Bearer`). The JWT is kept in `localStorage`
  under `conduit_token`, touched only by `src/features/auth/token.ts`.
- A 401 from any endpoint except `/users/login` and `/users` clears the token, resets the query
  cache and redirects to `/login`.
- Server `{"errors": {...}}` bodies are mapped onto form fields (422/409) or shown as form-level
  messages (`credentials`, `token`, `article`, ...). Network failures and 5xx show a toast.
- Favorite/unfavorite and follow/unfollow update the UI optimistically and roll back on error; the
  server response is the final truth.
- Article text, descriptions and comments are rendered as plain text. Avatars load only from
  `https` URLs, with a default fallback.

See `NOTES.md` for design decisions, contract ambiguities and the verification status.
