FROM oven/bun:1.1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/web apps/web

WORKDIR /app/apps/web
ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN bun run vite build

# ─── Runtime: serve estáticos con un Node minimal vía bun ──
FROM oven/bun:1.1-alpine AS runner
WORKDIR /app
COPY --from=builder /app/apps/web/dist ./dist
COPY --from=builder /app/apps/web/package.json ./package.json
# Sirve los archivos compilados en :3000 usando un wrapper simple.
COPY --from=builder /app/apps/web/node_modules ./node_modules

EXPOSE 3000
CMD ["bunx", "vite", "preview", "--port", "3000", "--host", "0.0.0.0", "--outDir", "dist"]
