# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ReelTime v2 is a monorepo application that aggregates cinema showtimes from AlloCiné for theaters in Brest, Landerneau, and Lannion (France). It features a multi-level cache (L1 in-memory + L2 SQLite), a vintage cinema design system, and automatic daily sync of showtimes.

**Key Technologies**: TypeScript, pnpm workspaces, Turborepo

## Monorepo Structure

```
reeltime-v2/
├── apps/
│   ├── api/          # Fastify 5 + Prisma + SQLite/PostgreSQL
│   ├── web/          # React 19 + Vite 6 + Tailwind 3 + React Query 5 + Zustand
│   └── mobile/       # Expo 52 + React Native 0.76 + React Navigation 7
├── packages/
│   ├── types/        # Shared TypeScript types (@reeltime/types)
│   └── config/       # Shared configs - Tailwind, ESLint (@reeltime/config)
├── docker/           # docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Development Commands

```bash
# Install dependencies (from reeltime-v2/)
pnpm install

# Dev all apps
pnpm dev

# Build all
pnpm build

# Lint all
pnpm lint

# Dev individual apps
pnpm turbo run dev --filter=@reeltime/api
pnpm turbo run dev --filter=@reeltime/web
cd apps/mobile && expo start

# Build individual apps
pnpm turbo run build --filter=@reeltime/api
pnpm turbo run build --filter=@reeltime/web
```

### API Database (Prisma)

```bash
cd apps/api
npx prisma generate        # Generate Prisma client
npx prisma db push         # Push schema to DB
npx prisma studio          # Visual DB browser
npx tsx prisma/seed.ts     # Seed cinemas
```

### Type Checking

```bash
# Web
cd apps/web && npx tsc --noEmit && npx vite build

# Mobile
cd apps/mobile && npx tsc --noEmit

# API
cd apps/api && npx tsc --build
```

## Architecture

### API (`apps/api`) - Fastify 5

- **Entry**: `src/server.ts` → `src/app.ts` (Fastify app builder)
- **Routes**: `src/routes/` - films, cinemas, healthcheck
- **Services**: `src/services/` - allocineService (scraper), cacheService (multi-level L1/L2), filmService, cinemaService, refreshService (full sync), cacheScheduler (midnight sync)
- **Plugins**: `src/plugins/` - prometheus (metrics), requestLogger
- **Database**: Prisma ORM with schema in `prisma/schema.prisma`
- **Config**: `src/config/` - environment variables, cinema list
- **Validation**: Zod schemas in `src/schemas/`

### Web (`apps/web`) - React 19 + Vite

- **Entry**: `src/main.tsx` → `src/App.tsx` → `src/router.tsx`
- **Pages**: `src/pages/` - HomePage, NotFoundPage
- **Components**: `src/components/` - FilmGrid, FilmCard, FilmDrawer, FilmShowtimes, FilterBar, WeekNavigator
- **State**: Zustand store in `src/stores/filtersStore.ts`, React Query for server state
- **API**: `src/api/` - filmsApi, cinemasApi
- **Hooks**: `src/hooks/` - useFilms, useFilmDrawer, useWeekNavigation, useFilteredFilms, useCinemas, useMediaQuery
- **Styles**: Tailwind CSS with vintage cinema theme

### Mobile (`apps/mobile`) - Expo + React Native

- **Entry**: `index.ts` → `App.tsx`
- **Screens**: `src/screens/` - FilmsScreen, FilmDetailScreen
- **Navigation**: `src/navigation/` - React Navigation with bottom tabs + stacks
- **Components**: `src/components/` - native UI components (FilmCard, FilmBottomSheet, FilmShowtimes, WeekNavigator, FilterSheet)
- **State**: Zustand store in `src/stores/useFiltersStore.ts`
- **API**: `src/api/` - filmsApi

## Cinemas

12 cinemas configured in `apps/api/src/config/cinemas.ts`:
- Les Studios (Brest) - P0153
- CGR Brest Le Celtic (Brest) - P0151
- Multiplexe Liberté (Brest) - P0417
- Pathé Capucins (Brest) - W2920
- Ciné Galaxy (Landerneau) - G02PD
- Les Baladins (Lannion) - P0328
- La Salamandre (Morlaix) - P1883
- Cinéville Morlaix (Morlaix) - G0FOX
- Les Baladins (Perros-Guirec) - P0326
- Cinéville Quimper (Quimper) - P0299
- Katorza (Quimper) - P0633
- Quai Dupleix (Quimper) - W2900

## Design System (Vintage Cinema)

### Colors
- `rouge-cinema`: #D32F2F (primary)
- `noir-velours`: #1A1A1A (dark background)
- `creme-ecran`: #FFF8E1 (light background)
- `or-antique`: #FFD54F (accent/gold)
- `sepia-chaud`: #8D6E63 (warm accent)
- `beige-papier`: #EFEBE9 (paper background)
- `bordeaux-profond`: #5D4037 (deep accent)

### Fonts
- `BebasNeue-Regular` - labels, UI elements
- `PlayfairDisplay-*` - titles, headings
- `CrimsonText-*` - body text

## Configuration

### API Environment (`apps/api/.env`)
- `DATABASE_URL` - SQLite (dev) or PostgreSQL (prod)
- `PORT` (default: 3000), `HOST` (default: 0.0.0.0)
- `NODE_ENV` - development | production
- `CORS_ORIGIN` - Comma-separated origins or *
- `LOG_LEVEL` - trace | debug | info | warn | error | fatal
- `SKIP_PRELOAD` - Skip 60-day preload at startup (true for dev)
- `TIMEZONE` - Default: Europe/Paris

### Web Environment (`apps/web/.env`)
- `VITE_API_URL` - API base URL (default: http://localhost:3000)

### Mobile Environment (`apps/mobile/.env`)
- `EXPO_PUBLIC_API_URL` - API base URL

## Key Patterns

- API responses wrapped in `{ data: ... }` or `{ data: ..., meta: ... }`
- Cinema filter matching uses `allocineId` (string) as key
- React 19 `useRef` requires initial value: `useRef<T>(undefined)` not `useRef<T>()`
- Zustand persist: use `partialize` to exclude transient state
- Barrel exports in `components/index.ts` and `hooks/index.ts` must be updated for each new file
- Mobile: hooks imported directly by path (no barrel)

## Docker Deployment

```bash
cd reeltime-v2/docker
docker compose up -d
```

- API Dockerfile: `apps/api/Dockerfile`
- Web Dockerfile: `apps/web/Dockerfile` (nginx)
- Health check: `GET /healthcheck`

## Notifications

A la fin des taches longues, notifiez avec :
```bash
powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()"
```

Pour input requis :
```bash
powershell.exe -c "[System.Media.SystemSounds]::Question.Play()"
```
