# ai-service — microservicio de IA (A*) para Quings.
# Build context: raíz del monorepo (damas/) para resolver el workspace @quings/game-engine.
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

# Manifiestos para cachear la instalación de dependencias.
COPY package.json bun.lock ./
COPY packages/game-engine/package.json packages/game-engine/package.json
COPY ai-service/package.json ai-service/package.json
RUN bun install --frozen-lockfile

# Código fuente.
COPY packages/game-engine ./packages/game-engine
COPY ai-service ./ai-service

WORKDIR /app/ai-service
EXPOSE 7070
CMD ["bun", "run", "src/index.ts"]
