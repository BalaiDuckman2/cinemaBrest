---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - 'output/planning-artifacts/prd.md'
  - 'output/planning-artifacts/ux-design-specification.md'
  - 'output/project-context.md'
documentCounts:
  prd: 1
  uxDesign: 1
  projectContext: 1
  briefs: 0
  research: 0
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-04'
project_name: 'cinemaBrest-1'
user_name: 'Raphael'
date: '2026-02-04'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

Le PRD définit 31 exigences fonctionnelles réparties comme suit :

| Domaine | MVP | Phase 2 | Total |
|---------|-----|---------|-------|
| Gestion Utilisateurs | 6 | - | 6 |
| Découverte Films | 8 | - | 8 |
| Séances | 3 | - | 3 |
| Watchlist | 3 | - | 3 |
| Réservation | 2 | - | 2 |
| Administration | 3 | - | 3 |
| Alertes | - | 6 | 6 |
| **Total** | **25** | **6** | **31** |

**Implications architecturales des FRs :**
- FR1-FR6 (Auth) : Service d'authentification avec gestion sessions, nécessite middleware auth partagé
- FR7-FR14 (Films) : Couche de données films avec filtrage/recherche, cache essentiel
- FR15-FR17 (Séances) : Agrégation multi-cinémas, structuration par jour/cinéma/horaire
- FR18-FR20 (Watchlist) : CRUD utilisateur, synchronisation cross-device
- FR21-FR22 (Réservation) : Redirection externe, pas de traitement paiement
- FR23-FR25 (Admin) : Observabilité, métriques Prometheus, sync périodique

**Non-Functional Requirements:**

| Catégorie | NFRs clés | Impact architectural |
|-----------|-----------|---------------------|
| **Performance** | API < 200ms (cache), Mobile 60fps | Cache multi-niveau obligatoire, optimisation rendering |
| **Sécurité** | bcrypt, JWT 15min/30j, HTTPS | Middleware auth, stockage sécurisé tokens |
| **Intégration** | Rate limit 200ms, retry/fallback | Queue de requêtes, circuit breaker |
| **Fiabilité** | Offline avec cache, auto-restart | Cache local persistant, health checks |

**Scale & Complexity:**

- **Domaine principal** : Full-stack multi-plateforme (API + Web + Mobile)
- **Niveau de complexité** : Moyenne-Haute
- **Composants architecturaux estimés** : 8-10 (API, Web, Mobile, Auth, Cache, Scraper, DB, Monitoring)
- **Utilisateurs cibles** : ~20 (usage personnel + amis)
- **Volume données** : Faible (5 cinémas Brest/Landerneau)

### Technical Constraints & Dependencies

**Contraintes techniques identifiées :**

1. **AlloCiné API** — Scraping GraphQL sans contrat officiel
   - Peut changer sans préavis
   - Rate limiting strict (≥200ms entre appels)
   - IP ban si non respecté

2. **Stack imposée par PRD** :
   - API : Node.js + Fastify + Prisma
   - Web : React + Vite + Tailwind
   - Mobile : React Native + Expo + NativeWind
   - BDD : PostgreSQL (prod) / SQLite (dev)
   - Langage : TypeScript unifié

3. **Design system** — Thème vintage cinéma français à préserver
   - Palette couleurs définie (rouge cinéma, or antique, etc.)
   - Typographies spécifiques (Bebas Neue, Playfair Display, Crimson Text)

**Dépendances externes :**
- AlloCiné (source de données principale)
- Firebase Cloud Messaging (Phase 2 - notifications push)
- Sites de réservation cinémas (liens externes)

### Cross-Cutting Concerns Identified

| Concern | Composants affectés | Stratégie requise |
|---------|---------------------|-------------------|
| **Authentification** | API, Web, Mobile | JWT partagé, middleware unifié |
| **Caching** | API, Web, Mobile | 3 niveaux : mémoire, SQLite/AsyncStorage, API |
| **Gestion d'erreurs** | Tous | Patterns retry/fallback cohérents |
| **Logging/Monitoring** | API principalement | Logs structurés, Prometheus metrics |
| **Design tokens** | Web, Mobile | tailwind.config.js partagé |
| **Offline support** | Web (PWA), Mobile | Cache local, sync différée |
| **Accessibilité** | Web, Mobile | WCAG 2.1 AA, ARIA labels, touch targets |

## Starter Template Evaluation

### Primary Technology Domain

**Architecture Multi-Composants** basée sur les exigences du PRD :
- API Backend (Fastify + Prisma)
- Web Frontend (React + Vite + Tailwind)
- Mobile App (React Native + Expo + NativeWind)

### Starter Options Considered

#### Monorepo avec Turborepo + pnpm

| Critère | Évaluation |
|---------|------------|
| Partage de code | ✅ Types, config, composants UI |
| Performance CI | ✅ Cache intelligent (30s → 0.2s) |
| Maintenance | ✅ Un seul repo pour dev solo |
| Flexibilité | ✅ Apps indépendantes dans structure unifiée |

#### Starters par Composant

**API - Fastify + Prisma :**
- [DriftOS/fastify-starter](https://github.com/DriftOS/fastify-starter) — Prometheus, Grafana, Auth JWT, Docker, Tests ✅ Recommandé
- [mehdi-zayani/fastify-prisma-starter](https://github.com/mehdi-zayani/fastify-prisma-starter) — JWT, CRUD, Docker

**Web - React + Vite :**
- [Create Vite officiel](https://vite.dev/guide/) — Template react-ts, minimal, officiel ✅ Recommandé
- [riipandi/vite-react-template](https://github.com/riipandi/vite-react-template) — React Router, Hook Form, Vitest

**Mobile - Expo + NativeWind :**
- [Create Expo officiel](https://docs.expo.dev/more/create-expo/) — TypeScript, Expo Router ✅ Recommandé
- [ixartz/React-Native-Boilerplate](https://github.com/ixartz/React-Native-Boilerplate) — NativeWind, Jest, Detox

### Selected Starter: Monorepo Custom avec Turborepo

**Rationale for Selection:**

1. **Partage de code TypeScript** — Types API partagés entre Web et Mobile sans duplication
2. **Config unifiée** — Un seul `tailwind.config.js` pour les tokens de design vintage
3. **Développeur solo** — Maintenance simplifiée dans un repo unique
4. **Performance CI** — Cache Turborepo réduit drastiquement les temps de build
5. **NFRs couverts** — DriftOS starter inclut Prometheus/Grafana (FR23-24)

**Initialization Command:**

```bash
# 1. Créer le monorepo Turborepo
npx create-turbo@latest reeltime-v2 --package-manager pnpm

# 2. Nettoyer et restructurer
cd reeltime-v2
rm -rf apps/*

# 3. API (basé sur DriftOS starter)
cd apps
git clone --depth 1 https://github.com/DriftOS/fastify-starter api
cd api && rm -rf .git && pnpm install

# 4. Web app
npm create vite@latest web -- --template react-ts
cd web && pnpm install
pnpm add -D tailwindcss postcss autoprefixer

# 5. Mobile app
npx create-expo-app@latest mobile --template
cd mobile && pnpm add nativewind tailwindcss
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- TypeScript 5.x unifié sur tous les composants
- Node.js ≥18 pour l'API
- React 18+ pour Web et Mobile

**Styling Solution:**
- Tailwind CSS v3+ (Web)
- NativeWind v4 (Mobile)
- Configuration partagée via `packages/config/tailwind.config.js`

**Build Tooling:**
- Turborepo pour orchestration monorepo
- Vite + ESBuild pour le Web (HMR ultra-rapide)
- Metro bundler pour Mobile (Expo)
- pnpm workspaces pour package management

**Testing Framework:**
- Vitest pour API et Web (compatible Vite)
- Jest + Detox pour Mobile (standards Expo)

**Code Organization:**

```
reeltime-v2/
├── apps/
│   ├── api/          # Fastify + Prisma + Prometheus
│   ├── web/          # React + Vite + Tailwind
│   └── mobile/       # Expo + NativeWind
├── packages/
│   ├── ui/           # Composants partagés (FilmCard, ShowtimeChip)
│   ├── types/        # Types TypeScript partagés (Film, Showtime, User)
│   ├── config/       # ESLint, Tailwind, TypeScript configs
│   └── api-client/   # Client API typé (optionnel)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

**Development Experience:**
- Hot reload sur toutes les plateformes
- ESLint + Prettier partagés
- TypeScript strict mode
- Path aliases (`@reeltime/ui`, `@reeltime/types`)

**Note:** L'initialisation du projet avec ces commandes devrait être la première story d'implémentation.

## Core Architectural Decisions

### Decision Priority Analysis

**Décisions Critiques (Bloquent l'Implémentation) :**
- Stack technologique (PRD) ✅ Défini
- Structure monorepo (Step 3) ✅ Défini
- Stratégie de validation ✅ Zod
- Stratégie de cache ✅ In-memory
- Hébergement ✅ NAS personnel

**Décisions Importantes (Façonnent l'Architecture) :**
- Documentation API ✅ @fastify/swagger
- CI/CD ✅ GitHub Actions
- Reverse proxy ✅ Nginx Proxy Manager (existant)

**Décisions Différées (Post-MVP) :**
- Redis (si scaling nécessaire)
- CDN pour assets statiques
- Notifications push (Phase 2)

### Data Architecture

#### Validation des Données : Zod

| Aspect | Décision |
|--------|----------|
| **Librairie** | Zod |
| **Justification** | TypeScript-first, inférence automatique des types via `z.infer<>`, léger et performant |
| **Usage** | Validation des inputs API, formulaires Web/Mobile, parsing des réponses AlloCiné |
| **Affecte** | API, Web, Mobile |

```typescript
// Exemple de schema partagé dans packages/types
import { z } from 'zod';

export const FilmSchema = z.object({
  id: z.string(),
  title: z.string(),
  year: z.number().min(1880).max(2030),
  poster: z.string().url().optional(),
});

export type Film = z.infer<typeof FilmSchema>;
```

#### Stratégie de Cache : In-Memory (node-cache)

| Aspect | Décision |
|--------|----------|
| **Solution** | node-cache (in-memory) |
| **Justification** | ~20 utilisateurs, single instance, ultra-rapide, zéro dépendance externe |
| **TTL par défaut** | 6 heures (aligné sur refresh AlloCiné) |
| **Invalidation** | À minuit (00:00) + sur demande manuelle |
| **Affecte** | API uniquement |

**Architecture de cache multi-niveau :**

```
┌─────────────────────────────────────────────────┐
│  Niveau 1 : In-Memory (node-cache)              │
│  TTL: 6h | Accès: ~1ms | Invalidé à minuit      │
├─────────────────────────────────────────────────┤
│  Niveau 2 : PostgreSQL                          │
│  TTL: 7 jours | Accès: ~10ms | Fallback         │
├─────────────────────────────────────────────────┤
│  Niveau 3 : AlloCiné API                        │
│  Rate limit: 200ms | Accès: ~500ms-2s           │
└─────────────────────────────────────────────────┘
```

#### Base de Données : PostgreSQL + Prisma

| Aspect | Décision |
|--------|----------|
| **Production** | PostgreSQL 16 (sur NAS via Docker) |
| **Développement** | SQLite (fichier local) |
| **ORM** | Prisma |
| **Migrations** | Prisma Migrate |
| **Affecte** | API |

### Authentication & Security

#### Authentification : JWT (défini par PRD)

| Aspect | Décision |
|--------|----------|
| **Méthode** | JWT (Access + Refresh tokens) |
| **Access Token** | 15 minutes |
| **Refresh Token** | 30 jours |
| **Stockage Web** | localStorage (access) + httpOnly cookie (refresh) |
| **Stockage Mobile** | expo-secure-store |
| **Hash passwords** | bcrypt (≥10 rounds) |

#### Sécurité API

| Aspect | Décision |
|--------|----------|
| **HTTPS** | Obligatoire (via Nginx Proxy Manager + Let's Encrypt) |
| **CORS** | Whitelist des domaines autorisés |
| **Rate Limiting** | fastify-rate-limit (100 req/min général, 10/min auth) |
| **Helmet** | @fastify/helmet pour headers sécurité |

### API & Communication Patterns

#### Design API : REST + OpenAPI

| Aspect | Décision |
|--------|----------|
| **Style** | REST (aligné avec PRD) |
| **Documentation** | @fastify/swagger + @fastify/swagger-ui |
| **Versioning** | URL prefix `/api/v1/` |
| **Format réponse** | JSON avec structure cohérente |
| **Affecte** | API, Web, Mobile |

**Structure de réponse standardisée :**

```typescript
// Succès
{ data: T, meta?: { total, page, limit } }

// Erreur
{ error: { code: string, message: string, details?: any } }
```

#### Gestion des Erreurs

| Aspect | Décision |
|--------|----------|
| **Pattern** | Error codes standardisés + messages localisés |
| **Logging** | Pino (inclus avec Fastify) + format JSON |
| **Monitoring** | Prometheus metrics (DriftOS starter) |

### Frontend Architecture

#### State Management : Zustand + React Query (défini par PRD)

| Aspect | Décision |
|--------|----------|
| **État global** | Zustand (auth, préférences utilisateur) |
| **État serveur** | React Query / TanStack Query (films, séances) |
| **Persistance** | localStorage (Web), AsyncStorage (Mobile) |
| **Affecte** | Web, Mobile |

#### Composants Partagés

| Aspect | Décision |
|--------|----------|
| **Location** | `packages/ui/` |
| **Styling** | NativeWind (fonctionne Web + Mobile) |
| **Composants clés** | FilmCard, ShowtimeChip, FilterBar, BottomSheet |

### Infrastructure & Deployment

#### Hébergement : NAS Personnel

| Aspect | Décision |
|--------|----------|
| **Serveur** | NAS personnel avec Docker |
| **Reverse Proxy** | Nginx Proxy Manager (existant) |
| **SSL** | Let's Encrypt (géré par NPM) |
| **Coût** | 0€/mois |

**Architecture Docker sur NAS :**

```yaml
# docker-compose.yml
services:
  api:
    build: ./apps/api
    environment:
      - DATABASE_URL=postgresql://...
    restart: unless-stopped

  web:
    build: ./apps/web
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**Configuration Nginx Proxy Manager :**

| Domaine | Service | Port |
|---------|---------|------|
| `api.reeltime.{domain}` | api | 3000 |
| `reeltime.{domain}` | web | 80 |

#### CI/CD : GitHub Actions

| Aspect | Décision |
|--------|----------|
| **Plateforme** | GitHub Actions |
| **Trigger** | Push sur `main` |
| **Pipeline** | Lint → Test → Build → Push Docker → Deploy |
| **Registry** | GitHub Container Registry (ghcr.io) ou Docker Hub |

**Workflow simplifié :**

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm turbo run lint test build
      - run: docker build -t reeltime-api ./apps/api
      - run: docker build -t reeltime-web ./apps/web
      # Push to registry + SSH deploy to NAS
```

### Decision Impact Analysis

**Séquence d'Implémentation :**

1. **Setup Monorepo** — Turborepo + structure de base
2. **API Core** — Fastify + Prisma + Auth JWT
3. **Scraper AlloCiné** — Avec cache in-memory
4. **Web MVP** — React + pages principales
5. **Mobile MVP** — Expo + écrans principaux
6. **CI/CD** — GitHub Actions + Docker
7. **Déploiement NAS** — Docker Compose + NPM config

**Dépendances Cross-Composants :**

```
packages/types ──────┬──→ apps/api
                     ├──→ apps/web
                     └──→ apps/mobile

packages/config ─────┬──→ apps/api (eslint, tsconfig)
                     ├──→ apps/web (tailwind, eslint)
                     └──→ apps/mobile (tailwind, eslint)

packages/ui ─────────┬──→ apps/web
                     └──→ apps/mobile
```

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Points de conflit identifiés :** 12 zones où les agents IA pourraient faire des choix différents.

Ces patterns assurent que tout le code généré est cohérent et compatible.

### Naming Patterns

#### Database Naming (Prisma)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Tables | `snake_case` pluriel | `users`, `films`, `showtimes` |
| Colonnes | `snake_case` | `user_id`, `created_at`, `film_title` |
| Relations | `snake_case` | `user_watchlist`, `film_showtimes` |
| Index | `idx_{table}_{columns}` | `idx_users_email` |
| Foreign keys | `{table}_id` | `user_id`, `film_id` |

```prisma
// Exemple Prisma schema
model users {
  id            String   @id @default(uuid())
  email         String   @unique
  password_hash String
  created_at    DateTime @default(now())
  watchlist     watchlist[]

  @@index([email], name: "idx_users_email")
}
```

#### API Naming (REST)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Endpoints | `kebab-case` pluriel | `/api/v1/films`, `/api/v1/showtimes` |
| Paramètres URL | `:paramName` | `/films/:id`, `/cinemas/:cinemaId/showtimes` |
| Query params | `camelCase` | `?weekOffset=1&cinemaId=abc` |
| Headers custom | `X-Custom-Name` | `X-Request-Id`, `X-User-Id` |

```typescript
// Exemples d'endpoints
GET    /api/v1/films                    // Liste des films
GET    /api/v1/films/:id                // Détail d'un film
GET    /api/v1/films/:id/showtimes      // Séances d'un film
GET    /api/v1/cinemas                  // Liste des cinémas
GET    /api/v1/cinemas/:id/showtimes    // Séances d'un cinéma
POST   /api/v1/auth/login               // Connexion
POST   /api/v1/auth/register            // Inscription
GET    /api/v1/me/watchlist             // Watchlist utilisateur
POST   /api/v1/me/watchlist             // Ajouter à watchlist
DELETE /api/v1/me/watchlist/:id         // Retirer de watchlist
```

#### Code Naming (TypeScript)

| Élément | Convention | Exemple |
|---------|------------|---------|
| Fichiers composants | `PascalCase.tsx` | `FilmCard.tsx`, `ShowtimeChip.tsx` |
| Fichiers utils/services | `camelCase.ts` | `dateUtils.ts`, `apiClient.ts` |
| Fichiers routes API | `camelCase.ts` | `films.ts`, `auth.ts` |
| Fonctions | `camelCase` | `getFilmById()`, `formatShowtime()` |
| Variables | `camelCase` | `filmList`, `isLoading`, `currentUser` |
| Constantes | `UPPER_SNAKE_CASE` | `API_BASE_URL`, `CACHE_TTL_HOURS` |
| Types/Interfaces | `PascalCase` | `Film`, `Showtime`, `ApiResponse<T>` |
| Enums | `PascalCase.PascalCase` | `Version.VO`, `Version.VF` |
| Hooks | `useCamelCase` | `useFilms()`, `useAuth()` |
| Stores Zustand | `useCamelCaseStore` | `useAuthStore`, `useFiltersStore` |

### Structure Patterns

#### Project File Organization

```
apps/api/src/
├── routes/                 # Endpoints groupés par domaine
│   ├── auth.ts
│   ├── films.ts
│   ├── cinemas.ts
│   └── watchlist.ts
├── services/               # Logique métier
│   ├── filmService.ts
│   ├── allocineService.ts
│   └── cacheService.ts
├── repositories/           # Accès données (Prisma)
│   ├── filmRepository.ts
│   └── userRepository.ts
├── schemas/                # Zod schemas pour validation
│   ├── filmSchema.ts
│   └── authSchema.ts
├── middlewares/            # Middlewares Fastify
│   ├── authMiddleware.ts
│   └── errorMiddleware.ts
├── utils/                  # Helpers purs
│   ├── dateUtils.ts
│   └── stringUtils.ts
├── config/                 # Configuration
│   └── index.ts
├── app.ts                  # Setup Fastify
└── server.ts               # Entry point

apps/web/src/
├── components/             # Composants réutilisables
│   ├── FilmCard/
│   │   ├── FilmCard.tsx
│   │   ├── FilmCard.test.tsx
│   │   └── index.ts
│   └── ui/                 # Composants UI de base
├── pages/                  # Pages (routes)
│   ├── HomePage.tsx
│   ├── FilmPage.tsx
│   └── ProfilePage.tsx
├── hooks/                  # Custom hooks
│   ├── useFilms.ts
│   └── useAuth.ts
├── stores/                 # Zustand stores
│   ├── authStore.ts
│   └── filtersStore.ts
├── services/               # Appels API
│   └── api.ts
├── utils/                  # Helpers
└── App.tsx

apps/mobile/src/
├── components/             # Même structure que web
├── screens/                # Écrans (équivalent pages)
├── navigation/             # React Navigation config
├── hooks/
├── stores/
├── services/
└── App.tsx
```

#### Test File Location

| Type | Location | Nommage |
|------|----------|---------|
| Tests unitaires | Co-localisés | `Component.test.tsx` |
| Tests intégration | `__tests__/integration/` | `films.integration.test.ts` |
| Tests E2E | `__tests__/e2e/` | `auth.e2e.test.ts` |

### Format Patterns

#### API Response Format

```typescript
// Type de réponse standardisé
interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
}

interface ApiError {
  error: {
    code: string;      // Code machine: "FILM_NOT_FOUND"
    message: string;   // Message humain: "Le film demandé n'existe pas"
    details?: unknown; // Détails optionnels pour debug
  };
}

// Codes d'erreur standardisés
const ErrorCodes = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',

  // Resources
  FILM_NOT_FOUND: 'FILM_NOT_FOUND',
  CINEMA_NOT_FOUND: 'CINEMA_NOT_FOUND',
  SHOWTIME_NOT_FOUND: 'SHOWTIME_NOT_FOUND',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // System
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  ALLOCINE_UNAVAILABLE: 'ALLOCINE_UNAVAILABLE',
} as const;
```

#### HTTP Status Codes

| Code | Usage |
|------|-------|
| `200` | Succès GET, PUT, PATCH |
| `201` | Succès POST (création) |
| `204` | Succès DELETE (pas de contenu) |
| `400` | Erreur validation / requête invalide |
| `401` | Non authentifié |
| `403` | Authentifié mais pas autorisé |
| `404` | Ressource non trouvée |
| `429` | Rate limit atteint |
| `500` | Erreur serveur interne |

#### JSON Data Format

| Élément | Convention | Exemple |
|---------|------------|---------|
| Champs | `camelCase` | `filmId`, `createdAt` |
| Dates | ISO 8601 UTC | `"2026-02-04T20:30:00Z"` |
| Booléens | `true`/`false` | `isInWatchlist: true` |
| Null | Explicite | `poster: null` (jamais absent) |
| Arrays vides | `[]` | `showtimes: []` |

```json
{
  "data": {
    "id": "abc123",
    "title": "Dune: Part Two",
    "year": 2024,
    "poster": "https://...",
    "rating": 8.5,
    "isInWatchlist": false,
    "showtimes": [
      {
        "id": "st1",
        "cinemaId": "pathe-brest",
        "cinemaName": "Pathé Brest",
        "datetime": "2026-02-04T20:30:00Z",
        "version": "VO",
        "bookingUrl": "https://..."
      }
    ],
    "createdAt": "2026-02-01T10:00:00Z",
    "updatedAt": "2026-02-04T08:00:00Z"
  }
}
```

### Communication Patterns

#### State Management (Zustand)

```typescript
// Pattern de store Zustand
interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// Nommage des actions: verbe + Noun
// login, logout, fetchUser, setUser, clearError, updateProfile
```

#### React Query Keys

```typescript
// Pattern de query keys hiérarchiques
const queryKeys = {
  films: {
    all: ['films'] as const,
    list: (weekOffset: number) => ['films', 'list', weekOffset] as const,
    detail: (id: string) => ['films', 'detail', id] as const,
    showtimes: (id: string) => ['films', id, 'showtimes'] as const,
  },
  cinemas: {
    all: ['cinemas'] as const,
    detail: (id: string) => ['cinemas', id] as const,
  },
  watchlist: {
    all: ['watchlist'] as const,
  },
};
```

### Process Patterns

#### Error Handling

```typescript
// API - Pattern try/catch unifié
async function getFilmById(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as { id: string };
    const film = await filmService.getById(id);

    if (!film) {
      return reply.status(404).send({
        error: {
          code: 'FILM_NOT_FOUND',
          message: 'Le film demandé n\'existe pas',
        },
      });
    }

    return reply.send({ data: film });
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Une erreur est survenue',
      },
    });
  }
}

// Frontend - Pattern avec React Query
function useFilm(id: string) {
  return useQuery({
    queryKey: queryKeys.films.detail(id),
    queryFn: () => api.getFilm(id),
    retry: 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Composant - Pattern de rendu conditionnel
function FilmPage({ id }: { id: string }) {
  const { data, isLoading, error } = useFilm(id);

  if (isLoading) return <FilmSkeleton />;
  if (error) return <ErrorState message={error.message} />;
  if (!data) return <NotFound />;

  return <FilmDetail film={data} />;
}
```

#### Loading States

```typescript
// Pattern unifié pour états async
interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

// Nommage cohérent
// ✅ isLoading, isSubmitting, isFetching
// ❌ loading, load, fetching

// Composants de loading
<Skeleton />        // Placeholder animé
<Spinner />         // Indicateur rotatif
<FilmCardSkeleton /> // Skeleton spécifique
```

### Enforcement Guidelines

#### All AI Agents MUST:

1. **Suivre les conventions de nommage** définies ci-dessus sans exception
2. **Utiliser les types partagés** de `packages/types` au lieu de redéfinir
3. **Respecter la structure de réponse API** `{ data }` / `{ error }`
4. **Valider avec Zod** tous les inputs API
5. **Utiliser les query keys** du pattern défini pour React Query
6. **Logger les erreurs** avec `request.log.error()` côté API
7. **Gérer les états** loading/error/success dans tous les composants

#### Pattern Verification

| Outil | Vérifie |
|-------|---------|
| ESLint | Conventions de nommage, imports |
| TypeScript | Types, null checks |
| Prettier | Formatage code |
| Prisma | Schéma DB |
| CI Pipeline | Lint + Tests avant merge |

### Pattern Examples

#### Good Examples ✅

```typescript
// ✅ Bon: Nommage cohérent
const filmList = await filmService.getFilmsForWeek(weekOffset);
const isLoading = true;
const CACHE_TTL_HOURS = 6;

// ✅ Bon: Réponse API standardisée
return reply.send({ data: films, meta: { total, page, limit } });

// ✅ Bon: Gestion d'erreur
if (!film) {
  return reply.status(404).send({
    error: { code: 'FILM_NOT_FOUND', message: 'Film non trouvé' }
  });
}

// ✅ Bon: Hook avec query key
const { data } = useQuery({
  queryKey: queryKeys.films.detail(id),
  queryFn: () => api.getFilm(id),
});
```

#### Anti-Patterns ❌

```typescript
// ❌ Mauvais: Nommage incohérent
const film_list = await filmService.get_films(); // snake_case
const Loading = true; // PascalCase pour variable
const cacheTtl = 6; // devrait être UPPER_SNAKE_CASE

// ❌ Mauvais: Réponse non standardisée
return reply.send(films); // Pas de wrapper { data }
return reply.send({ films }); // Mauvaise clé

// ❌ Mauvais: Pas de gestion d'erreur
const film = await filmService.getById(id);
return reply.send({ data: film }); // Et si film est null?

// ❌ Mauvais: Query key ad-hoc
const { data } = useQuery({
  queryKey: ['film', id], // Pas le pattern défini
  queryFn: () => api.getFilm(id),
});
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
reeltime-v2/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # Lint + Test + Build
│       └── deploy.yml                # Build Docker + Deploy NAS
├── .husky/
│   └── pre-commit                    # Lint staged files
├── .vscode/
│   ├── settings.json
│   └── extensions.json
│
├── apps/
│   ├── api/                          # ═══ FASTIFY API ═══
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── auth.ts           # POST /auth/login, /auth/register
│   │   │   │   ├── films.ts          # GET /films, /films/:id
│   │   │   │   ├── cinemas.ts        # GET /cinemas, /cinemas/:id/showtimes
│   │   │   │   ├── watchlist.ts      # GET/POST/DELETE /me/watchlist
│   │   │   │   ├── admin.ts          # GET /admin/stats, /admin/refresh
│   │   │   │   └── index.ts          # Route registration
│   │   │   ├── services/
│   │   │   │   ├── authService.ts
│   │   │   │   ├── filmService.ts
│   │   │   │   ├── showtimeService.ts
│   │   │   │   ├── allocineService.ts    # Scraper AlloCiné
│   │   │   │   ├── cacheService.ts       # node-cache wrapper
│   │   │   │   └── index.ts
│   │   │   ├── repositories/
│   │   │   │   ├── userRepository.ts
│   │   │   │   ├── filmRepository.ts
│   │   │   │   ├── watchlistRepository.ts
│   │   │   │   └── index.ts
│   │   │   ├── schemas/
│   │   │   │   ├── authSchema.ts         # Zod schemas auth
│   │   │   │   ├── filmSchema.ts
│   │   │   │   ├── watchlistSchema.ts
│   │   │   │   └── index.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── authMiddleware.ts     # JWT verification
│   │   │   │   ├── errorMiddleware.ts    # Global error handler
│   │   │   │   └── index.ts
│   │   │   ├── plugins/
│   │   │   │   ├── swagger.ts            # @fastify/swagger config
│   │   │   │   ├── cors.ts
│   │   │   │   ├── rateLimit.ts
│   │   │   │   └── prometheus.ts         # Metrics
│   │   │   ├── utils/
│   │   │   │   ├── dateUtils.ts
│   │   │   │   ├── jwtUtils.ts
│   │   │   │   └── index.ts
│   │   │   ├── config/
│   │   │   │   └── index.ts              # Environment config
│   │   │   ├── app.ts                    # Fastify app setup
│   │   │   └── server.ts                 # Entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts                   # Seed cinemas
│   │   ├── __tests__/
│   │   │   ├── routes/
│   │   │   │   ├── auth.test.ts
│   │   │   │   └── films.test.ts
│   │   │   ├── services/
│   │   │   │   └── allocineService.test.ts
│   │   │   └── setup.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── web/                          # ═══ REACT WEB APP ═══
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── films/
│   │   │   │   │   ├── FilmCard.tsx
│   │   │   │   │   ├── FilmGrid.tsx
│   │   │   │   │   ├── FilmDrawer.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── showtimes/
│   │   │   │   │   ├── ShowtimeChip.tsx
│   │   │   │   │   ├── ShowtimeList.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── filters/
│   │   │   │   │   ├── FilterBar.tsx
│   │   │   │   │   ├── CinemaFilter.tsx
│   │   │   │   │   ├── VersionFilter.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Footer.tsx
│   │   │   │   │   ├── TabBar.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── auth/
│   │   │   │   │   ├── LoginForm.tsx
│   │   │   │   │   ├── RegisterForm.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── ui/
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Skeleton.tsx
│   │   │   │   │   ├── Toast.tsx
│   │   │   │   │   ├── EmptyState.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── pages/
│   │   │   │   ├── HomePage.tsx
│   │   │   │   ├── FilmPage.tsx
│   │   │   │   ├── SearchPage.tsx
│   │   │   │   ├── WatchlistPage.tsx
│   │   │   │   ├── ProfilePage.tsx
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── RegisterPage.tsx
│   │   │   │   └── NotFoundPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useFilms.ts
│   │   │   │   ├── useCinemas.ts
│   │   │   │   ├── useWatchlist.ts
│   │   │   │   ├── useAuth.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── authStore.ts
│   │   │   │   ├── filtersStore.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── api.ts                # API client
│   │   │   │   └── queryKeys.ts
│   │   │   ├── utils/
│   │   │   │   ├── dateUtils.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   └── index.ts
│   │   │   ├── styles/
│   │   │   │   └── globals.css           # Tailwind imports
│   │   │   ├── App.tsx
│   │   │   ├── router.tsx                # React Router config
│   │   │   └── main.tsx                  # Entry point
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── logo.svg
│   │   │   └── fonts/                    # Bebas, Playfair, Crimson
│   │   ├── __tests__/
│   │   │   ├── components/
│   │   │   └── pages/
│   │   ├── index.html
│   │   ├── Dockerfile
│   │   ├── nginx.conf                    # Production serving
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── vitest.config.ts
│   │
│   └── mobile/                       # ═══ EXPO MOBILE APP ═══
│       ├── src/
│       │   ├── components/           # Même structure que web
│       │   │   ├── films/
│       │   │   ├── showtimes/
│       │   │   ├── filters/
│       │   │   ├── auth/
│       │   │   └── ui/
│       │   ├── screens/
│       │   │   ├── HomeScreen.tsx
│       │   │   ├── FilmScreen.tsx
│       │   │   ├── SearchScreen.tsx
│       │   │   ├── WatchlistScreen.tsx
│       │   │   ├── ProfileScreen.tsx
│       │   │   ├── LoginScreen.tsx
│       │   │   └── RegisterScreen.tsx
│       │   ├── navigation/
│       │   │   ├── TabNavigator.tsx
│       │   │   ├── AuthNavigator.tsx
│       │   │   └── RootNavigator.tsx
│       │   ├── hooks/
│       │   ├── stores/
│       │   ├── services/
│       │   │   └── api.ts
│       │   ├── utils/
│       │   └── App.tsx
│       ├── assets/
│       │   ├── images/
│       │   └── fonts/
│       ├── app.json                  # Expo config
│       ├── eas.json                  # EAS Build config
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       ├── metro.config.js
│       └── babel.config.js
│
├── packages/
│   ├── types/                        # ═══ TYPES PARTAGÉS ═══
│   │   ├── src/
│   │   │   ├── film.ts               # Film, Showtime types
│   │   │   ├── user.ts               # User, AuthResponse
│   │   │   ├── cinema.ts             # Cinema types
│   │   │   ├── api.ts                # ApiResponse, ApiError
│   │   │   └── index.ts              # Re-exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── config/                       # ═══ CONFIGS PARTAGÉES ═══
│   │   ├── eslint/
│   │   │   ├── base.js
│   │   │   ├── react.js
│   │   │   └── node.js
│   │   ├── typescript/
│   │   │   ├── base.json
│   │   │   ├── react.json
│   │   │   └── node.json
│   │   ├── tailwind/
│   │   │   └── preset.js             # Tokens vintage
│   │   └── package.json
│   │
│   ├── ui/                           # ═══ COMPOSANTS PARTAGÉS ═══
│   │   ├── src/
│   │   │   ├── FilmCard/
│   │   │   │   ├── FilmCard.tsx
│   │   │   │   ├── FilmCard.test.tsx
│   │   │   │   └── index.ts
│   │   │   ├── ShowtimeChip/
│   │   │   ├── Button/
│   │   │   ├── Input/
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api-client/                   # ═══ CLIENT API TYPÉ ═══
│       ├── src/
│       │   ├── client.ts             # Fetch wrapper
│       │   ├── endpoints/
│       │   │   ├── auth.ts
│       │   │   ├── films.ts
│       │   │   ├── cinemas.ts
│       │   │   └── watchlist.ts
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── docker/
│   └── docker-compose.yml            # Prod compose pour NAS
│
├── docs/
│   ├── api.md                        # Documentation API
│   ├── deployment.md                 # Guide déploiement NAS
│   └── development.md                # Guide développement
│
├── .env.example
├── .gitignore
├── .npmrc
├── .prettierrc
├── package.json                      # Root workspace
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

### Architectural Boundaries

#### API Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        EXTERNAL                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Web App   │  │ Mobile App  │  │   Nginx Proxy Mgr   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│         └────────────────┼─────────────────────┘             │
│                          │ HTTPS                             │
├──────────────────────────┼───────────────────────────────────┤
│                    API BOUNDARY                              │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │                 Fastify Routes                         │  │
│  │  /api/v1/auth/*  /api/v1/films/*  /api/v1/cinemas/*   │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │               Middlewares                              │  │
│  │  authMiddleware ─── rateLimit ─── errorHandler        │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
├──────────────────────────┼───────────────────────────────────┤
│                  SERVICE BOUNDARY                            │
│                          │                                   │
│  ┌─────────┐  ┌─────────▼─────────┐  ┌─────────────────┐   │
│  │  Cache  │◄─┤    Services       │──►│   AlloCiné     │   │
│  │(node-   │  │  filmService      │   │   Scraper      │   │
│  │ cache)  │  │  authService      │   │  (rate limited)│   │
│  └─────────┘  └─────────┬─────────┘   └─────────────────┘   │
│                         │                                    │
├─────────────────────────┼────────────────────────────────────┤
│                   DATA BOUNDARY                              │
│                         │                                    │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │              Repositories (Prisma)                     │  │
│  │  userRepository ─── filmRepository ─── watchlistRepo  │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │                                    │
│  ┌──────────────────────▼────────────────────────────────┐  │
│  │                  PostgreSQL                            │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### Data Flow

```
User Action (tap film)
       │
       ▼
┌─────────────────┐
│  React Query    │ ◄─── Cache check (staleTime: 5min)
│  useFilm(id)    │
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│  API Client     │ ◄─── packages/api-client
│  api.getFilm()  │
└────────┬────────┘
         │ HTTP GET /api/v1/films/:id
         ▼
┌─────────────────┐
│  Fastify Route  │ ◄─── apps/api/src/routes/films.ts
│  films.ts       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  filmService    │ ◄─── Check node-cache first
└────────┬────────┘
         │ miss
         ▼
┌─────────────────┐
│  filmRepository │ ◄─── Prisma query
└────────┬────────┘
         │ miss (or stale)
         ▼
┌─────────────────┐
│ allocineService │ ◄─── Scrape + rate limit 200ms
└────────┬────────┘
         │
         ▼
    Response { data: Film }
```

### Requirements to Structure Mapping

| FR | Description | Fichiers principaux |
|----|-------------|---------------------|
| **FR1** | Consultation sans compte | `authMiddleware.ts` (optional) |
| **FR2** | Inscription | `routes/auth.ts`, `RegisterForm.tsx` |
| **FR3** | Connexion | `routes/auth.ts`, `LoginForm.tsx` |
| **FR4** | Déconnexion | `authStore.ts` (logout action) |
| **FR5** | Profil | `ProfilePage.tsx`, `ProfileScreen.tsx` |
| **FR6** | Session persistante | `jwtUtils.ts`, `authMiddleware.ts` |
| **FR7** | Liste films | `routes/films.ts`, `FilmGrid.tsx` |
| **FR8** | Recherche | `routes/films.ts` (query param), `SearchPage.tsx` |
| **FR9** | Filtre cinéma | `filtersStore.ts`, `CinemaFilter.tsx` |
| **FR10** | Filtre version | `filtersStore.ts`, `VersionFilter.tsx` |
| **FR11** | Filtre horaire | `filtersStore.ts`, `FilterBar.tsx` |
| **FR12** | Filtre note | `filtersStore.ts`, `FilterBar.tsx` |
| **FR13** | Détail film | `routes/films.ts`, `FilmDrawer.tsx` |
| **FR14** | Navigation semaines | `useFilms.ts` (weekOffset) |
| **FR15-17** | Séances | `showtimeService.ts`, `ShowtimeList.tsx` |
| **FR18** | Ajouter watchlist | `routes/watchlist.ts`, `ShowtimeChip.tsx` |
| **FR19** | Voir watchlist | `WatchlistPage.tsx` |
| **FR20** | Retirer watchlist | `routes/watchlist.ts` |
| **FR21-22** | Réservation | `ShowtimeChip.tsx` (external link) |
| **FR23** | Logs | `Pino` (Fastify built-in) |
| **FR24** | Prometheus | `plugins/prometheus.ts` |
| **FR25** | Sync AlloCiné | `allocineService.ts`, `cacheService.ts` |

### Integration Points

#### Internal Communication

| De | Vers | Méthode |
|----|------|---------|
| Web/Mobile | API | HTTP REST via `api-client` |
| Components | Stores | Zustand hooks |
| Components | Server State | React Query hooks |
| Services | Repositories | Direct function calls |
| Services | Cache | `cacheService` wrapper |

#### External Integrations

| Service | Usage | Fichier |
|---------|-------|---------|
| **AlloCiné** | Source données films/séances | `allocineService.ts` |
| **Sites cinémas** | Liens réservation | URLs dans `Showtime.bookingUrl` |
| **Let's Encrypt** | SSL certificates | Via Nginx Proxy Manager |

### File Organization Patterns

#### Configuration Files

| Fichier | Location | Scope |
|---------|----------|-------|
| `turbo.json` | Root | Turborepo pipeline |
| `pnpm-workspace.yaml` | Root | Workspace packages |
| `tsconfig.json` | Each app/package | TypeScript (extends shared) |
| `tailwind.config.ts` | Web, Mobile | Extends `packages/config/tailwind` |
| `.env` | Each app | Environment variables |
| `docker-compose.yml` | `docker/` | Production deployment |

#### Environment Files

```
.env.example          # Template (committed)
apps/api/.env         # API secrets (gitignored)
apps/web/.env         # Web config (gitignored)
apps/mobile/.env      # Mobile config (gitignored)
```

**Variables requises :**

```bash
# apps/api/.env
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ALLOCINE_RATE_LIMIT_MS=200

# apps/web/.env
VITE_API_URL=https://api.reeltime.example.com

# apps/mobile/.env
EXPO_PUBLIC_API_URL=https://api.reeltime.example.com
```

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
Toutes les technologies choisies fonctionnent ensemble sans conflit :
- TypeScript 5.x compatible avec Fastify, React, Expo, Prisma
- Tailwind CSS partageable entre Web (natif) et Mobile (NativeWind)
- Zustand + React Query pattern éprouvé pour state management
- Monorepo Turborepo supporte tous les packages

**Pattern Consistency:**
Les patterns d'implémentation sont cohérents avec la stack :
- Nommage snake_case pour DB aligné avec conventions Prisma
- Nommage camelCase pour JSON aligné avec JavaScript/TypeScript
- Structure de réponse API `{ data }` compatible React Query
- Query keys hiérarchiques pour cache management optimal

**Structure Alignment:**
La structure projet supporte toutes les décisions architecturales :
- Monorepo permet le partage de types et config
- Séparation apps/packages respecte les boundaries
- Chaque app a sa propre config tout en étendant les configs partagées

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| Domaine | FRs | Couverture | Status |
|---------|-----|------------|--------|
| Gestion Utilisateurs | FR1-6 | 6/6 | ✅ |
| Découverte Films | FR7-14 | 8/8 | ✅ |
| Séances | FR15-17 | 3/3 | ✅ |
| Watchlist | FR18-20 | 3/3 | ✅ |
| Réservation | FR21-22 | 2/2 | ✅ |
| Administration | FR23-25 | 3/3 | ✅ |
| **Total MVP** | **25** | **25/25** | ✅ |

**Non-Functional Requirements Coverage:**

| NFR | Exigence | Solution Architecturale | Status |
|-----|----------|------------------------|--------|
| NFR1 | API < 200ms (hot cache) | node-cache in-memory | ✅ |
| NFR2 | API < 2s (cold cache) | PostgreSQL + Prisma | ✅ |
| NFR3 | Sync AlloCiné < 1s | Rate limit 200ms, batch | ✅ |
| NFR4 | Mobile 60fps | NativeWind, React Native optimizations | ✅ |
| NFR5-6 | Chargement < 3s | Vite, code splitting | ✅ |
| NFR7-11 | Sécurité | bcrypt, JWT, HTTPS, Helmet | ✅ |
| NFR12-15 | Intégration | Rate limit, retry, CORS | ✅ |
| NFR16-18 | Fiabilité | Cache offline, Docker restart | ✅ |

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ Toutes les technologies versionnées (TypeScript 5.x, Node ≥18, etc.)
- ✅ Patterns d'implémentation documentés avec exemples
- ✅ Règles de cohérence claires et vérifiables
- ✅ Anti-patterns identifiés et documentés

**Structure Completeness:**
- ✅ Arborescence projet complète (100+ fichiers définis)
- ✅ Tous les répertoires et fichiers spécifiés
- ✅ Points d'intégration clairement documentés
- ✅ Boundaries de composants bien définis

**Pattern Completeness:**
- ✅ Conventions de nommage pour DB, API, code
- ✅ Patterns de communication (REST, Zustand, React Query)
- ✅ Gestion d'erreurs standardisée
- ✅ Loading states et feedback patterns

### Gap Analysis Results

**Critical Gaps:** Aucun ✅

**Important Gaps (non-bloquants) :**

| Gap | Impact | Résolution |
|-----|--------|------------|
| Tests E2E non détaillés | Moyen | Phase post-MVP, ajouter Playwright |
| Seed data cinémas | Faible | Créer `prisma/seed.ts` à l'init |

**Nice-to-Have Gaps :**
- Storybook pour documentation UI
- Dashboard Grafana pré-configuré
- Hooks pre-commit détaillés (Husky)

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Contexte projet analysé en profondeur
- [x] Scale et complexité évalués
- [x] Contraintes techniques identifiées
- [x] Concerns transversaux mappés

**✅ Architectural Decisions**
- [x] Décisions critiques documentées avec versions
- [x] Stack technologique entièrement spécifiée
- [x] Patterns d'intégration définis
- [x] Considérations de performance adressées

**✅ Implementation Patterns**
- [x] Conventions de nommage établies
- [x] Patterns de structure définis
- [x] Patterns de communication spécifiés
- [x] Patterns de process documentés

**✅ Project Structure**
- [x] Structure de répertoires complète définie
- [x] Boundaries de composants établis
- [x] Points d'intégration mappés
- [x] Mapping exigences → structure complet

### Architecture Readiness Assessment

**Overall Status:** ✅ READY FOR IMPLEMENTATION

**Confidence Level:** HIGH

**Key Strengths:**
- Stack moderne et cohérente (TypeScript unifié)
- Patterns clairs évitant les conflits entre agents IA
- Monorepo optimisé pour partage de code
- 100% des FRs et NFRs architecturalement couverts
- Hébergement défini (NAS + Nginx Proxy Manager)

**Areas for Future Enhancement:**
- Tests E2E avec Playwright/Detox
- Dashboard monitoring Grafana
- Documentation Storybook pour composants UI
- CI/CD amélioré avec previews

### Implementation Handoff

**AI Agent Guidelines:**
1. Suivre toutes les décisions architecturales exactement comme documentées
2. Utiliser les patterns d'implémentation de manière cohérente
3. Respecter la structure projet et les boundaries
4. Référer à ce document pour toute question architecturale
5. Utiliser les types de `packages/types` au lieu de redéfinir
6. Respecter le rate limit AlloCiné (≥200ms entre appels)

**First Implementation Priority:**

```bash
# 1. Créer le monorepo
npx create-turbo@latest reeltime-v2 --package-manager pnpm

# 2. Configurer la structure
cd reeltime-v2
# Suivre les commandes d'initialisation de la section "Starter Template"
```

**Séquence d'implémentation recommandée:**
1. Setup Monorepo + packages partagés
2. API Core (auth, films, cinémas)
3. Scraper AlloCiné + cache
4. Web MVP
5. Mobile MVP
6. CI/CD + Docker
7. Déploiement NAS

