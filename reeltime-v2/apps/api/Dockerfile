# Stage 1: Builder
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./

# Copy shared packages
COPY packages/types/ packages/types/
COPY packages/config/ packages/config/

# Copy API source
COPY apps/api/ apps/api/

# Install dependencies (respects lockfile = prisma 6.x)
RUN pnpm install --frozen-lockfile
RUN cd apps/api && npx prisma generate
RUN pnpm turbo run build --filter=@reeltime/api

# Prune to production deps
RUN pnpm --filter=@reeltime/api deploy --prod /app/pruned

# Create template SQLite DB with schema and seed data (cinemas)
RUN cd apps/api && DATABASE_URL=file:/tmp/template.db npx prisma db push --skip-generate --accept-data-loss 2>&1
RUN cd apps/api && DATABASE_URL=file:/tmp/template.db npx tsx prisma/seed.ts

# Stage 2: Production
FROM node:20-alpine
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
WORKDIR /app

# Copy pruned production deps
COPY --from=builder /app/pruned/node_modules ./node_modules

# Copy built output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Copy generated Prisma client to where compiled code expects it (dist/generated/)
COPY --from=builder /app/apps/api/src/generated ./dist/generated

# Copy workspace packages that the API depends on
COPY --from=builder /app/packages/types ./node_modules/@reeltime/types

# Copy template database
COPY --from=builder /tmp/template.db /app/template.db

# Create data directory for SQLite
RUN mkdir -p /app/data && chown appuser:appgroup /app/data

ENV NODE_ENV=production
ENV DATABASE_URL=file:/app/data/reeltime.db

USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthcheck || exit 1

# Copy template DB if no database exists, then start server
CMD ["sh", "-c", "[ -f /app/data/reeltime.db ] || cp /app/template.db /app/data/reeltime.db; node dist/server.js"]
