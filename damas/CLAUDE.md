# CLAUDE.md — Quings 👑

Este proyecto vive en `DSIX/damas/`. **DSIX** es el monorepo git de la materia y contiene
otras entregas (`Laboratorio#1/`, `Parcial#2/`, `pokept_evolution/`) que normalmente no se
tocan; el trabajo activo es **Quings**, en esta carpeta.

## Flujo de git (importante)

- El repositorio git es **toda la carpeta DSIX** (el nivel de arriba), no `damas/`.
- Commitea **solo** lo de Quings desde la raíz: `git add damas` (no hagas `git add .`).
- El `push` se hace por **HTTPS**.
- Los mensajes de commit usan el scope `quings`, p. ej. `feat(quings): …`, `fix(quings): …`.

---

# Quings — damas con IA (A\*) y microservicios

Webapp de **damas 8×8** contra la computadora. La IA decide con **A\*** (sin LLMs).
Arquitectura de microservicios con lobby, persistencia multi-dispositivo, ranking global,
marketplace de skins con moneda virtual (**Coronas**) y pagos con Stripe. Estética
minimalista pero arcade, inspirada en **Balatro**.

## Arquitectura

```
Frontend (TanStack Start)  ──REST──►  Backend (Hono)  ──►  MongoDB
                                          │
                                          └──REST──►  AI Service (A*, stateless)
```

Monorepo de workspaces de **Bun** (`package.json` raíz de `damas/`):

| Workspace | Rol | Puerto |
|---|---|---|
| `packages/game-engine` | Lógica pura de damas (TS). Fuente de verdad de las reglas, compartida por los 3 servicios. | — |
| `ai-service` | Microservicio **stateless** con A\* (`f(n)=g(n)+h(n)`, profundidad 3) + heurística. No escribe en BD. | `7070` |
| `backend` | API **Hono**. **Único** servicio que escribe en MongoDB. Orquesta usuarios, partidas, ranking, marketplace y Stripe. | `8080` |
| `frontend` | TanStack Start + React + Clerk. Lobby, tablero, tienda, inventario, ranking, compra de Coronas. | `3000` |
| MongoDB | Persistencia. | `27017` |

## Layout

```
. (damas/)
├─ package.json            # workspaces + scripts dev:* y test:engine
├─ docker-compose.yml      # mongo + ai-service + backend + frontend
├─ tsconfig.base.json
├─ packages/game-engine/src/
│  ├─ board.ts  moves.ts  rules.ts   # tablero, movimientos legales, reglas
│  ├─ index.ts                       # re-exporta board/moves/rules
│  └─ engine.test.ts                 # 18 pruebas
├─ ai-service/src/
│  ├─ astar.ts  heuristic.ts         # A* + heurística → findBestMove()
│  ├─ astar.test.ts
│  └─ index.ts                       # Hono: POST /move, GET /health
├─ backend/src/
│  ├─ index.ts                       # rutas Hono (ver API abajo)
│  ├─ env.ts  middleware/auth.ts     # config + requireAuth (Clerk)
│  ├─ ai/client.ts                   # llama al ai-service
│  ├─ db/ (mongo, collections, seed, seed-data)
│  └─ services/ (games, ranking, skins, coronas)
└─ frontend/src/
   ├─ router.tsx  start.ts  routeTree.gen.ts
   ├─ routes/ (index, play.$id, ranking, shop, games, locker, coronas, sign-in/up)
   ├─ components/ (Board, Piece, Layout, SkinPreview, ui/*)
   ├─ lib/ (api, types, profile, settings, sound, transition, …)
   └─ styles/quings.css
```

## Stack

TanStack Start (React) + Vite · **Bun** (runtime de los 3 servicios) · **Hono** (backend e
IA) · **MongoDB** · **Clerk** (`@clerk/tanstack-react-start`) · **Stripe** (Checkout +
webhooks) · Docker + Docker Compose.

## API del backend (`backend/src/index.ts`)

- `GET /health` — público.
- `POST /api/stripe/webhook` — **público**, raw body, registrado **antes** del middleware de auth.
- Todo lo demás bajo `/api/*` exige auth **Clerk** (`requireAuth`).
  - Perfil: `GET /api/me`, `PATCH /api/me` (username 3–20 chars).
  - Partidas: `POST /api/games`, `GET /api/games`, `GET /api/games/:id`,
    `POST /api/games/:id/move`, `POST /api/games/:id/resign`.
  - Ranking: `GET /api/ranking`.
  - Marketplace: `GET /api/skins`, `POST /api/skins/:id/buy`, `POST /api/skins/:id/equip`.
  - Coronas: `GET /api/corona-packs`, `POST /api/checkout`, `POST /api/checkout/confirm`.

El **ai-service** expone solo `POST /move` (tablero → mejor jugada) y `GET /health`.

## Desarrollo local

```bash
bun install                 # instala todo el workspace (desde damas/)
bun run test:engine         # pruebas del motor de damas (= bun test packages/game-engine)
bun --cwd backend run seed  # carga catálogo de skins y paquetes de Coronas

# en 3 terminales:
bun run dev:ai              # ai-service  → :7070
bun run dev:backend         # backend     → :8080
bun run dev:frontend        # frontend    → :3000
```

Abre <http://localhost:3000>.

## Docker

```bash
docker compose up --build   # frontend :3000 · backend :8080 · ai :7070 · mongo :27017
docker compose exec backend bun run src/db/seed.ts   # cargar catálogo tras el 1er arranque
```

## Configuración (`.env` — ya existen vacíos, están en `.gitignore`)

- `backend/.env` — `MONGODB_URI`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`,
  `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.
- `frontend/.env` — `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL` (def. `http://localhost:8080`).
- `ai-service/.env` — `PORT=7070`.

En Docker, `docker-compose.yml` sobre-escribe `MONGODB_URI` (→ `mongo:27017`) y
`AI_SERVICE_URL` (→ `ai-service:7070`) con los hostnames de la red interna.

## Reglas del juego

Damas clásicas 8×8 sobre casillas oscuras. Captura **obligatoria** y capturas múltiples.
Un peón solo captura hacia atrás si **ya capturó hacia adelante** en el mismo turno. Al llegar
a la última fila, corona como **reina** (mueve y captura en ambos sentidos). Gana quien deje
al rival sin fichas o sin movimientos legales.

## Monetización y ranking

- **Coronas** = moneda del juego. Al ganar: `50 + max(0,(80−movimientos)·2)`.
- **Stripe** solo compra paquetes de Coronas (dinero real → Coronas).
- **Skins** se compran con Coronas (común/rara/épica/legendaria) y se equipan en el tablero.
- **Ranking**: mejor partida = **menor número de movimientos** para ganar.

## Convenciones

- La lógica de reglas vive **solo** en `packages/game-engine`; frontend, backend y
  ai-service la importan como `@quings/game-engine`. No dupliques reglas.
- Solo el **backend** escribe en MongoDB. El ai-service es puro/stateless.
- Comentarios y mensajes de UI en **español**.
</content>
