# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

The actual project lives in `PokePt_Evolution/` (a subdirectory). The repo root is a course-wide GitHub repo (`liversay/2026-1GS242-espino-simon`); other coursework (`Laboratorio#1`, `Parcial#2`) lives on `main`. **All work for this project happens on the `feature/pokept-evolution` branch and inside `PokePt_Evolution/`.** Do not touch the sibling folders.

When commands say "from project root" they mean `PokePt_Evolution/`.

## Common commands

The monorepo uses **Bun workspaces** (`apps/api`, `apps/web`, `packages/shared`). Always run from `PokePt_Evolution/` and use the workspace filter:

```bash
# Install everything (from project root)
bun install

# Dev servers (two terminals)
bun --filter @pokept/api dev          # Hono on :3001
bun --filter @pokept/web dev          # Vite on :3000, proxies /api -> :3001

# Stripe webhook forwarding — ALWAYS run this alongside the API in dev
stripe listen --forward-to localhost:3001/billing/webhook

# One-time data import (~30–60s, idempotent upsert)
bun --filter @pokept/api import

# Frontend production build (also serves as a typecheck via vite-tsconfig-paths)
cd apps/web && bun run vite build

# Manual API smoke
curl -sS http://localhost:3001/health
```

There is **no test suite** and no lint script. End-to-end verification is manual via `curl` and two browser sessions (see README §Demo).

### Docker / Colima

Docker is run via **Colima** on macOS (no Docker Desktop). If `docker version` fails to connect, run `colima start`.

```bash
docker compose up -d --build               # build + start mongo + api + web
docker compose exec api bun run import     # seed pokémon into mongo volume
docker compose exec mongo mongosh pokept   # interactive db shell
docker compose exec -T mongo mongosh pokept --quiet --eval "db.rooms.deleteMany({}); db.battles.deleteMany({})"
docker compose down                        # mongo-data volume survives
```

Pokémon data persists in the `mongo-data` volume; rooms and battles are ephemeral and safe to truncate between sessions.

When changing API or web code, rebuild only the affected services: `docker compose build api web && docker compose up -d`.

## High-level architecture

Two apps + a shared types package, all in one Bun workspace. The split matters:

- **`packages/shared/src/types.ts`** is the single source of truth for every wire type (`Room`, `Battle`, `BattlePokemon`, `LogEntry`, etc.). Both the Hono server and the React app import from `@pokept/shared`. When you change a type here, the change has to be valid for both sides simultaneously — `bun run vite build` (web) and starting the API will catch most mismatches at the call-sites.

- **`apps/api`** (Hono on Bun) is the **only place battle logic runs**. The frontend never computes damage, never decides turn order, never applies status — it sends one of two actions (`move` or `switch`) and renders whatever battle state the server returns.

- **`apps/web`** (Vite + React 18 + `@tanstack/react-router`) is a polling client. Every screen that needs live updates uses `usePolling(fn, 400ms, deps)` from `src/hooks/usePolling.ts`. There are no WebSockets and no SSE.

## Authentication (Clerk)

Every protected API route goes through `apps/api/src/middleware/auth.ts`:

```ts
// requireAuth — verifies the Clerk JWT from the Authorization: Bearer header
// getUserId(c) — returns the verified clerkUserId (= playerId everywhere)
import { requireAuth, getUserId } from '../middleware/auth'
```

- `playerId` throughout the system **is** the Clerk `userId` (e.g. `user_3D04hQ2n1WwiV8IztGQE52gk374`). It is never passed in request bodies — always extracted from the verified JWT server-side.
- Protected routes: all `POST` on `/rooms`, `/battles`, `/me`, `/billing`. Public: `GET /pokemon`, `GET /rooms/:code`, `GET /battles/:code`.
- The web app injects the Clerk JWT via a **token provider pattern** (`apps/web/src/lib/api.ts`). `ClerkTokenBridge` in `main.tsx` calls `setTokenProvider(() => getToken())` so the non-React `api.ts` module can get fresh tokens for every request.

### Auth UI (custom, no Clerk prebuilt components)

Sign-in and sign-up use **Clerk hooks** (`useSignIn`, `useSignUp`, `useClerk`, `useUser`) with fully custom JSX — no `<SignIn>`, `<SignUp>`, or `<UserButton>` prebuilt components:

- `routes/sign-in.tsx` — tabs Password / Email code, Google button, OTP grid (6 cuadritos)
- `routes/sign-up.tsx` — email+password form → verification step with OTP grid
- `routes/sso-callback.tsx` — mounts `<AuthenticateWithRedirectCallback />` for Google OAuth redirect
- `components/UserAvatar.tsx` — pixel avatar (photo or initial) + dropdown with email and sign-out. Replaces `<UserButton>`.
- `routes/auth.module.css` — all auth-specific styles

**OTP grid pattern** (`sign-in.tsx`, `sign-up.tsx`): 6 `<input maxLength=1>` with a ref array, auto-focus next on input, focus prev on Backspace when empty, paste handler that spreads digits across all boxes.

**Google OAuth flow**: `signIn.authenticateWithRedirect({ strategy: 'oauth_google', redirectUrl: origin + '/sso-callback', redirectUrlComplete: '/' })`.

**Email code sign-in flow**:
1. `signIn.create({ identifier: email })` → find `email_code` factor in `supportedFirstFactors`
2. `signIn.prepareFirstFactor({ strategy: 'email_code', emailAddressId: factor.emailAddressId })` → sends code
3. Show OTP grid → `signIn.attemptFirstFactor({ strategy: 'email_code', code })`

## User model & subscription

`apps/api/src/db/repo/userRepo.ts` — MongoDB `users` collection:

```ts
interface User {
  clerkUserId: string
  email: string
  subscriptionStatus: 'free' | 'premium'
  stripeCustomerId: string | null
  createdAt: string
}
```

`GET /me` upserts the user on first visit (fetches email from Clerk API via `createClerkClient`). Returns `{ clerkUserId, email, subscriptionStatus }`.

## Billing (Stripe, test mode)

`apps/api/src/routes/billing.ts`:

- `POST /billing/checkout` — creates a Stripe Checkout Session (subscription mode, `STRIPE_PRICE_ID`). Requires auth. Creates/reuses a `stripeCustomerId` on the User document.
- `GET /billing/portal` — creates a Customer Portal session for managing/cancelling the subscription.
- `POST /billing/webhook` — validates `stripe-signature` with `STRIPE_WEBHOOK_SECRET`. Handles:
  - `checkout.session.completed` → set `subscriptionStatus = 'premium'`
  - `customer.subscription.deleted` → set `subscriptionStatus = 'free'`
  - `customer.subscription.updated` → `active`/`trialing` → premium, else free

**Critical for local dev**: Stripe webhooks never reach localhost unless `stripe listen --forward-to localhost:3001/billing/webhook` is running. Without it, subscriptionStatus stays `'free'` even after a completed checkout.

To manually promote a user in the local DB:
```bash
mongosh pokept --eval "db.users.updateOne({clerkUserId:'user_...'}, {\$set:{subscriptionStatus:'premium'}})"
```

## Premium / Shiny system

- `isPremium` is fetched via `api.getMe()` in `lobby.$code.tsx`. The `useEffect` depends on `[isSignedIn]` and guards with `if (!isSignedIn) return` — this is intentional to avoid calling the API before Clerk has loaded the session.
- `POST /rooms/:code/team` accepts `{ pokedexIds: number[], shinyIds?: number[] }`. If `shinyIds` is non-empty and the user is not premium, returns 403 `premium_required`.
- `isShiny: boolean` lives on `BattlePokemon` (in `packages/shared/src/types.ts`). The battle engine in `init.ts` sets it from the `teamShinyIds` set.
- Shiny sprites use a separate fallback cascade: `versions['generation-iv'].platinum.front_shiny` → `heartgold-soulsilver` → `diamond-pearl` → `front_shiny` → normal sprite.

## Battle engine state machine (`apps/api/src/battle/`)

The engine is the most subtle area. Read these files together as one unit:

- `init.ts` — builds the initial `Battle` from a `Room`. Battle starts in `status: 'coin-flip'` with `currentTurnPlayerId: null` and `mustSwitchPlayerId: null`. IVs are rolled once here and persist in the document.
- `engine.ts` — `applyCoinFlipChoice` and `applyTurn`. **These are the only places `currentTurnPlayerId` and `mustSwitchPlayerId` get mutated.** The route handlers in `routes/battles.ts` validate permissions and then delegate.
- `damage.ts`, `types.ts`, `status.ts`, `stats.ts` — formula helpers (pure-ish). `types.getTypeRelationsCache` caches the 18 type relations in memory after first DB hit; invalidate via `invalidateTypeCache` if you ever mutate the `types` collection at runtime.

The two-flag state machine that gates `POST /battles/:code/action`:

| `mustSwitchPlayerId` | `currentTurnPlayerId` | What the route accepts |
|---|---|---|
| `X` (someone forced) | `X` | only `X`, only `action.type === 'switch'` (else 400 `must_switch_first`); anyone else gets 409 `waiting_for_forced_switch` |
| `null` | `X` | only `X` (else 409 `not_your_turn`), any valid action |

**Project-specific rules that deviate from canonical Pokémon — preserve these unless explicitly told otherwise:**

1. A **forced** switch (after a faint) **consumes the turn**, just like a voluntary switch — the opponent acts next. There is no `wasForcedSwitch` special branch in `engine.ts`; the `else` block always passes `currentTurnPlayerId` to the opponent.
2. The coin flip is mandatory at battle start: only the **guest** (`playerId !== battle.hostPlayerId`) can call `/coin-flip-choice`; host gets 403.
3. Order of action is **coin flip + switch-priority** only — no speed, no move priority (MVP).
4. Paralysis is **visual-only**: it shows a status badge for 3 turns but does NOT reduce speed and does NOT add miss chance.
5. Burn/Poison tick `floor(maxHp * 0.05)` at end of turn and decrement a 3-turn counter. Switching out a Pokémon **clears** its status and stat stages (`status.clearOnSwitch`).
6. Type relations come from PokéAPI's per-type `damage_relations` (not hardcoded). Two defender types stack multiplicatively (so x2·x2=x4, x0 short-circuits to 0).
7. Normal sprites use fallback cascade: `versions['generation-iv'].platinum.front_default` → `heartgold-soulsilver` → `diamond-pearl` → `front_default`.

### Frontend animation queue (`apps/web/src/routes/battle.$code.tsx`)

- `logRef` (current log array), `seenRef` (index of last-played entry), `animatingRef` (re-entry lock).
- A `useEffect` on `battle?.log.length` updates `logRef.current`; if `animatingRef` is false, it starts a single async worker.
- The worker loops `while (seenRef.current < logRef.current.length)`, awaits `playEntry`, increments `seenRef`. When polling brings new entries mid-animation, `logRef` is mutated but no second worker starts.
- `animationDone` (state, not ref) gates side effects that must wait for the queue to drain — currently used to **delay opening `SwitchMenu`** until the faint animation has played.

When you add a new `LogEntry` kind, you must handle it in **both**:
- `engine.ts` (push it in the right order with respect to `damage` → `effectiveness` → `faint`)
- `playEntry` in `battle.$code.tsx` (timing) and `BattleLog.tsx` (`entryText`, for the typewriter)

### Pokeball animation

`AnimState` in `battle.$code.tsx` has `allyPokeball: boolean` and `foePokeball: boolean`. The flag activates in `playEntry` for the `switch` entry (immediately, no sleep) AND for `send_out` (initial send without a preceding switch). `PokemonStage.tsx` receives `showPokeball?: boolean`; when true it renders the pokeball with CSS keyframes (throw 0–400ms → shake 400–700ms → open 700–900ms), and the Pokémon sprite has class `spriteAppear` (opacity 0, fade-in at 700ms).

### Forced data invariants

- A `Room` always has its host as `players[0]` (when only one is present) or contains exactly one player with `id === hostPlayerId`.
- A `Battle.team` always has exactly 6 Pokémon per player (`/rooms/:code/team` enforces `.length(6)` via zod).
- `battle.players` is always `[host, guest]` in some order; do **not** assume index 0 = host. Use `battle.hostPlayerId` to identify the host.

## Design system (`apps/web/src/styles/`)

All design tokens are in `tokens.css`. Key variables:
- Backgrounds: `--pp-night`, `--pp-deep`, `--pp-steel`
- Foreground: `--pp-paper`, `--pp-ink`, `--pp-platinum`
- Accents: `--pp-hot` (red/CTA), `--pp-electric` (yellow/focus)
- Typography: `--font-display` (Press Start 2P), `--font-sub` (Jersey 15), `--font-body` (VT323)
- Borders: `--panel-border` (3px solid ink), `--panel-shadow` (4px 4px 0 shadow)

Global utility classes in `app.css`: `.btn`, `.btn--hot`, `.input` (+ `.input:focus` with electric border), `.panel`, `.panel--dark`, `.panel__chip`, `.kicker`, `.hero-code`.

Auth-specific styles live in `routes/auth.module.css` (card, OTP grid, tabs, Google button, error box).

## Importer notes (`apps/api/src/importer/`)

- Fetches the first **340** Pokémon from PokéAPI. Net result on a clean run: ~325 Pokémon, ~338 moves, 18 types.
- "Usable move" = `damageClass in {physical, special}` with `power > 0`, **or** `damageClass === 'status'` with an effect we can model (`burn` / `poison` / `paralysis` / `atk-` / `def-` / `spe-`). See `mapMove.tryMapMove`.
- Concurrency is 10 with exponential-backoff retry. Each upsert is keyed by `pokedexId` / `moveId` / `type.name` so reruns are safe.
- Each Pokémon document has both `spriteUrl` (normal) and `shinySpriteUrl` (shiny) fields populated by the importer.

## Generated files

- `apps/web/src/routeTree.gen.ts` is regenerated by `@tanstack/router-vite-plugin` on every Vite run. **Do not edit it.** It is currently committed, but treating it as derived output is fine — re-running the dev server fixes any drift.
- `bun.lock` is workspace-wide and lives at `PokePt_Evolution/bun.lock`. The Dockerfiles use `bun install --frozen-lockfile`, so commit lock changes whenever you add a dependency.

## Environment variables

`apps/api/.env.local`:
```
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...
```

`apps/web/.env.local`:
```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

## Git

- Branch: `feature/pokept-evolution`. `main` belongs to other coursework; do not merge into `main` without explicit user approval.
- Remote auth is HTTPS via `gh auth setup-git` (the user's SSH host-key for github.com is not in their known_hosts).
- Commit messages follow `tipo(scope): mensaje` (`feat(api):`, `feat(web):`, `fix:`, `docs:`, `chore:`).
