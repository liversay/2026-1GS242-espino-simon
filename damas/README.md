# Quings 👑 — Damas con IA (A\*) y Microservicios

Webapp de **damas 8×8** donde juegas contra la computadora. La IA decide con el algoritmo
**A\*** (sin LLMs). Arquitectura de microservicios con lobby, persistencia multi-dispositivo,
ranking global, marketplace de skins con moneda virtual (**Coronas**) y pagos con Stripe.
Estética minimalista pero arcade, inspirada en **Balatro**.

## Arquitectura

```
Frontend (TanStack Start)  ──REST──►  Backend (Hono)  ──►  MongoDB
                                          │
                                          └──REST──►  AI Service (A*, stateless)
```

- **`packages/game-engine`** — lógica pura de damas (TS): movimientos legales, captura
  obligatoria, regla de retroceso del peón, promoción y fin de partida. Fuente de verdad
  compartida por frontend, backend y ai-service. *(18 pruebas — `bun run test:engine`)*
- **`ai-service`** — microservicio stateless con **A\*** (`f(n)=g(n)+h(n)`, profundidad 3,
  respaldo MIN/MAX) + heurística. Función pura `tablero → mejor movimiento`. Ver
  [`ai-service/README.md`](ai-service/README.md).
- **`backend`** — API Hono. Único servicio que escribe en Mongo. Orquesta usuarios (Clerk),
  partidas (valida con game-engine, pide la jugada al ai-service), ranking, marketplace y Stripe.
- **`frontend`** — TanStack Start + React + Clerk. Lobby, tablero arcade, tienda, inventario,
  ranking y compra de Coronas.

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | TanStack Start (React) + Vite + TypeScript |
| Runtime | Bun (los 3 servicios) |
| Backend / IA | Hono |
| Base de datos | MongoDB |
| Autenticación | Clerk (`@clerk/tanstack-react-start`, UI en español con `@clerk/localizations`) |
| Pagos | Stripe (Checkout + webhooks) |
| Contenedores | Docker + Docker Compose |

## Cómo se construyó (detalle técnico)

### Monorepo y runtime

El proyecto es un **monorepo de workspaces de Bun** (`package.json` raíz con
`workspaces: ["packages/*", "frontend", "backend", "ai-service"]`). Bun es el runtime
único de los tres servicios y el gestor de paquetes (un solo `bun.lock`). TypeScript
comparte configuración base vía `tsconfig.base.json`.

> Scripts `dev:*`: usan `bun run --cwd <dir> dev` (el flag `--cwd` va **después** de `run`
> en Bun ≥ 1.3).

### `packages/game-engine` — la fuente de verdad de las reglas

Lógica **pura** de damas en TypeScript, sin dependencias de framework, para que los tres
servicios importen exactamente las mismas reglas como `@quings/game-engine` y no se
dupliquen:

- `board.ts` — representación del tablero 8×8 y casillas oscuras.
- `moves.ts` — generación de **movimientos legales**, captura **obligatoria** y capturas
  múltiples (incluida la regla de que el peón solo retrocede si ya capturó hacia adelante
  en el mismo turno).
- `rules.ts` — promoción a reina, detección de fin de partida (sin fichas o sin jugadas).

Cubierto por **18 pruebas** (`bun run test:engine`). El motor es determinista, así que
backend y ai-service validan contra el mismo resultado.

### `ai-service` — IA con A\* (stateless)

Microservicio **Hono** sin estado ni acceso a BD. Expone solo `POST /move`
(`tablero → mejor movimiento`) y `GET /health`.

- `astar.ts` — búsqueda **A\*** con `f(n) = g(n) + h(n)` a **profundidad 3**, con respaldo
  tipo MIN/MAX para alternar el turno del rival.
- `heuristic.ts` — heurística de evaluación (material, reinas, posición) que guía la
  búsqueda. Al ser una función pura, es fácilmente testeable (`astar.test.ts`).

Se aísla como microservicio para poder escalar/reemplazar la IA sin tocar el backend.

### `backend` — API Hono y **único** dueño de la BD

API REST en **Hono**. Es el **único** servicio que escribe en MongoDB; el ai-service y el
frontend nunca tocan la BD directamente.

- `index.ts` — rutas (ver «API» abajo). `GET /health` y el webhook de Stripe son públicos;
  el resto de `/api/*` exige auth.
- `middleware/auth.ts` — `requireAuth` valida la sesión de **Clerk** (`@clerk/backend`).
- `ai/client.ts` — cliente REST que delega la jugada de la máquina al ai-service.
- `db/` — conexión a Mongo, colecciones, y `seed.ts` que carga el catálogo de skins y los
  paquetes de Coronas.
- `services/` — lógica de negocio: `games` (crea/valida partidas con game-engine),
  `ranking`, `skins` (marketplace) y `coronas` (economía).

**Flujo de una jugada:** el frontend envía el movimiento del jugador → el backend lo
**valida** con `@quings/game-engine` → persiste el estado → pide al **ai-service** la
respuesta de la máquina → vuelve a validar y persistir → responde al frontend.

### `frontend` — TanStack Start + React

SSR con **TanStack Start** (Vite). Enrutado por archivos en `routes/`
(`index`, `play.$id`, `ranking`, `shop`, `games`, `locker`, `coronas`, `sign-in/up`).

- `components/` — `Board`, `Piece`, `Layout`, `SkinPreview` y primitivas `ui/*`.
- `lib/` — `api` (cliente del backend), `types`, `profile` (cachea `/api/me`),
  `settings`, `sound`, `transition`, `clerkAppearance` (tema visual de Clerk).
- `styles/quings.css` — estética arcade minimalista inspirada en **Balatro**.
- Auth con **Clerk** (`@clerk/tanstack-react-start`); la UI de Clerk va traducida al
  español con `@clerk/localizations` (`esES`) y re-tematizada vía `appearance`.

### Autenticación, pagos y economía

- **Clerk** gestiona usuarios y sesiones; el backend solo confía en el token verificado.
- **Stripe** (Checkout + webhooks) se usa **únicamente** para comprar paquetes de Coronas
  (dinero real → Coronas). El webhook se registra **antes** del middleware de auth y lee el
  *raw body* para verificar la firma.
- **Coronas** es la moneda interna; las skins se compran con Coronas, nunca con dinero real.

### Contenedores

`docker-compose.yml` levanta `mongo`, `ai-service`, `backend` y `frontend` con healthchecks
y `depends_on`. En Docker se sobre-escriben `MONGODB_URI` (→ `mongo:27017`) y
`AI_SERVICE_URL` (→ `ai-service:7070`) con los hostnames de la red interna.

## Configuración (rellena los `.env`)

Los `.env` ya existen (con claves **vacías**) y están en `.gitignore`. Complétalos:

**`backend/.env`** — `MONGODB_URI`, `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`,
`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`.

**`frontend/.env`** — `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_API_URL` (por defecto
`http://localhost:8080`).

**`ai-service/.env`** — `PORT=7070` (ya listo).

> Clerk: crea una app en [clerk.com](https://clerk.com) y copia las claves *test*.
> Stripe: claves *test* + un endpoint de webhook a `/api/stripe/webhook` (o `stripe listen`).
> Mongo: local (`mongodb://localhost:27017/quings`) o Atlas.

## Desarrollo local

```bash
bun install                 # instala todo el workspace
bun run test:engine         # pruebas del motor de damas
bun run --cwd backend seed  # carga el catálogo de skins y paquetes de Coronas

# en 3 terminales:
bun run dev:ai              # ai-service  → :7070
bun run dev:backend         # backend     → :8080
bun run dev:frontend        # frontend    → :3000
```

Abre <http://localhost:3000>.

## Docker

```bash
# rellena los .env y luego:
docker compose up --build
# frontend :3000 · backend :8080 · ai-service :7070 · mongo :27017
```

Tras el primer arranque, carga el catálogo:

```bash
docker compose exec backend bun run src/db/seed.ts
```

## Reglas del juego

Damas clásicas 8×8 sobre casillas oscuras. Captura **obligatoria** y capturas múltiples.
Un peón solo captura hacia atrás si **ya capturó hacia adelante** en el mismo turno. Al llegar
a la última fila, el peón corona como **reina** (se mueve y captura en ambos sentidos). Gana
quien deje al rival sin fichas o sin movimientos legales.

## Monetización

- **Coronas** = moneda del juego. Se ganan al vencer (`50 + max(0,(80−movimientos)·2)`).
- **Stripe** solo compra paquetes de Coronas (dinero real → Coronas).
- Las **skins** se compran con Coronas (común/rara/épica/legendaria) y se equipan en el tablero.

## Ranking

Mejor partida = **menor cantidad de movimientos** para ganar. Menos movimientos, más arriba.
