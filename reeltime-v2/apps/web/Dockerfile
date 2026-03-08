# Stage 1: Builder
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy workspace config
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json turbo.json ./

# Copy shared packages
COPY packages/types/ packages/types/
COPY packages/config/ packages/config/

# Copy Web source
COPY apps/web/ apps/web/

# API URL is empty in prod (nginx proxies /api to the api service)
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

# Install dependencies and build
RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=@reeltime/web

# Stage 2: Production (nginx)
FROM nginx:alpine

# Copy built static files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1
