# Quings 👑 — Damas con IA (A\*) y Microservicios

Webapp de **damas 8×8** donde juegas contra la computadora. La IA decide con el algoritmo
**A\*** (sin LLMs). Arquitectura de microservicios con lobby, persistencia multi-dispositivo,
ranking global, marketplace de skins con moneda virtual (**Coronas**) y pagos con Stripe.
Estética minimalista pero arcade, inspirada en **Balatro**.

## Variante elegida

- **Juego:** **Damas (checkers) 8×8** clásicas, **humano vs. la máquina**.
- **Técnica de IA:** **A\*** (`f(n) = g(n) + h(n)`) con respaldo MIN/MAX para alternar el
  turno del rival. **Sin LLMs, sin redes neuronales y sin aprendizaje por refuerzo**: la IA
  es una **función pura** y determinista (salvo el *blunder* aleatorio de los niveles fáciles).
- **Arquitectura:** **app web + microservicio de IA** separados. El microservicio A\* es
  **stateless** y no toca la base de datos; la app (frontend + backend) lo invoca por REST.
- **Extras:** lobby con persistencia multi-dispositivo, ranking global, marketplace de skins
  con moneda virtual (**Coronas**) y compra de Coronas con **Stripe**.

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

## Invocación del microservicio A\*

El microservicio de IA expone **un solo endpoint de decisión**, `POST /move`, y un
`GET /health`. Es **stateless**: recibe el tablero y devuelve el mejor movimiento, sin
guardar nada. Quién lo llama y cómo:

1. **Quién lo invoca:** **solo el backend**, nunca el frontend ni la BD. El cliente está en
   [`backend/src/ai/client.ts`](backend/src/ai/client.ts) → `requestAiMove(board, currentPlayer, difficulty)`,
   que hace `POST ${AI_SERVICE_URL}/move`. En Docker `AI_SERVICE_URL = http://ai-service:7070`;
   en local, `http://localhost:7070`.
2. **Cuándo:** tras validar el movimiento del jugador, el backend pide al ai-service la
   respuesta de la máquina (ver «Flujo de una jugada» arriba).

**Contrato HTTP:**

```jsonc
// POST http://localhost:7070/move
// Request
{
  "board": [[0,2,0,2,0,2,0,2], ...],  // matriz 8×8 (0 vacío · 1 peón humano · 2 peón IA · 3 reina humano · 4 reina IA)
  "currentPlayer": "ai",              // opcional, por defecto "ai"
  "difficulty": 3                      // opcional 1–4 (def. 3) → profundidad A* y prob. de error
}

// 200 OK
{
  "from": { "row": 5, "col": 2 },
  "to":   { "row": 3, "col": 4 },
  "captures": [ { "row": 4, "col": 3 } ],         // [] si no hubo captura
  "analysis": { "score": 42, "nodesExplored": 137, "depth": 3 }
}
// 400 → JSON inválido o tablero que no es 8×8 · 422 → sin movimientos legales
```

**Niveles de dificultad** (`ai-service/src/index.ts`): `1` fácil (profundidad 1, 60% de
*blunder*), `2` aprendiz (prof. 2, 25%), `3` hábil (prof. 3, 0% — comportamiento clásico),
`4` maestro (prof. 5, 0%).

**Probarlo a mano** (con el ai-service levantado en `:7070`):

```bash
curl -s localhost:7070/health
curl -s -X POST localhost:7070/move \
  -H 'content-type: application/json' \
  -d '{"board":[[0,2,0,2,0,2,0,2],[2,0,2,0,2,0,2,0],[0,2,0,2,0,2,0,2],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[1,0,1,0,1,0,1,0],[0,1,0,1,0,1,0,1],[1,0,1,0,1,0,1,0]],"currentPlayer":"ai","difficulty":3}'
```

Detalle del algoritmo (`f=g+h`, heurística, respaldo MIN/MAX) en
[`ai-service/README.md`](ai-service/README.md).

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

Un solo comando levanta **toda** la pila —app (frontend + backend), microservicio de IA y
MongoDB— **sin configurar nada**:

```bash
docker compose up --build
# frontend :3000 · backend :8080 · ai-service :7070 · mongo :27017
```

- Los `.env` son **opcionales** (`required: false`): el **ai-service** y **Mongo** funcionan
  sin ninguna clave. Para **iniciar sesión** (Clerk) y **comprar Coronas** (Stripe) rellena
  `backend/.env` y `frontend/.env` antes de levantar.
- El **catálogo se carga solo**: el servicio `seed` (de un solo uso) inserta skins, tableros
  y paquetes de Coronas cuando Mongo está listo y luego termina.
- Healthchecks + `depends_on` garantizan el orden: `mongo` → `ai-service` → `backend` →
  (`seed`, `frontend`).

Para re-sembrar manualmente cuando ya está levantado:

```bash
docker compose run --rm seed
```

## Tests

Pruebas unitarias con el runner de **Bun** (`bun test`). **22 pruebas** en 2 archivos, sin
necesidad de BD ni servicios levantados (todo es lógica pura):

```bash
bun install            # una vez, desde la raíz del monorepo (damas/)

bun test               # TODA la suite: motor + IA  → 22 pass
bun run test:engine    # solo el motor de damas (packages/game-engine) → 18 pruebas
bun --cwd ai-service test   # solo el A* y la heurística (ai-service) → 4 pruebas
```

| Archivo | Cubre |
|---|---|
| [`packages/game-engine/src/engine.test.ts`](packages/game-engine/src/engine.test.ts) | Movimientos legales, captura obligatoria y múltiple, regla de retroceso del peón, promoción y fin de partida (18). |
| [`ai-service/src/astar.test.ts`](ai-service/src/astar.test.ts) | Búsqueda A\* y heurística: elige captura disponible, evita exponer fichas, devuelve un movimiento legal (4). |

Salida esperada: `22 pass · 0 fail`.

## Limitaciones conocidas

- **A\* a profundidad fija (1–5 según dificultad), sin tabla de transposición ni poda
  alfa-beta.** En profundidad 5 (nivel "maestro") la respuesta puede tardar perceptiblemente
  en posiciones con muchas ramas; no hay límite de tiempo por jugada.
- **La IA no es imbatible:** la heurística es estática (material + amenazas + centro +
  promoción) y no aprende. Los niveles fáciles, además, juegan mal *a propósito* (*blunder*
  aleatorio).
- **Auth y pagos dependen de servicios externos:** sin claves de **Clerk** no se puede
  iniciar sesión y sin **Stripe** (claves *test* + webhook) no se completan compras de
  Coronas. Las skins (Coronas) sí funcionan sin Stripe una vez autenticado.
- **Sin multijugador humano vs. humano ni partidas en tiempo real:** siempre es humano contra
  la máquina. No hay matchmaking ni websockets.
- **El frontend en Docker corre el servidor de desarrollo de Vite** (no un build de
  producción), pensado para evaluar local, no para desplegar.
- **El seed no es automático:** tras el primer arranque hay que ejecutarlo a mano para que
  aparezcan skins, tableros y paquetes de Coronas.
- **Pruebas centradas en la lógica pura** (motor + A\*); no hay tests de integración HTTP de
  los endpoints del backend ni de la UI.

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
