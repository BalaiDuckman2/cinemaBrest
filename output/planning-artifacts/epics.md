---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: 'complete'
completedAt: '2026-02-04'
inputDocuments:
  - 'output/planning-artifacts/prd.md'
  - 'output/planning-artifacts/architecture.md'
  - 'output/planning-artifacts/ux-design-specification.md'
---

# ReelTime v2 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for ReelTime v2, decomposing the requirements from the PRD, UX Design, and Architecture documents into implementable stories.

## Requirements Inventory

### Functional Requirements

**Gestion des Utilisateurs (MVP)**

| # | Exigence |
|---|----------|
| FR1 | Un visiteur peut consulter films et séances sans compte |
| FR2 | Un visiteur peut créer un compte (email + mot de passe) |
| FR3 | Un utilisateur peut se connecter |
| FR4 | Un utilisateur peut se déconnecter |
| FR5 | Un utilisateur connecté peut consulter son profil |
| FR6 | Le système maintient la session entre visites |

**Découverte de Films (MVP)**

| # | Exigence |
|---|----------|
| FR7 | Un utilisateur peut voir la liste des films à l'affiche |
| FR8 | Un utilisateur peut rechercher un film par titre |
| FR9 | Un utilisateur peut filtrer par cinéma |
| FR10 | Un utilisateur peut filtrer par version (VO/VF) |
| FR11 | Un utilisateur peut filtrer par horaire minimum |
| FR12 | Un utilisateur peut filtrer par note |
| FR13 | Un utilisateur peut voir le détail d'un film |
| FR14 | Un utilisateur peut naviguer entre les semaines |

**Gestion des Séances (MVP)**

| # | Exigence |
|---|----------|
| FR15 | Un utilisateur peut voir les séances par film/cinéma/jour |
| FR16 | Un utilisateur peut voir les infos d'une séance |
| FR17 | Un utilisateur peut voir la liste des cinémas |

**Watchlist (MVP)**

| # | Exigence |
|---|----------|
| FR18 | Un utilisateur connecté peut ajouter à sa watchlist |
| FR19 | Un utilisateur connecté peut consulter sa watchlist |
| FR20 | Un utilisateur connecté peut retirer de sa watchlist |

**Réservation (MVP)**

| # | Exigence |
|---|----------|
| FR21 | Un utilisateur peut accéder au lien de réservation externe |
| FR22 | Le lien ouvre le site du cinéma correspondant |

**Administration (MVP)**

| # | Exigence |
|---|----------|
| FR23 | Le système génère des logs structurés |
| FR24 | Le système expose des métriques Prometheus |
| FR25 | Le système synchronise avec AlloCiné périodiquement |

**Phase 2 - Alertes**

| # | Exigence |
|---|----------|
| FR26 | Un utilisateur peut créer une alerte sur un film |
| FR27 | Un utilisateur peut configurer les critères d'alerte |
| FR28 | Un utilisateur peut consulter ses alertes |
| FR29 | Un utilisateur peut supprimer une alerte |
| FR30 | Le système envoie une notification push sur match |
| FR31 | Un utilisateur peut accéder au film depuis la notification |

**Récapitulatif FRs**

| Phase | Domaine | Nombre |
|-------|---------|--------|
| MVP | Gestion Utilisateurs | 6 |
| MVP | Découverte Films | 8 |
| MVP | Séances | 3 |
| MVP | Watchlist | 3 |
| MVP | Réservation | 2 |
| MVP | Administration | 3 |
| **MVP Total** | | **25** |
| Phase 2 | Alertes | 6 |
| **Total** | | **31** |

### NonFunctional Requirements

**Performance**

| # | Exigence | Cible |
|---|----------|-------|
| NFR1 | Temps réponse API (hot cache) | < 200ms |
| NFR2 | Temps réponse API (cold cache) | < 2s |
| NFR3 | Temps sync AlloCiné par cinéma | < 1s |
| NFR4 | Fluidité animations mobile | 60 FPS |
| NFR5 | Chargement initial Web | < 3s |
| NFR6 | Chargement initial Mobile | < 2s |

**Sécurité**

| # | Exigence |
|---|----------|
| NFR7 | Mots de passe hashés bcrypt (≥10 rounds) |
| NFR8 | Communications HTTPS |
| NFR9 | JWT : 15min (access) / 30 jours (refresh) |
| NFR10 | RGPD : droit à l'effacement |
| NFR11 | Aucun mot de passe en clair |

**Intégration**

| # | Exigence |
|---|----------|
| NFR12 | Gestion gracieuse erreurs AlloCiné (retry, fallback) |
| NFR13 | Rate limiting AlloCiné respecté (≥200ms) |
| NFR14 | Liens externes en nouvel onglet/app |
| NFR15 | Ajout cinémas sans modification code |

**Fiabilité**

| # | Exigence |
|---|----------|
| NFR16 | Fonctionne si AlloCiné indisponible (cache) |
| NFR17 | Logs avec contexte suffisant pour debug |
| NFR18 | Restart automatique après crash (Docker) |

**Récapitulatif NFRs**

| Catégorie | Nombre |
|-----------|--------|
| Performance | 6 |
| Sécurité | 5 |
| Intégration | 4 |
| Fiabilité | 3 |
| **Total** | **18** |

### Additional Requirements

**Architecture - Starter Template & Infrastructure**

- **Monorepo Turborepo + pnpm** : Structure `apps/` (api, web, mobile) + `packages/` (types, config, ui, api-client)
- **Initialisation projet** : Commandes Turborepo + starters spécifiques (DriftOS pour API, Vite pour Web, Expo pour Mobile)
- **TypeScript 5.x unifié** : Langage partagé sur tous les composants
- **Hébergement NAS** : Docker + Nginx Proxy Manager + Let's Encrypt
- **CI/CD GitHub Actions** : Lint → Test → Build → Push Docker → Deploy

**Architecture - Stack Technologique**

- **API** : Node.js + Fastify + Prisma + Zod (validation)
- **Web** : React + Vite + Tailwind + React Router + Zustand + React Query
- **Mobile** : React Native + Expo + NativeWind + React Navigation + expo-secure-store
- **Base de données** : PostgreSQL (prod) / SQLite (dev)
- **Cache** : node-cache (in-memory) avec TTL 6h, invalidation à minuit
- **Auth** : JWT (access 15min, refresh 30j), bcrypt, httpOnly cookies
- **API Documentation** : @fastify/swagger + @fastify/swagger-ui

**Architecture - Patterns d'Implémentation**

- **Naming DB** : snake_case (tables, colonnes)
- **Naming API** : kebab-case (endpoints), camelCase (query params, JSON)
- **Naming Code** : PascalCase (composants, types), camelCase (fonctions, variables)
- **Réponse API** : `{ data }` / `{ error: { code, message } }`
- **Query Keys** : Hiérarchiques (ex: `['films', 'detail', id]`)
- **Error Handling** : Codes standardisés (FILM_NOT_FOUND, UNAUTHORIZED, etc.)

**UX Design - Identité Visuelle**

- **Thème** : Cinéma vintage français / Art Déco
- **Palette** : Rouge cinéma (#D32F2F), Or antique (#FFD54F), Crème écran (#FFF8E1), Noir velours (#1A1A1A)
- **Typographies** : Bebas Neue (headlines), Playfair Display (titres films), Crimson Text (corps)
- **Modes** : Clair (défaut) + Sombre (prefers-color-scheme)
- **Textures** : Grain vintage, effet papier vieilli, coin coupé ticket

**UX Design - Composants**

- **FilmCard** : Carte ticket avec coin coupé, hover spotlight
- **ShowtimeChip** : Bouton horaire stylisé (rouge/or si watchlist)
- **FilmDrawer** : Bottom sheet détail film avec séances
- **FilterChip** : Toggle filtres (cinéma, version, horaire)
- **TabBar** : Navigation mobile (Films, Recherche, Calendrier, Profil)
- **WeekNavigator** : Navigation semaines avec swipe
- **Skeleton** : Loading vintage avec forme ticket
- **EmptyState** : Illustrations vintage (bobine, clap)
- **Toast** : Feedback non-bloquant

**UX Design - Interactions**

- **Tap** : Action primaire (réservation)
- **Long press** : Action secondaire (watchlist)
- **Swipe horizontal** : Navigation jours/semaines
- **Pull-to-refresh** : Animation bobine vintage
- **Haptic feedback** : Sur mobile pour confirmations

**UX Design - Accessibilité**

- **WCAG 2.1 AA** : Contraste minimum, touch targets 44x44px
- **Screen readers** : Labels ARIA, aria-live pour toasts
- **Clavier (Web)** : Tab navigation, raccourcis (/, ←, →, Escape)
- **Préférences système** : prefers-color-scheme, prefers-reduced-motion, prefers-contrast

**UX Design - Responsive**

- **Mobile** : < 640px, 2 colonnes, TabBar bottom
- **Tablet** : 640-1024px, 3 colonnes, TabBar bottom
- **Desktop** : > 1024px, 4-5 colonnes, Sidebar navigation

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 2 | Consultation sans compte |
| FR2 | Epic 3 | Création de compte |
| FR3 | Epic 3 | Connexion |
| FR4 | Epic 3 | Déconnexion |
| FR5 | Epic 3 | Consultation profil |
| FR6 | Epic 3 | Session persistante |
| FR7 | Epic 2 | Liste des films |
| FR8 | Epic 4 | Recherche par titre |
| FR9 | Epic 4 | Filtre par cinéma |
| FR10 | Epic 4 | Filtre par version |
| FR11 | Epic 4 | Filtre par horaire |
| FR12 | Epic 4 | Filtre par note |
| FR13 | Epic 2 | Détail film |
| FR14 | Epic 2 | Navigation semaines |
| FR15 | Epic 2 | Séances par film/cinéma/jour |
| FR16 | Epic 2 | Infos séance |
| FR17 | Epic 2 | Liste cinémas |
| FR18 | Epic 5 | Ajouter watchlist |
| FR19 | Epic 5 | Consulter watchlist |
| FR20 | Epic 5 | Retirer watchlist |
| FR21 | Epic 2 | Lien réservation |
| FR22 | Epic 2 | Ouverture site cinéma |
| FR23 | Epic 6 | Logs structurés |
| FR24 | Epic 6 | Métriques Prometheus |
| FR25 | Epic 6 | Sync AlloCiné |
| FR26 | Epic 7 | Créer alerte (Phase 2) |
| FR27 | Epic 7 | Configurer critères (Phase 2) |
| FR28 | Epic 7 | Consulter alertes (Phase 2) |
| FR29 | Epic 7 | Supprimer alerte (Phase 2) |
| FR30 | Epic 7 | Notification push (Phase 2) |
| FR31 | Epic 7 | Deep link notification (Phase 2) |

## Epic List

### Epic 0: Technical Prerequisites
Prérequis technique — Établir l'infrastructure technique (monorepo Turborepo, configurations partagées, packages types/config/ui, base de données Prisma, tokens de design vintage) permettant le développement des fonctionnalités utilisateur.

**FRs couverts:** Aucun FR direct (prérequis technique)

---

### Epic 2: Guest Film Discovery
Un visiteur peut consulter les films à l'affiche, voir les séances par cinéma/jour, et accéder directement aux liens de réservation externe — le parcours core de l'application.

**FRs couverts:** FR1, FR7, FR13, FR14, FR15, FR16, FR17, FR21, FR22

---

### Epic 3: User Authentication
Un utilisateur peut créer un compte, se connecter, se déconnecter, consulter son profil et supprimer son compte (RGPD). La session persiste entre les visites.

**FRs couverts:** FR2, FR3, FR4, FR5, FR6 | **NFRs couverts:** NFR10

---

### Epic 4: Search & Filtering
Un utilisateur peut trouver rapidement le film recherché grâce à la recherche instantanée et aux filtres (cinéma, version, horaire, note). Les préférences sont mémorisées.

**FRs couverts:** FR8, FR9, FR10, FR11, FR12

---

### Epic 5: Watchlist
Un utilisateur connecté peut sauvegarder des séances à ne pas manquer, consulter sa watchlist et retirer des éléments.

**FRs couverts:** FR18, FR19, FR20

---

### Epic 6: Administration & Monitoring
Les administrateurs peuvent surveiller le système via logs structurés et métriques Prometheus. Le système se synchronise automatiquement avec AlloCiné.

**FRs couverts:** FR23, FR24, FR25

---

### Epic 7: Alerts & Notifications (Phase 2)
Un utilisateur peut créer des alertes personnalisées et être notifié par push quand un film devient disponible selon ses critères.

**FRs couverts:** FR26, FR27, FR28, FR29, FR30, FR31

---

## Epic 1: Project Foundation

Établir l'infrastructure technique permettant le développement des fonctionnalités : monorepo Turborepo, configurations partagées, packages types/config/ui, base de données Prisma, tokens de design vintage.

### Story 0.1: Initialize Monorepo Structure

As a developer,
I want a properly configured monorepo with Turborepo and pnpm,
So that I can develop all applications with shared code and efficient builds.

**Acceptance Criteria:**

**Given** a fresh project directory
**When** the initialization is complete
**Then** the monorepo structure exists with `apps/` and `packages/` directories
**And** Turborepo is configured with build, lint, and dev pipelines
**And** pnpm workspaces are configured for package management
**And** TypeScript, ESLint, and Prettier configs are shared in `packages/config/`
**And** `.gitignore`, `.npmrc`, and root `package.json` are properly configured
**And** running `pnpm install` succeeds without errors

---

### Story 0.2: Setup Design System Foundation

As a developer,
I want a shared Tailwind configuration with vintage cinema design tokens,
So that Web and Mobile apps have consistent styling.

**Acceptance Criteria:**

**Given** the monorepo structure from Story 0.1
**When** the design system is configured
**Then** `packages/config/tailwind/preset.js` contains all vintage tokens:
  - Colors: rouge-cinema, bordeaux-profond, or-antique, jaune-marquise, creme-ecran, beige-papier, sepia-chaud, noir-velours
  - Fonts: bebas, playfair, crimson
  - Spacing, border-radius, shadows
**And** font files (Bebas Neue, Playfair Display, Crimson Text) are available
**And** the preset can be imported by Web and Mobile apps

---

### Story 0.3: Create Shared Types Package

As a developer,
I want a shared types package with TypeScript types and Zod schemas,
So that all apps use consistent data structures.

**Acceptance Criteria:**

**Given** the monorepo structure
**When** the types package is created
**Then** `packages/types/` exports TypeScript types for:
  - `Film`, `Showtime`, `Cinema`, `User`
  - `ApiResponse<T>`, `ApiError`
  - `Version` enum (VO, VF, VOST)
**And** Zod schemas are defined for validation
**And** types can be imported via `@reeltime/types`
**And** TypeScript compilation succeeds

---

### Story 0.4: Initialize API Application

As a developer,
I want a Fastify API skeleton with Prisma,
So that I can build the backend endpoints.

**Acceptance Criteria:**

**Given** the monorepo structure and shared packages
**When** the API app is initialized
**Then** `apps/api/` contains a Fastify application with:
  - Entry point (`server.ts`, `app.ts`)
  - Directory structure: routes/, services/, repositories/, middlewares/, schemas/
  - Prisma configured with PostgreSQL (prod) / SQLite (dev)
  - Empty schema.prisma ready for migrations
**And** health check endpoint `GET /healthcheck` returns `{ status: "ok" }`
**And** Pino logging is configured
**And** `pnpm dev` starts the API on port 3000
**And** `pnpm build` compiles without errors

---

### Story 0.5: Initialize Web Application

As a developer,
I want a React + Vite web application skeleton,
So that I can build the web frontend.

**Acceptance Criteria:**

**Given** the monorepo structure and shared packages
**When** the Web app is initialized
**Then** `apps/web/` contains a React + Vite application with:
  - TypeScript configuration extending shared config
  - Tailwind CSS using the shared preset
  - React Router configured
  - Directory structure: pages/, components/, hooks/, stores/, services/
  - Base layout with vintage styling (beige background, fonts loaded)
**And** `pnpm dev` starts the dev server with HMR
**And** `pnpm build` produces optimized production build
**And** the app displays a placeholder homepage

---

### Story 0.6: Initialize Mobile Application

As a developer,
I want an Expo + React Native mobile application skeleton,
So that I can build the Android app.

**Acceptance Criteria:**

**Given** the monorepo structure and shared packages
**When** the Mobile app is initialized
**Then** `apps/mobile/` contains an Expo application with:
  - TypeScript configuration
  - NativeWind using the shared Tailwind preset
  - React Navigation configured
  - Directory structure: screens/, components/, hooks/, stores/, services/, navigation/
  - Base tab navigator with placeholder screens
**And** `pnpm start` launches Expo dev server
**And** the app runs on Android emulator/device
**And** vintage fonts and colors are applied

---

## Epic 2: Guest Film Discovery

Un visiteur peut consulter les films à l'affiche, voir les séances par cinéma/jour, et accéder directement aux liens de réservation externe — le parcours core de l'application.

### Story 2.1: AlloCiné Scraper Service

As a system,
I want to fetch film and showtime data from AlloCiné,
So that users can see up-to-date cinema listings.

**Acceptance Criteria:**

**Given** the API application is running
**When** the scraper fetches data for a cinema and date
**Then** it retrieves films with: title, year, poster, synopsis, cast, director, rating
**And** it retrieves showtimes with: time, version (VO/VF/VOST), booking URL
**And** requests are rate-limited to minimum 200ms between calls (NFR13)
**And** errors are handled gracefully with retry logic (NFR12)
**And** responses are parsed into `Film` and `Showtime` types from `@reeltime/types`

---

### Story 2.2: Database Schema for Films & Cinemas

As a developer,
I want Prisma models for cinemas, films, and showtimes,
So that data can be persisted and queried efficiently.

**Acceptance Criteria:**

**Given** the API application with Prisma configured
**When** the schema is defined and migrated
**Then** tables exist for: `cinemas`, `films`, `showtimes`
**And** relationships are properly defined (cinema has many showtimes, film has many showtimes)
**And** indexes are created for common queries (date, cinema_id)
**And** seed script creates the 5 Brest/Landerneau cinemas:
  - Pathé Liberté Brest
  - Cinéville Brest
  - Les Studios Brest
  - Multiplexe Liberté Brest
  - Cinéma Le Family Landerneau
**And** `pnpm prisma migrate dev` runs successfully

---

### Story 2.3: Multi-Level Cache Service

As a system,
I want a multi-level caching strategy,
So that API responses are fast and AlloCiné is not overloaded.

**Acceptance Criteria:**

**Given** the API application
**When** film data is requested
**Then** Level 1 cache (node-cache in-memory) is checked first (~1ms)
**And** Level 2 cache (PostgreSQL) is checked if L1 misses (~10ms)
**And** AlloCiné is called only if both caches miss
**And** cache TTL is 6 hours by default
**And** cache can be manually invalidated
**And** cache is automatically cleared at midnight (00:00)
**And** the system works offline using cached data (NFR16)

---

### Story 2.4: Films API Endpoints

As a visitor,
I want API endpoints to retrieve films,
So that I can see what's playing this week.

**Acceptance Criteria:**

**Given** the API with scraper and cache configured
**When** `GET /api/v1/films?weekOffset=0` is called
**Then** it returns films playing this week with their showtimes
**And** response follows format `{ data: Film[], meta: { weekStart, weekEnd } }`
**And** `weekOffset` parameter navigates weeks (-1 = last week, 1 = next week)
**And** response time is < 200ms with hot cache (NFR1)
**And** response time is < 2s with cold cache (NFR2)

**Given** a valid film ID
**When** `GET /api/v1/films/:id` is called
**Then** it returns the full film details with all showtimes
**And** showtimes are grouped by date and cinema
**And** each showtime includes booking URL (FR21, FR22)

---

### Story 2.5: Cinemas API Endpoints

As a visitor,
I want API endpoints to retrieve cinemas and their showtimes,
So that I can see what's playing at each cinema.

**Acceptance Criteria:**

**Given** the API with seeded cinemas
**When** `GET /api/v1/cinemas` is called
**Then** it returns all 5 cinemas with: id, name, address, coordinates
**And** response follows format `{ data: Cinema[] }`

**Given** a valid cinema ID
**When** `GET /api/v1/cinemas/:id/showtimes?date=YYYY-MM-DD` is called
**Then** it returns all showtimes for that cinema on that date
**And** showtimes are grouped by film
**And** each showtime includes version and booking URL

---

### Story 2.6: Core UI Components

As a developer,
I want shared UI components for film display,
So that Web and Mobile apps have consistent visuals.

**Acceptance Criteria:**

**Given** the shared packages structure
**When** components are created in `packages/ui/`
**Then** `FilmCard` component displays:
  - Film poster with vintage ticket styling (corner cut)
  - Title (Playfair Display font)
  - Year and rating
  - Hover spotlight effect (Web)
  - Press animation (Mobile)

**And** `ShowtimeChip` component displays:
  - Time (e.g., "20:30")
  - Version badge (VO/VF)
  - Red cinema color by default
  - Tap opens booking URL in new tab/browser

**And** `WeekNavigator` component displays:
  - Current week label
  - Previous/Next arrows
  - "Today" button when offset ≠ 0
  - Supports swipe gesture (Mobile)

**And** `Skeleton` component provides vintage-styled loading placeholders

---

### Story 2.7: FilmDrawer Component

As a visitor,
I want to see film details and showtimes in a drawer,
So that I can choose a screening without leaving the list.

**Acceptance Criteria:**

**Given** the UI components from Story 2.6
**When** `FilmDrawer` is opened for a film
**Then** it displays as a bottom sheet (Mobile) or side drawer (Desktop)
**And** it shows: poster, title, year, synopsis, cast, director, rating
**And** showtimes are grouped by date, then by cinema
**And** each showtime is a `ShowtimeChip` linking to reservation
**And** swipe down or tap backdrop closes the drawer
**And** opening animation is smooth (< 300ms)

---

### Story 2.8: Web Films Page

As a visitor on Web,
I want to see a grid of films for the current week,
So that I can discover what's playing and book tickets.

**Acceptance Criteria:**

**Given** the Web application and API endpoints
**When** visiting the homepage `/`
**Then** films are displayed in a responsive grid (2/3/4 columns)
**And** `WeekNavigator` allows navigation between weeks (FR14)
**And** clicking a `FilmCard` opens the `FilmDrawer`
**And** `Skeleton` components show during loading
**And** `EmptyState` shows if no films found
**And** page works without authentication (FR1)
**And** initial load is < 3s (NFR5)

---

### Story 2.9: Mobile Films Screen

As a visitor on Mobile,
I want to see a list of films for the current week,
So that I can discover what's playing and book tickets.

**Acceptance Criteria:**

**Given** the Mobile application and API endpoints
**When** opening the Films tab
**Then** films are displayed in a 2-column grid
**And** `WeekNavigator` with swipe gesture navigates weeks
**And** tapping a `FilmCard` opens the `FilmDrawer`
**And** pull-to-refresh updates the data
**And** `Skeleton` components show during loading
**And** app works without authentication (FR1)
**And** scrolling is smooth at 60 FPS (NFR4)
**And** initial load is < 2s (NFR6)

---

## Epic 3: User Authentication

Un utilisateur peut créer un compte, se connecter, se déconnecter et consulter son profil. La session persiste entre les visites.

### Story 3.1: User Database Schema & Registration API

As a visitor,
I want to create an account with my email and password,
So that I can access personalized features.

**Acceptance Criteria:**

**Given** the API application
**When** the user schema is created
**Then** `users` table exists in Prisma with: id (uuid), email (unique), password_hash, name (optional), created_at, updated_at
**And** index on email for fast lookups

**Given** a visitor with a valid email and password
**When** `POST /api/v1/auth/register` is called with `{ email, password, name? }`
**Then** password is hashed with bcrypt (≥10 rounds) (NFR7)
**And** user is created in database
**And** response returns `{ data: { accessToken, refreshToken, user } }` with status 201
**And** no password is ever stored or returned in clear text (NFR11)

**Given** an email already registered
**When** `POST /api/v1/auth/register` is called
**Then** response returns `{ error: { code: "EMAIL_ALREADY_EXISTS", message: "..." } }` with status 400

**Given** invalid input (missing email, short password)
**When** `POST /api/v1/auth/register` is called
**Then** Zod validation returns specific error messages with status 400

---

### Story 3.2: Login API & JWT Token Management

As a registered user,
I want to log in and maintain my session,
So that I don't have to re-authenticate every visit.

**Acceptance Criteria:**

**Given** a registered user
**When** `POST /api/v1/auth/login` is called with `{ email, password }`
**Then** password is verified against bcrypt hash
**And** response returns `{ data: { accessToken, refreshToken, user } }`
**And** accessToken expires in 15 minutes (NFR9)
**And** refreshToken expires in 30 days (NFR9)

**Given** an expired accessToken and valid refreshToken
**When** `POST /api/v1/auth/refresh` is called with `{ refreshToken }`
**Then** a new accessToken is issued
**And** response returns `{ data: { accessToken } }`

**Given** invalid credentials
**When** `POST /api/v1/auth/login` is called
**Then** response returns `{ error: { code: "INVALID_CREDENTIALS" } }` with status 401
**And** no information leaks about which field is wrong

**Given** an expired or invalid refreshToken
**When** `POST /api/v1/auth/refresh` is called
**Then** response returns `{ error: { code: "TOKEN_EXPIRED" } }` with status 401

---

### Story 3.3: Auth Middleware & User Profile API

As a logged-in user,
I want to access my profile and log out,
So that I can manage my account.

**Acceptance Criteria:**

**Given** a valid accessToken in `Authorization: Bearer {token}` header
**When** `GET /api/v1/me` is called
**Then** response returns `{ data: { id, email, name, createdAt } }` (FR5)
**And** password hash is never returned

**Given** the auth middleware
**When** a protected route is accessed without token
**Then** response returns `{ error: { code: "UNAUTHORIZED" } }` with status 401

**Given** the auth middleware
**When** a protected route is accessed with expired token
**Then** response returns `{ error: { code: "TOKEN_EXPIRED" } }` with status 401

**Given** a public route (e.g., `GET /api/v1/films`)
**When** accessed without token
**Then** the request succeeds normally (FR1)

**Given** a logged-in user
**When** they log out
**Then** the client discards tokens (FR4)
**And** no server-side action needed (stateless JWT)

---

### Story 3.4: Web Authentication Pages

As a visitor on Web,
I want to register, log in, view my profile, and log out,
So that I can use personalized features.

**Acceptance Criteria:**

**Given** the Web application
**When** visiting `/register`
**Then** a registration form is displayed with: email, password, name (optional)
**And** inline validation shows errors during typing
**And** successful registration logs in automatically and redirects to previous page (FR2)

**Given** the Web application
**When** visiting `/login`
**Then** a login form is displayed with: email, password
**And** inline validation on submit
**And** successful login redirects to previous page (FR3)
**And** tokens are stored in localStorage (access) and httpOnly cookie (refresh)

**Given** a logged-in user
**When** visiting `/profile`
**Then** user info is displayed (email, name, creation date) (FR5)
**And** logout button is visible

**Given** a logged-in user
**When** clicking logout
**Then** tokens are cleared, user is redirected to homepage (FR4)

**Given** the Zustand auth store
**When** the app loads
**Then** it checks for existing tokens and auto-refreshes if needed (FR6)
**And** auth state is consistent across tabs

---

### Story 3.5: Mobile Authentication Screens

As a visitor on Mobile,
I want to register, log in, view my profile, and log out,
So that I can use personalized features on my phone.

**Acceptance Criteria:**

**Given** the Mobile application
**When** navigating to Register screen
**Then** a registration form is displayed with: email, password, name (optional)
**And** keyboard-aware layout avoids field obstruction
**And** inline validation on blur
**And** successful registration logs in and returns to previous context (FR2)

**Given** the Mobile application
**When** navigating to Login screen
**Then** a login form is displayed with: email, password
**And** successful login stores tokens in expo-secure-store (FR3)
**And** user is redirected to previous screen

**Given** a logged-in user
**When** navigating to Profile tab
**Then** user info is displayed (FR5)
**And** logout button with confirmation modal

**Given** a logged-in user
**When** tapping logout and confirming
**Then** tokens are cleared from secure storage (FR4)
**And** user is redirected to Films screen

**Given** the app is reopened after being closed
**When** tokens exist in secure storage
**Then** session is automatically restored (FR6)
**And** expired tokens trigger automatic refresh

---

### Story 3.6: Account Deletion & Data Erasure (RGPD)

As a logged-in user,
I want to delete my account and all my personal data,
So that my right to erasure (RGPD/GDPR) is respected.

**Acceptance Criteria:**

**Given** a logged-in user
**When** `DELETE /api/v1/me` is called with confirmation body `{ confirm: true }`
**Then** the user's account is permanently deleted
**And** all associated watchlist items are deleted
**And** all associated alerts are deleted (Phase 2)
**And** response returns status 204
**And** no personal data remains in the database (NFR10)

**Given** a logged-in user on Web
**When** visiting `/profile` and clicking "Supprimer mon compte"
**Then** a confirmation modal appears with warning text
**And** the user must type "SUPPRIMER" to confirm
**And** upon confirmation, the account is deleted via API
**And** tokens are cleared, user is redirected to homepage
**And** a toast confirms "Compte supprimé"

**Given** a logged-in user on Mobile
**When** navigating to Profile → "Supprimer mon compte"
**Then** a confirmation modal appears with warning text
**And** the user must type "SUPPRIMER" to confirm
**And** upon confirmation, the account is deleted via API
**And** tokens are cleared from secure storage
**And** user is redirected to Films screen
**And** haptic feedback confirms deletion

**Given** a deleted account's email
**When** `POST /api/v1/auth/register` is called with that email
**Then** registration succeeds (email is available again)

---

## Epic 4: Search & Filtering

Un utilisateur peut trouver rapidement le film recherché grâce à la recherche instantanée et aux filtres (cinéma, version, horaire, note). Les préférences sont mémorisées.

### Story 4.1: Search & Filter API Support

As a visitor,
I want to search and filter films via the API,
So that I can find specific films quickly.

**Acceptance Criteria:**

**Given** the films API endpoint
**When** `GET /api/v1/films?weekOffset=0&q=dune` is called
**Then** only films matching "dune" in title are returned (FR8)
**And** search is case-insensitive and accent-insensitive

**Given** the films API endpoint
**When** `GET /api/v1/films/search?q=nosferatu` is called
**Then** it searches across all cached films (not just current week)
**And** returns matching films with their next available showtimes

**Given** the films API endpoint with filter parameters
**When** `GET /api/v1/films?cinemaId=pathe-brest&version=VO&minTime=18:00&minRating=7` is called
**Then** results are filtered by cinema (FR9)
**And** results are filtered by version VO/VF/VOST (FR10)
**And** results are filtered by minimum showtime hour (FR11)
**And** results are filtered by minimum rating (FR12)
**And** multiple filters can be combined

---

### Story 4.2: Web Search & Filters

As a visitor on Web,
I want to search films and apply filters with instant feedback,
So that I can quickly narrow down to the film I want.

**Acceptance Criteria:**

**Given** the Web films page
**When** typing in the `SearchBar`
**Then** films are filtered in real-time during typing (no submit button) (FR8)
**And** a clear button (×) appears when text is entered
**And** hitting `/` focuses the search bar (keyboard shortcut)

**Given** the filter bar
**When** toggling a cinema `FilterChip`
**Then** films from that cinema are shown/hidden instantly (FR9)
**And** chip visual state reflects selection (selected = crème, unselected = opacity 60%)

**Given** the filter bar
**When** selecting a version filter (VO, VF, VOST, Tous)
**Then** only showtimes matching that version are displayed (FR10)

**Given** the filter bar
**When** setting a minimum time filter
**Then** only showtimes at or after that time are shown (FR11)

**Given** the filter bar
**When** setting a minimum rating filter
**Then** only films with rating ≥ value are displayed (FR12)

**Given** any filter or search value
**When** the user closes and reopens the browser
**Then** all filter preferences are restored from localStorage
**And** the same results are displayed

**Given** active filters producing no results
**When** the list is empty
**Then** an `EmptyState` shows "Aucune séance ne correspond" with a "Réinitialiser les filtres" action

---

### Story 4.3: Mobile Search & Filters

As a visitor on Mobile,
I want to search films and apply filters with touch-friendly controls,
So that I can find what I want quickly on my phone.

**Acceptance Criteria:**

**Given** the Mobile application
**When** navigating to the Search tab
**Then** a `SearchBar` is displayed at the top
**And** typing filters films in real-time (FR8)
**And** recent searches are displayed below when empty

**Given** the Films screen
**When** tapping the filter icon
**Then** a filter bottom sheet appears with:
  - Cinema chips (multi-select toggle) (FR9)
  - Version chips (VO, VF, VOST, Tous) (FR10)
  - Time slider or picker for minimum hour (FR11)
  - Rating slider for minimum note (FR12)
**And** changes apply instantly (no "Apply" button)

**Given** filter selections
**When** the app is closed and reopened
**Then** filter preferences are restored from AsyncStorage
**And** the same filters are applied

**Given** active filters
**When** a filter chip is displayed on the Films screen
**Then** active filters are shown as dismissible chips above the film grid
**And** tapping × on a chip removes that filter

---

## Epic 5: Watchlist

Un utilisateur connecté peut sauvegarder des séances à ne pas manquer, consulter sa watchlist et retirer des éléments.

### Story 5.1: Watchlist Database & API Endpoints

As a logged-in user,
I want API endpoints to manage my watchlist,
So that I can save showtimes I don't want to miss.

**Acceptance Criteria:**

**Given** the API application with auth middleware
**When** the watchlist schema is created
**Then** `watchlist` table exists in Prisma with: id (uuid), user_id (FK), film_title, cinema_name, date, time, version, booking_url, poster_url, created_at
**And** unique constraint on (user_id, film_title, cinema_name, date, time)

**Given** a logged-in user
**When** `POST /api/v1/me/watchlist` is called with `{ filmTitle, cinemaName, date, time, version, bookingUrl, posterUrl }`
**Then** the showtime is added to the user's watchlist (FR18)
**And** response returns `{ data: { id, ... } }` with status 201

**Given** a logged-in user
**When** `POST /api/v1/me/watchlist` is called for an already-saved showtime
**Then** response returns `{ error: { code: "ALREADY_IN_WATCHLIST" } }` with status 409

**Given** a logged-in user
**When** `GET /api/v1/me/watchlist` is called
**Then** response returns `{ data: WatchlistItem[] }` sorted by date ascending (FR19)

**Given** a logged-in user with a watchlist item
**When** `DELETE /api/v1/me/watchlist/:id` is called
**Then** the item is removed from the watchlist (FR20)
**And** response returns status 204

**Given** a non-authenticated user
**When** any watchlist endpoint is called
**Then** response returns `{ error: { code: "UNAUTHORIZED" } }` with status 401

---

### Story 5.2: Web Watchlist Integration

As a logged-in user on Web,
I want to add showtimes to my watchlist and view them,
So that I can keep track of screenings I want to attend.

**Acceptance Criteria:**

**Given** a logged-in user viewing the `FilmDrawer`
**When** long-clicking or clicking the bookmark icon on a `ShowtimeChip`
**Then** the showtime is added to the watchlist via API (FR18)
**And** the chip color changes from red to gold (or antique)
**And** a toast confirms "Ajouté au calendrier" with an "Annuler" link

**Given** a `ShowtimeChip` already in the watchlist
**When** displayed in the `FilmDrawer`
**Then** it appears in gold color to indicate saved state

**Given** a logged-in user
**When** visiting `/watchlist`
**Then** saved showtimes are displayed grouped by date (FR19)
**And** each item shows: film title, poster, cinema, time, version
**And** each item has a booking link and a remove button

**Given** a logged-in user on the watchlist page
**When** clicking remove on a watchlist item
**Then** the item is removed via API (FR20)
**And** a toast confirms "Retiré du calendrier" with an "Annuler" link

**Given** a non-logged-in user
**When** attempting to add to watchlist
**Then** a prompt invites them to register/login
**And** the intended action is preserved for after login

---

### Story 5.3: Mobile Watchlist Integration

As a logged-in user on Mobile,
I want to save showtimes and view my calendar,
So that I can track screenings on my phone.

**Acceptance Criteria:**

**Given** a logged-in user viewing the `FilmDrawer`
**When** long-pressing a `ShowtimeChip`
**Then** the showtime is added to the watchlist via API (FR18)
**And** haptic feedback confirms the action (success notification)
**And** the chip color changes from red to gold
**And** a toast confirms "Ajouté au calendrier"

**Given** a logged-in user
**When** navigating to the Calendar tab
**Then** saved showtimes are displayed grouped by date (FR19)
**And** each item shows: film poster, title, cinema, time, version
**And** tapping an item opens the booking URL

**Given** a logged-in user on the Calendar screen
**When** swiping left on a watchlist item (or tapping remove)
**Then** the item is removed via API (FR20)
**And** haptic feedback confirms
**And** a toast shows "Retiré" with undo option

**Given** a non-logged-in user
**When** long-pressing a `ShowtimeChip`
**Then** a bottom sheet invites to register/login
**And** the action context is preserved for after authentication

---

## Epic 6: Administration & Monitoring

Les administrateurs peuvent surveiller le système via logs structurés et métriques Prometheus. Le système se synchronise automatiquement avec AlloCiné.

### Story 6.1: Structured Logging & Prometheus Metrics

As an administrator,
I want structured logs and monitoring metrics,
So that I can diagnose issues and track system health.

**Acceptance Criteria:**

**Given** the API application
**When** any request is processed
**Then** Pino logs include: timestamp, level, request method, path, status, duration (FR23)
**And** logs are in JSON format for machine parsing
**And** log level is configurable via environment variable
**And** errors include full stack traces and request context (NFR17)

**Given** the API application
**When** `GET /metrics` is called
**Then** Prometheus metrics are exposed including (FR24):
  - `http_requests_total` (counter, labels: method, path, status)
  - `http_request_duration_seconds` (histogram)
  - `allocine_api_calls_total` (counter, labels: cinema, status)
  - `cache_hits_total` / `cache_misses_total` (counters, labels: level)
  - `films_count` (gauge)
  - `showtimes_count` (gauge)
**And** metrics endpoint does not require authentication

---

### Story 6.2: AlloCiné Auto-Sync & Cache Management

As a system,
I want to automatically refresh film data daily,
So that users always see up-to-date showtimes.

**Acceptance Criteria:**

**Given** the API application is running
**When** midnight (00:00 Europe/Paris) is reached
**Then** all in-memory caches are cleared (FR25)
**And** the scraper re-fetches data for all 5 cinemas for the next 60 days
**And** data is stored in both node-cache and PostgreSQL
**And** sync respects rate limiting (≥200ms between calls) (NFR13)
**And** sync progress is logged with cinema name and duration

**Given** the auto-sync is in progress
**When** an API request comes in
**Then** stale cache data is served until refresh completes (NFR16)
**And** no user-facing errors occur during sync

**Given** an administrator
**When** `POST /api/v1/admin/refresh` is called (authenticated)
**Then** a manual cache refresh is triggered
**And** response returns `{ data: { status: "started" } }`

**Given** the auto-sync encounters an AlloCiné error
**When** a cinema fetch fails
**Then** the error is logged with context
**And** sync continues with remaining cinemas
**And** cached data remains available as fallback (NFR16)

---

### Story 6.3: Docker Deployment & Health Monitoring

As an administrator,
I want Docker deployment with health checks and auto-restart,
So that the system runs reliably on my NAS.

**Acceptance Criteria:**

**Given** the project
**When** Docker images are built
**Then** `apps/api/Dockerfile` produces a minimal image (Alpine-based)
**And** `apps/web/Dockerfile` produces a nginx-based image serving static files
**And** `apps/web/nginx.conf` handles SPA routing (all routes → index.html)

**Given** the docker-compose.yml
**When** `docker compose up -d` is run on the NAS
**Then** three services start: api, web, postgres
**And** PostgreSQL data is persisted via named volume
**And** API connects to PostgreSQL via `DATABASE_URL`
**And** all services have `restart: unless-stopped` (NFR18)

**Given** the API service
**When** `GET /healthcheck` is called
**Then** it returns `{ status: "ok", uptime: N, cacheSize: N }`
**And** Docker health check uses this endpoint

---

### Story 6.4: CI/CD Pipeline

As a developer,
I want a CI/CD pipeline that automatically lints, tests, builds, and deploys,
So that code quality is enforced and deployment is automated.

**Acceptance Criteria:**

**Given** the GitHub repository
**When** code is pushed to `main`
**Then** GitHub Actions workflow runs lint step (ESLint + Prettier check)
**And** test step runs all unit tests (Vitest)
**And** build step compiles TypeScript and produces artifacts
**And** all steps must pass before proceeding

**Given** a successful build
**When** the deploy step runs
**Then** Docker images are built for api and web services
**And** images are pushed to the container registry (ghcr.io or Docker Hub)
**And** deployment can be triggered to the NAS via SSH or webhook

**Given** a failed lint or test step
**When** the pipeline encounters an error
**Then** the pipeline stops and the commit is marked as failed
**And** a notification is sent (GitHub Actions default)

---

## Epic 7: Alerts & Notifications (Phase 2)

Un utilisateur peut créer des alertes personnalisées et être notifié par push quand un film devient disponible selon ses critères.

### Story 7.1: Alerts Database & CRUD API

As a logged-in user,
I want to create and manage alerts for films,
So that I can be notified when a film I want to see becomes available.

**Acceptance Criteria:**

**Given** the API application with auth middleware
**When** the alerts schema is created
**Then** `alerts` table exists in Prisma with: id (uuid), user_id (FK), film_title, criteria (JSON: cinema, version, minTime), is_active (boolean), created_at, triggered_at (nullable)

**Given** a logged-in user
**When** `POST /api/v1/me/alertes` is called with `{ filmTitle, criteria: { cinemaId?, version?, minTime? } }`
**Then** the alert is created (FR26)
**And** criteria are validated with Zod (FR27)
**And** response returns `{ data: { id, filmTitle, criteria, isActive } }` with status 201

**Given** a logged-in user
**When** `GET /api/v1/me/alertes` is called
**Then** response returns `{ data: Alert[] }` sorted by creation date (FR28)
**And** each alert shows its status (active, triggered, expired)

**Given** a logged-in user with an alert
**When** `DELETE /api/v1/me/alertes/:id` is called
**Then** the alert is deleted (FR29)
**And** response returns status 204

**Given** a logged-in user creating an alert
**When** the film title matches a film already playing
**Then** the user is notified immediately ("Ce film est déjà à l'affiche !")
**And** the alert is still created for future screenings

---

### Story 7.2: Alert Matching & Push Notification Service

As a system,
I want to match alerts against new film data and send push notifications,
So that users are notified when their awaited film becomes available.

**Acceptance Criteria:**

**Given** the auto-sync has fetched new film data
**When** the alert matching job runs (after each sync)
**Then** each active alert is compared against available films
**And** matching considers: film title (fuzzy match), cinema criteria, version criteria, time criteria

**Given** an alert matches a newly available film
**When** a match is found
**Then** a push notification is sent via Firebase Cloud Messaging (FR30)
**And** notification includes: film title, cinema name, next showtime
**And** the alert's `triggered_at` is updated
**And** the match is logged

**Given** a push notification is received on a device
**When** the user taps the notification
**Then** the app opens directly on the film's detail page (FR31)
**And** deep link format: `reeltime://film/{filmId}`

**Given** FCM token management
**When** a user logs in on a device
**Then** the FCM device token is registered with the API
**And** tokens are refreshed on app launch
**And** stale tokens are cleaned up

---

### Story 7.3: Web Alerts Management

As a logged-in user on Web,
I want to create and manage alerts from the web interface,
So that I can set up notifications from my computer.

**Acceptance Criteria:**

**Given** a logged-in user on the Web
**When** searching for a film that has no results
**Then** a "Créer une alerte" button is displayed
**And** clicking it opens an alert creation form (FR26)

**Given** the alert creation form
**When** the user fills in criteria (optional: cinema, version, min time)
**Then** the form validates criteria with inline feedback (FR27)
**And** submitting creates the alert via API
**And** a toast confirms "Alerte créée"

**Given** a logged-in user
**When** visiting `/profile` or a dedicated alerts section
**Then** active alerts are listed with their criteria (FR28)
**And** each alert shows status: active, triggered (with date), expired
**And** a delete button allows removal (FR29)

**Given** a triggered alert
**When** displayed in the alerts list
**Then** it shows the matched film with a link to its details

---

### Story 7.4: Mobile Alerts & Push Notifications

As a logged-in user on Mobile,
I want to create alerts and receive push notifications,
So that I get notified on my phone when a film is available.

**Acceptance Criteria:**

**Given** a logged-in user on the Mobile app
**When** searching for a film with no results
**Then** a "Créer une alerte" button is displayed (FR26)
**And** tapping opens an alert configuration bottom sheet

**Given** the alert configuration sheet
**When** the user sets criteria (cinema chips, version, time picker)
**Then** criteria are validated inline (FR27)
**And** tapping "Créer" saves the alert via API
**And** haptic feedback + toast confirm creation

**Given** the Mobile app launch
**When** the user is logged in
**Then** expo-notifications requests push permission
**And** FCM token is sent to the API
**And** notification channel is configured (Android)

**Given** a push notification is received
**When** the user taps the notification
**Then** the app opens on the matched film's `FilmDrawer` (FR31)
**And** deep link navigates to the correct screen

**Given** a logged-in user
**When** navigating to the Profile screen → "Mes alertes"
**Then** active alerts are displayed (FR28)
**And** swipe-to-delete removes an alert (FR29)
**And** haptic feedback confirms deletion

