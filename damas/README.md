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
| Autenticación | Clerk (`@clerk/tanstack-react-start`) |
| Pagos | Stripe (Checkout + webhooks) |
| Contenedores | Docker + Docker Compose |

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
bun --cwd backend run seed  # carga el catálogo de skins y paquetes de Coronas

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
