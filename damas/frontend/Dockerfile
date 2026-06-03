# frontend — TanStack Start (Vite SSR) para Quings.
# Build context: raíz del monorepo (damas/) para resolver @quings/game-engine.
# Ejecuta el servidor de Vite (SSR), que lee las variables VITE_* en tiempo de ejecución.
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

COPY package.json bun.lock ./
COPY packages/game-engine/package.json packages/game-engine/package.json
COPY frontend/package.json frontend/package.json
RUN bun install --frozen-lockfile

COPY packages/game-engine ./packages/game-engine
COPY frontend ./frontend

WORKDIR /app/frontend
EXPOSE 3000
CMD ["bun", "run", "dev", "--", "--host"]
