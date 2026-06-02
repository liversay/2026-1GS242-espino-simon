# backend — API de Quings (Hono).
# Build context: raíz del monorepo (damas/) para resolver @quings/game-engine.
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/game-engine/package.json packages/game-engine/package.json
COPY backend/package.json backend/package.json
RUN bun install --frozen-lockfile

COPY packages/game-engine ./packages/game-engine
COPY backend ./backend

WORKDIR /app/backend
EXPOSE 8080
CMD ["bun", "run", "src/index.ts"]
