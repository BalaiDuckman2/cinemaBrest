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

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@reeltime/api
RUN cd apps/api && npx prisma generate

# Stage 2: Production
FROM node:20-alpine
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
WORKDIR /app

# Copy built output and production deps
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./

ENV NODE_ENV=production
USER appuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/healthcheck || exit 1

CMD ["node", "dist/server.js"]
