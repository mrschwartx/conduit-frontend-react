# Conduit Frontend (React)

A [RealWorld](https://github.com/realworld-apps/realworld) "Conduit" frontend, a Medium.com-style publishing platform, built as a single-page app organised by **feature**.

The app talks only to the HTTP contract in [`conduit-openapi/openapi.yml`](conduit-openapi/openapi.yml), so any interchangeable Conduit backend (Spring, Go/Echo, FastAPI, .NET) that listens on port 8080 works without a frontend change.

**Stack:** React 19 · TypeScript (strict) · Vite · TanStack Query · Axios · React Router · react-hook-form + zod · Vitest + Testing Library + MSW · Playwright · Docker (nginx) · GitHub Actions

## Contents

- [Quick start](#quick-start)
- [Features](#features)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Routes and API](#routes-and-api)
- [Testing](#testing)
- [Docker](#docker)
- [CI](#ci)
- [Limits](#limits)
- [References](#references)

## Quick start

Requires Node.js 22 and a Conduit backend on port 8080. Without a backend, run the bundled mock API (see below).

```sh
cd conduit-frontend
cp .env.example .env.local
npm ci
npm run dev
```

The app runs at http://localhost:3000. Vite forwards `/api` to `http://localhost:8080`, so the browser stays same-origin and no CORS setup is needed.

| Goal                         | Command                                    |
| ---------------------------- | ------------------------------------------ |
| Run in development           | `npm run dev`                              |
| Run the production build     | `npm run build && npm run preview`         |
| Run a mock backend on :8080  | `npm run mock-api`                         |
| Run with Docker              | `make docker/up` (from `conduit-docker`)   |
| Stop Docker                  | `make docker/down` (from `conduit-docker`) |
| Lint, typecheck, test, build | `npm run verify`                           |

`npm run mock-api` starts an in-memory implementation of the contract (users, articles, comments, favorites, follows, tags). It is meant for demos and for the browser tests, and it forgets everything when stopped.

## Features

- **Authentication**: register (automatic sign-in), sign in, sign out. The JWT is sent as `Authorization: Token <jwt>` and kept in `localStorage`, with an in-memory fallback when storage is unavailable.
- **Session expiry**: a `401` from any endpoint other than login or register clears the session, resets the query cache and redirects to `/login`.
- **Route guards**: guests are redirected away from `/editor` and `/settings`; signed-in users are redirected away from `/login` and `/register`.
- **Settings**: update picture, username, bio, email and password with partial updates.
- **Articles**: create, edit and delete your own articles, tags with an inline tag input, slugs assigned by the server.
- **Feeds**: global feed, personal feed of followed authors, filtering by popular tag, pagination (10 per page).
- **Social**: follow and unfollow authors, favorite and unfavorite articles with cache updates.
- **Comments**: add comments, delete your own comments.
- **Profiles**: authored and favorited articles per user.
- **Platform**: toast messages, loading skeletons, error boundary, per-page document titles, light and dark theme.

## Configuration

| Variable            | Where                      | Default                            | Purpose                                                     |
| ------------------- | -------------------------- | ---------------------------------- | ----------------------------------------------------------- |
| `VITE_API_BASE_URL` | build time (`.env.local`)  | `/api/v1`                          | Base URL of the API. Keep the default to stay same-origin.  |
| `API_PROXY_TARGET`  | shell, `dev` and `preview` | `http://localhost:8080`            | Backend that Vite forwards `/api` to.                       |
| `BACKEND_URL`       | Docker runtime             | `http://host.docker.internal:8080` | Backend that nginx forwards `/api` to inside the container. |
| `PORT`              | Docker Compose             | `3000`                             | Host port published by `docker compose`.                    |
| `E2E_PORT`          | shell, Playwright          | `3000`                             | Port of the app under test.                                 |
| `MOCK_API_PORT`     | shell, mock API            | `8080`                             | Port of the mock API.                                       |
| `MOCK_API_HOST`     | shell, mock API            | `127.0.0.1`                        | Interface the mock API binds to.                            |

The dev server, `vite preview` and the Docker image all serve the app on port **3000**. Vite is configured with `strictPort`, so it fails loudly instead of silently moving to another port.

## Architecture

The app is split by **feature**. Each feature owns its API calls, hooks, components and pages; shared code lives in `shared`, and `app` wires routing and providers.

### Project layout

```
conduit-frontend/
  src/
    api/            Axios instance, error mapping, query keys, contract types
    app/            layout, routes, error boundary, query client, session guard
    features/
      auth/         login, register, settings, token and session handling
      articles/     home feed, article page, editor, favorites, tags
      comments/     comments on an article
      profiles/     profile page and follow button
    shared/         config, hooks, toast store, UI primitives, validation, utils
    styles/         global styles
    test/           MSW server and handlers, factories, render helper, setup
  e2e/              Playwright journeys and the mock API
  nginx/            nginx template used by the Docker image
conduit-docker/     Dockerfile, Compose file and Makefile
conduit-openapi/    the API contract (source of truth, never edited here)
```

### Feature layout

```
features/<name>/
  api/              functions that call the API through the shared Axios instance
  hooks/            TanStack Query queries and mutations
  components/       presentational and interactive components
  pages/            route-level components
  *.ts              pure helpers (payload builders, tag parsing, cache updates)
  *.test.ts(x)      tests next to the code they cover
```

### Design rules

- **One HTTP client.** Only `api/client.ts` creates the Axios instance. It adds the `Authorization: Token` header, omits `Content-Type` on bodyless requests, and turns every failure into a typed `AppError` with per-field messages.
- **Server state lives in TanStack Query.** Query keys are centralised in `api/query-keys.ts`, and mutations update or invalidate the affected caches.
- **One module touches browser storage.** `features/auth/token.ts` owns the token key, so storage failures are handled in one place.
- **Forms are validated twice.** zod schemas give instant client-side feedback; server `422` field errors are mapped back onto the same fields.
- **The contract wins.** Types in `api/types.ts` follow `openapi.yml`; if they disagree, the OpenAPI file is right.

## Routes and API

### Pages

| Route                                                | Purpose                                               | Access    |
| ---------------------------------------------------- | ----------------------------------------------------- | --------- |
| `/`                                                  | Home with global feed, personal feed and popular tags | everyone  |
| `/login`, `/register`                                | Authentication                                        | guests    |
| `/settings`                                          | Account settings and sign out                         | signed in |
| `/editor`, `/editor/:slug`                           | Create or edit an article                             | signed in |
| `/article/:slug`                                     | Article with comments                                 | everyone  |
| `/profile/:username`, `/profile/:username/favorites` | Author profile                                        | everyone  |
| `/logout`                                            | Ends the session                                      | everyone  |

The nginx image also serves `GET /ping` (plain text `OK`) as a health check.

### Backend contract

All endpoints live under `/api/v1`. Payloads are JSON envelopes and errors use `{ "errors": { "<field>": ["message"] } }`.

| Method and path                                   | Auth     | Success  |
| ------------------------------------------------- | -------- | -------- |
| `POST /users`, `POST /users/login`                | none     | 201, 200 |
| `GET /user`, `PUT /user`                          | required | 200      |
| `GET /profiles/:username`                         | optional | 200      |
| `POST`, `DELETE /profiles/:username/follow`       | required | 200      |
| `GET /articles?tag&author&favorited&offset&limit` | optional | 200      |
| `GET /articles/feed?offset&limit`                 | required | 200      |
| `POST /articles`                                  | required | 201      |
| `GET /articles/:slug`                             | optional | 200      |
| `PUT`, `DELETE /articles/:slug`                   | required | 200, 204 |
| `POST`, `DELETE /articles/:slug/favorite`         | required | 200      |
| `GET /articles/:slug/comments`                    | optional | 200      |
| `POST /articles/:slug/comments`                   | required | 201      |
| `DELETE /articles/:slug/comments/:id`             | required | 204      |
| `GET /tags`                                       | none     | 200      |

### Error statuses

| Error                             | Status |
| --------------------------------- | ------ |
| Malformed JSON                    | `400`  |
| Missing, invalid or expired token | `401`  |
| Not the owner                     | `403`  |
| No record                         | `404`  |
| Duplicate email or username       | `409`  |
| Unsupported content type          | `415`  |
| Validation                        | `422`  |

## Testing

| Layer         | Command                 | What it proves                                                                                           |
| ------------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Unit          | `npm run test:unit`     | API client, error mapping, payload builders, tag parsing, settings patches and validation schemas        |
| UI            | `npm run test:ui`       | Pages and components in jsdom against MSW handlers: home feed, editor, favorites, follow, comments, auth |
| Coverage      | `npm run test:coverage` | Runs both layers with V8 coverage and writes `coverage/` (text, summary and `lcov`)                      |
| E2E (browser) | `npm run test:e2e`      | Playwright journeys in Chromium against the production build, served by `vite preview` on port 3000      |

`npm run verify` runs lint, typecheck, coverage and the build.

The browser tests need Chromium once: `npx playwright install chromium`. They start the mock API on port 8080 unless a backend is already listening there, so the same journeys also run against a real backend (`npm run test:e2e` reuses it).

### Conventions

- Tests sit next to the code they cover as `*.test.ts` (unit) and `*.test.tsx` (UI); Vitest runs them as the `unit` and `ui` projects.
- Network calls are intercepted by MSW with `onUnhandledRequest: 'error'`, so a test that calls an undeclared endpoint fails instead of passing silently.
- Payloads in factories are typed with `src/api/types.ts`, so a contract change that tests do not follow fails the typecheck.
- Coverage is reported but has no threshold yet; set `test.coverage.thresholds` in `vite.config.ts` once a baseline run shows the numbers you want to protect.

## Docker

The image is built in two stages: Node builds the Vite bundle, then an unprivileged nginx serves it.

- Port **3000**, running as a non-root user.
- Static assets under `/assets/` are cached for a year; everything else falls back to `index.html` so deep links work.
- `/api/` is forwarded to `BACKEND_URL`, which keeps the browser same-origin and avoids CORS.
- `/ping` answers `OK` and backs the container health check.

```sh
cd conduit-docker
make docker/up                                   # http://localhost:3000
BACKEND_URL=http://my-backend:8080 make docker/up
PORT=8081 make docker/up                         # publish on another host port
make docker/logs
make docker/down
```

The default `BACKEND_URL` is `http://host.docker.internal:8080`, which reaches a backend running on your machine; the Compose file maps `host.docker.internal` to the host gateway so this also works on Linux. nginx resolves the backend host when it starts, so the host name must be resolvable at that moment.

## CI

`.github/workflows/ci.yml` runs these jobs:

1. **Commitlint**: commit message linting on pull requests (`.commitlintrc.json`).
2. **Quality**: lint, typecheck, unit and UI tests, then coverage, uploaded as an artifact.
3. **Build**: production build, uploaded as an artifact.
4. **E2E browser**: the Playwright suite against that build, with the mock API as backend; the report is uploaded on failure.
5. **Docker**: image build, then a smoke test that starts the container next to the mock API, checks `/ping`, requests every page and calls `/api/v1/tags` through nginx.

## Limits

- The app is a pure client: it holds no data of its own and needs a backend implementing the contract.
- The mock API is a test double. It follows the contract closely, but it is not a substitute for running the browser journeys against a real backend before a release.
- The JWT is stored in `localStorage`, which is readable by any script on the page. That matches the contract (`Authorization: Token`) but is a deliberate trade-off against cookie-based sessions.
- Profile pictures must be `https` URLs and are loaded from third-party hosts.

## References

- [RealWorld specification](https://github.com/realworld-apps/realworld)
- [React documentation](https://react.dev)
- [Vite](https://vite.dev) · [Vite `server.proxy`](https://vite.dev/config/server-options#server-proxy) · [Vite `preview`](https://vite.dev/config/preview-options)
- [TanStack Query](https://tanstack.com/query/latest)
- [React Router](https://reactrouter.com)
- [React Hook Form](https://react-hook-form.com) · [Zod](https://zod.dev)
- [Vitest](https://vitest.dev) · [Testing Library for React](https://testing-library.com/docs/react-testing-library/intro/) · [Mock Service Worker](https://mswjs.io) · [Playwright](https://playwright.dev)
- [nginx-unprivileged image](https://hub.docker.com/r/nginxinc/nginx-unprivileged) · [nginx `proxy_pass`](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Docker multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
