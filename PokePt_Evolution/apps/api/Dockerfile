FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copia todos los workspace manifests para que bun pueda resolver el lockfile.
COPY package.json bun.lock tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/api apps/api

ENV PORT=3001
EXPOSE 3001

WORKDIR /app/apps/api
CMD ["bun", "run", "src/index.ts"]
