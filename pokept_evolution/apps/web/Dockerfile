FROM oven/bun:1-alpine AS builder
WORKDIR /app

COPY package.json bun.lock tsconfig.base.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

RUN bun install --frozen-lockfile

COPY packages/shared packages/shared
COPY apps/web apps/web

WORKDIR /app/apps/web
ARG VITE_API_BASE=/api
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN bun run vite build

# ─── Runtime: vite preview sirve el dist en :3000 ──
FROM oven/bun:1-alpine AS runner
WORKDIR /app
# Copiamos todo el workspace para que bun/vite resuelvan deps hoisteadas en /app/node_modules
COPY --from=builder /app /app

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["bunx", "vite", "preview", "--port", "3000", "--host", "0.0.0.0", "--outDir", "dist"]
