# persona-bot-v2

## Service Management
- `pbctl start|stop|restart|status [--all|--frontend|--backend]` — control frontend + backend
- **CRITICAL: Always use `--prod` behind HAProxy.** Dev mode (`next dev`) causes:
  - 5+ second page loads (compiles on first request)
  - Broken HMR WebSocket (`wss://.../_next/webpack-hmr` fails through proxy)
  - Intermittent API 500 errors from proxy/protocol mismatches
- `pbctl start --frontend` — dev mode (hot reload, local use only)
- `pbctl start --frontend --prod` — production mode (`next start`, for HAProxy)
- Symlinked at `~/.local/bin/pbctl`
- PIDs stored in `/tmp/pbctl-frontend.pid` / `/tmp/pbctl-backend.pid`
- Logs in `/tmp/pbctl-frontend.log` / `/tmp/pbctl-backend.log`

## Deployment Workflow (behind HAProxy)
After making code changes:

```
pbctl build             # ~12s (Turbopack)
pbctl restart --frontend --prod   # ~3s
```

For local dev (no HAProxy):

```
pbctl start --frontend    # ~0.7s startup, hot reload
```

## Production Build (important)
- `pbctl build` runs `env NODE_ENV=production npx next build` (always use `env` prefix, not bare `VAR=val` — shell parsing safety)
- Without `NODE_ENV=production`, `next build` generates dev-only output with no BUILD_ID, and `next start` fails with "could not find a production build"
- Regular `npm run build` uses `NODE_ENV=development` unless overridden

## Build Performance
| Mode | Version | Time |
|------|---------|------|
| Webpack (Next.js 15 / Tailwind v3) | `next build` | ~33s |
| Webpack (Next.js 16 / Tailwind v4) | `next build --webpack` | ~51s (cold) |
| **Turbopack (Next.js 16 / Tailwind v4)** | **`next build`** | **~12s** |
| Dev startup | `next dev` | ~0.7s |

## Next.js 16 + Tailwind v4 Migration (2026-07-18)

**Upgrade performed:**
- Next.js: `^15.1.8` → `^16.2.10` (Turbopack default for dev + build)
- Tailwind CSS: `^3.4.1` → `^4.3.3` (CSS-first config in globals.css)
- eslint-config-next: `^15.1.8` → `^16.2.10`

**Removed:**
- `tailwindcss-animate` (v3 PostCSS plugin — replaced by `tw-animate-css`)
- `autoprefixer` (bundled in v4)
- `tailwind.config.ts` (config moved to CSS `@theme`)
- `eslint` key from `next.config.js` (deprecated in v16)
- `images.domains` → replaced with `images.remotePatterns`

**Key changes:**
- `globals.css` uses `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- Design tokens migrated from `tailwind.config.ts → theme.extend` into `@theme inline` block
- Dark mode via `@custom-variant dark (&:is(.dark *));`
- PostCSS config: `tailwindcss: {}` → `@tailwindcss/postcss: {}`
- `--turbo` flag removed from dev command (Turbopack is default in v16)

**Known CSS issue (pre-existing, not fixed):**
- All `--*` CSS variables use `oklch()` format (e.g. `--card: oklch(0.205 0 0)`)
- Tailwind v3's `hsl(var(--card))` wrapper made `hsl(oklch(...))` → invalid → transparent
- With Tailwind v4 + `@theme inline`, this is **fixed** — `@theme` maps `--color-card: var(--card)` directly, no `hsl()` wrapper. The oklch values are now valid CSS and render correctly.

## Ports
- Frontend: `0.0.0.0:6080` (Next.js, `-H 0.0.0.0 -p 6080`)
- Backend:  `0.0.0.0:6081` (Express, default)

## Backend
- Direct start: `node --require ts-node/register/transpile-only src/index.ts`
- DB: PostgreSQL at `localhost:5432` (not 5434, not 5431)
- Orm: `postgres` (not Prisma despite generic README claims)
- DB connection string: `postgresql://postgres:postgres@localhost:5432/personabot` (no `?schema=public`)
- Bcrypt cost: 10 rounds (set via `BCRYPT_SALT_ROUNDS` in `.env`)

## lsof Caveat
- `next-server` sets process comm to a 15-char truncated title
- The truncation + any `(` in title breaks lsof's `/proc/PID/stat` parser — workaround: `--require /tmp/fix-title.js` + `PB_TITLE` env var overrides `process.title`
- Both processes show as `pb-front` / `pb-back` with clean comm names
- Alternative: `ss -tlnp` instead of lsof

## Frontend
- Next.js rewrites `/api/:path*` → `localhost:6081/api/:path*` (no HAProxy reconfig needed)
- `NEXT_PUBLIC_API_URL` must be empty string in `.env.local` so API calls use same-origin relative URLs
- CORS in backend allows `persona-bot.com` + `www.persona-bot.com` (http + https)
- shadcn/ui components: `button`, `card`, `badge` installed

## State Architecture & Evolution

persona-bot's state model evolves with its capabilities:

| Phase | Nature | State model | Conflict risk |
|---|---|---|---|
| **Current** (single user, manual) | User creates/edits their own data | Client-centric (Zustand + localStorage, re-fetch after writes) | None |
| **Autonomous agents** (email, social, IoT, research) | Background tasks modify data without client action | Server push via WebSocket, client invalidates stale entities | User edits same entity while agent modifies it |
| **Shared workspaces** (future) | Multiple users/agents on same data | Same as lextelligent — server source of truth, version stamps, pessimistic locking | Concurrent edits |

### Current rules
- User owns their data exclusively → client cache stays valid between manual edits
- Re-fetch after every write mutation (create/update/delete) guarantees consistency
- Optimistic updates are safe because no other writer can invalidate the cache

### Future rules (when agents are online)
- Agents write to DB asynchronously → client Zustand state becomes stale
- Add **WebSocket channel** per user — server pushes entity updates when agents change them
- Client subscribes on login, unsubscribes on logout
- On push event: invalidate that entity in local cache → re-fetch from server
- Version stamps become necessary when user and agent race on the same entity (user edits persona while agent updates its context). Last write wins with `WHERE version = :expected`.

### Implementation path
1. Add WebSocket hub to backend (`ws` or `socket.io`) — authenticated per user
2. Backend publishes `entity.updated { type, id }` on agent-write
3. Client receives event, runs `fetchPersona(id)` or `fetchSessions()` for the affected entity
4. Add `version` column to entities that agents + users both modify
5. Add optimistic concurrency check on agent writes

## sure-state

**GitHub:** `https://github.com/ShingWong/sure-state` (public)
**npm:** `sure-state`
**context7 library ID:** `/shingwong/sure-state`

## sure-state Integration (2026-07-18)

**Package:** `sure-state@0.1.0` installed — client-server state sync library by ShingWong.

### Updated stores

**`store/persona.store.ts`** — Replaced manual fetch/state with `createEntityStore`:
- Entity store configured with `sync: 'server-first'` (always re-fetches after write)
- Zustand hook subscribes to entity store changes (auto-sync via Zustand/vanilla `subscribe`)
- `fetchPersonas`, `createPersona`, `updatePersona`, `deletePersona` delegate to entity store
- `fetchPersona` uses `entityStore.fetchById(id)` + `entityStore.select(id)` for detail views
- `seedDefaultPersonas` kept as-is (admin-only, not standard CRUD)
- Exposes `personaInspector` (`createInspector`) for dev tools
- Same public `usePersonaStore` hook API — zero consumer changes

**`store/auth.store.ts`** — Added `createTokenManager` for proactive JWT refresh:
- Token manager reads/writes localStorage for backward compat with zustand persist
- `checkAuth()` calls `tokenManager.getAccessToken()` (auto-refresh if JWT expiring)
- `logout()` / `clearAuth()` call `tokenManager.invalidate()`
- `onStatusChange` listener syncs refreshed tokens back into zustand store
- Exports `tokenManager` singleton for use by other modules

**`components/DevTools.tsx`** — New dev-only InspectorPanel (persona store):
- Renders `InspectorPanel` from `sure-state/react-devtools`
- Only mounts in `NODE_ENV=development`
- Shows action history, item count, error state, action timing
- Toggle open/close, clear actions

**`store/chat.store.ts`** — Session CRUD migrated to `createEntityStore`:
- Session entity store with `sync: 'server-first'`
- Exposes `chatInspector` for dev tools
- Messages, streaming, and UI state remain as local Zustand (no persist — purely component-local concerns)
- Session list via `sessionStore` API re-exported for component use

## Bugs Fixed

### Soft-delete sessions reappearing in list (2026-07-18)
**Root cause:** `SessionService.getUserSessions` at `backend/src/services/session.service.ts:111` had no `WHERE status != 'DELETED'` filter. Delete set status to `DELETED` but the list query returned everything.

**Fix:** Added `AND s.status != 'DELETED'` to the base WHERE clause (when no explicit status filter) and the count query. ARCHIVED sessions still display normally.

## Work State (2026-07-18)

### Completed
- All 3 stores ported to sure-state (persona, auth, chat)
- Session soft-delete bug fixed (DELETED sessions excluded from list)
- `sure-state` published to npm + GitHub, submitted to context7 (`/shingwong/sure-state`)
- Agent tools module created (`createAgentTools`, `createMcpServer`)
- DevTools InspectorPanel wired to persona store

### Active
- (none)

### Blocked
- (none)

## Auth
- Admin user: `info@fcsllc.us` / `tesT-pass99` seeded in `init-db.ts`
- `init-db.ts` only hashes admin password if user does not already exist (avoids 400ms bcrypt on every restart)
- `ProtectedRoute` uses ref-based first-render approach — always renders children on mount, defers redirect to useEffect to avoid race with zustand persist hydration

## Common Issues
- **504 Gateway Timeout** — usually bcrypt cost too high or cold database connections. BCRYPT_SALT_ROUNDS=10 keeps auth ops ~120ms
- **Font preload warnings** — harmless Next.js cosmetic warning. Both Geist and Inter fonts have `preload: false` set in layout.tsx
- **Personas page redirects to /dashboard** — ProtectedRoute race with zustand persist hydration. Fixed by ref-based first-render approach
- **Slow filesystem detected** — not harmful. `/usr/local/devel/` may be on a shared/network filesystem causing `next dev` startup to warn. No functional impact.
- **CSS variables transparent** — **FIXED by Tailwind v4 upgrade**. The old oklch + hsl mismatch (v3) is gone. `@theme inline` maps variables directly, making oklch values valid CSS.
- **Login slow / 500 / WebSocket errors behind HAProxy** — root cause: running `next dev` behind reverse proxy. Fix: `pbctl restart --frontend --prod` to use `next start` instead. Dev mode's HMR WebSocket can't connect through HAProxy, causing 5s+ page loads and intermittent API failures.
- **Login returns "UNDEFINED_VALUE" or 500** — stale zustand persist state from a previous session can cause `undefined` values in the auth store. When a persisted `isAuthenticated: true` but tokens are expired, ProtectedRoute redirects to /dashboard before login completes, causing a redirect loop. Fix: use `--prod` mode (avoids dev-mode proxy issues) or clear localStorage.
- **stale session redirect loop** — If zustand persist restores `isAuthenticated: true` with expired tokens, ProtectedRoute may redirect to /dashboard before login completes, then fail back to /login. Workaround: clear browser localStorage for the site. Long-term fix: `checkAuth()` should always verify token validity, not trust persisted state.

## Graphify

Knowledge graph indexed at `/tmp/graphify-persona-bot-v2/graphify-out/graph.json` (1200 nodes, 2079 edges). Auto-updates on commit via post-commit hook.

Query: `graphify query "your question" --graph /tmp/graphify-persona-bot-v2/graphify-out/graph.json`
