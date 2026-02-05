# Story 0.1: Initialize Monorepo Structure

Status: done

## Story

As a developer,
I want a properly configured monorepo with Turborepo and pnpm,
So that I can develop all applications with shared code and efficient builds.

## Acceptance Criteria

1. **Given** a fresh project directory, **When** the initialization is complete, **Then** the monorepo structure exists with `apps/` and `packages/` directories
2. **And** Turborepo is configured with build, lint, and dev pipelines (`turbo.json`)
3. **And** pnpm workspaces are configured for package management (`pnpm-workspace.yaml`)
4. **And** TypeScript, ESLint, and Prettier configs are shared in `packages/config/`
5. **And** `.gitignore`, `.npmrc`, and root `package.json` are properly configured
6. **And** running `pnpm install` succeeds without errors
7. **And** `pnpm turbo run build` executes without errors (even if apps are empty stubs)

## Tasks / Subtasks

- [x] Task 1: Create Turborepo monorepo (AC: #1, #2)
  - [x] Run `npx create-turbo@latest reeltime-v2 --package-manager pnpm`
  - [x] Clean default apps: `rm -rf apps/*`
  - [x] Verify `turbo.json` contains build, lint, dev, test pipelines
  - [x] Configure pipeline caching and dependencies in `turbo.json`
- [x] Task 2: Configure pnpm workspaces (AC: #3)
  - [x] Edit `pnpm-workspace.yaml` to define `apps/*` and `packages/*`
  - [x] Configure `.npmrc` with `shamefully-hoist=true` (needed for Expo/NativeWind compatibility)
- [x] Task 3: Create shared TypeScript config (AC: #4)
  - [x] Create `packages/config/typescript/base.json` with strict settings
  - [x] Create `packages/config/typescript/react.json` extending base (JSX, DOM libs)
  - [x] Create `packages/config/typescript/node.json` extending base (Node types, CommonJS/ESM)
  - [x] Create `packages/config/package.json` with proper exports
- [x] Task 4: Create shared ESLint config (AC: #4)
  - [x] Create `packages/config/eslint/base.js` with TypeScript rules
  - [x] Create `packages/config/eslint/react.js` extending base with React rules
  - [x] Create `packages/config/eslint/node.js` extending base with Node rules
  - [x] Install required ESLint plugins: `@typescript-eslint/eslint-plugin`, `eslint-plugin-react`, `eslint-plugin-react-hooks`
- [x] Task 5: Create shared Prettier config (AC: #4)
  - [x] Create `.prettierrc` at root with project settings (single quotes, trailing commas, 100 char width)
  - [x] Create `.prettierignore` excluding node_modules, dist, .turbo, prisma
- [x] Task 6: Configure root files (AC: #5)
  - [x] Root `package.json` with project name `reeltime-v2`, scripts (`dev`, `build`, `lint`, `test`, `clean`)
  - [x] `.gitignore` comprehensive: node_modules, dist, .turbo, .env, *.db, data/, .DS_Store
  - [x] `.npmrc` with pnpm settings
- [x] Task 7: Create placeholder apps directories (AC: #1)
  - [x] Create `apps/api/.gitkeep` (will be populated in Story 0.4)
  - [x] Create `apps/web/.gitkeep` (will be populated in Story 0.5)
  - [x] Create `apps/mobile/.gitkeep` (will be populated in Story 0.6)
- [x] Task 8: Create placeholder packages (AC: #1, #6)
  - [x] Create `packages/types/package.json` with name `@reeltime/types`
  - [x] Create `packages/types/src/index.ts` (empty export)
  - [x] Create `packages/types/tsconfig.json` extending shared base
  - [x] Create `packages/ui/package.json` with name `@reeltime/ui`
  - [x] Create `packages/ui/src/index.ts` (empty export)
  - [x] Create `packages/api-client/package.json` with name `@reeltime/api-client`
  - [x] Create `packages/api-client/src/index.ts` (empty export)
- [x] Task 9: Verify installation and build (AC: #6, #7)
  - [x] Run `pnpm install` — must succeed without errors
  - [x] Run `pnpm turbo run build` — must succeed (stub builds)
  - [x] Run `pnpm turbo run lint` — must succeed
  - [x] Verify workspace resolution: `pnpm ls --depth 0`

## Dev Notes

### Architecture Context

**CRITICAL: This is a NEW project (v2), NOT a modification of the existing Flask app.**

The existing codebase is a Flask/Python/SQLite monolithic application (v1). Story 0.1 creates the foundation for a **completely separate** TypeScript monorepo (v2) that will eventually replace it. Do NOT modify the existing `app.py`, `modules/`, or `templates/` files.

**Target location:** Create the monorepo as a NEW directory `reeltime-v2/` at the project root level, separate from the existing Flask application.

### Technical Stack Requirements

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥ 18 | Runtime |
| **pnpm** | ≥ 8 | Package manager |
| **Turborepo** | Latest stable | Monorepo orchestration |
| **TypeScript** | 5.x | Language |
| **ESLint** | 8.x or 9.x | Linting |
| **Prettier** | 3.x | Formatting |

### Monorepo Structure (Target)

```
reeltime-v2/
├── apps/
│   ├── api/          # Fastify + Prisma (Story 0.4)
│   ├── web/          # React + Vite + Tailwind (Story 0.5)
│   └── mobile/       # Expo + NativeWind (Story 0.6)
├── packages/
│   ├── types/        # @reeltime/types - Shared TypeScript types + Zod schemas
│   ├── config/       # @reeltime/config - ESLint, TypeScript, Tailwind configs
│   ├── ui/           # @reeltime/ui - Shared UI components
│   └── api-client/   # @reeltime/api-client - Typed API client
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── .gitignore
├── .npmrc
├── .prettierrc
└── README.md
```

### turbo.json Tasks Configuration (Turborepo v2.x)

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "clean": {
      "cache": false
    }
  }
}
```

### pnpm-workspace.yaml Configuration

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

### TypeScript Config Pattern (packages/config/typescript/base.json)

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "moduleResolution": "node",
    "target": "ES2022",
    "module": "ES2022"
  },
  "exclude": ["node_modules", "dist"]
}
```

### Naming Conventions (Architecture Document)

| Element | Convention | Example |
|---------|-----------|---------|
| Package names | `@reeltime/name` | `@reeltime/types`, `@reeltime/ui` |
| Files (utils) | `camelCase.ts` | `dateUtils.ts` |
| Files (components) | `PascalCase.tsx` | `FilmCard.tsx` |
| Functions | `camelCase` | `getFilmById()` |
| Constants | `UPPER_SNAKE_CASE` | `API_BASE_URL` |
| Types/Interfaces | `PascalCase` | `Film`, `ApiResponse<T>` |

### Anti-Patterns to AVOID

- **DO NOT** use `npm` or `yarn` — this project uses `pnpm` exclusively
- **DO NOT** install dependencies at root level (except dev tools like Prettier)
- **DO NOT** create individual `node_modules` management — let pnpm workspaces handle it
- **DO NOT** skip `shamefully-hoist=true` in `.npmrc` — needed for Expo/NativeWind
- **DO NOT** put app-specific code in `packages/` — packages are shared utilities only
- **DO NOT** modify the existing Flask app (app.py, modules/, templates/, etc.)

### Project Structure Notes

- This monorepo structure is the foundation for ALL subsequent stories (0.2 through 6.4)
- Package aliases (`@reeltime/*`) must be consistent across the entire project
- The `packages/config/` is consumed by ALL apps and packages — changes here affect everything
- Turborepo caching depends on proper `inputs`/`outputs` configuration

### References

- [Source: output/planning-artifacts/architecture.md#Starter Template Evaluation] — Initialization commands and starter selection
- [Source: output/planning-artifacts/architecture.md#Project Structure & Boundaries] — Complete directory structure
- [Source: output/planning-artifacts/architecture.md#Implementation Patterns & Consistency Rules] — Naming conventions
- [Source: output/planning-artifacts/epics.md#Story 0.1] — Acceptance criteria and user story

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- ESLint lint failed initially because packages lacked local `.eslintrc.js` files and `eslint` devDependency. Fixed by adding `.eslintrc.js` to each package and adding `eslint` to their devDependencies.

### Completion Notes List

- ✅ Task 1: Created Turborepo monorepo via `npx create-turbo@latest`, cleaned default apps/packages, configured turbo.json with build/lint/dev/test/clean pipelines
- ✅ Task 2: pnpm-workspace.yaml already correct from scaffold. Added `shamefully-hoist=true` to `.npmrc`
- ✅ Task 3: Created TypeScript configs (base.json, react.json, node.json) in packages/config/typescript/
- ✅ Task 4: Created ESLint configs (base.js, react.js, node.js) in packages/config/eslint/ with required plugins
- ✅ Task 5: Created .prettierrc (single quotes, trailing commas, 100 char width) and .prettierignore
- ✅ Task 6: Configured root package.json with all scripts, comprehensive .gitignore, .npmrc
- ✅ Task 7: Created placeholder apps directories (api, web, mobile) with .gitkeep files
- ✅ Task 8: Created placeholder packages (types, ui, api-client) with package.json, src/index.ts, tsconfig.json, .eslintrc.js
- ✅ Task 9: Verified pnpm install (success), turbo build (3/3 success), turbo lint (3/3 success), workspace resolution (OK)

### Change Log

- 2026-02-05: Initial implementation of monorepo structure (Story 0.1) - All 9 tasks completed, all 7 ACs satisfied
- 2026-02-05: Code review fixes — Updated turbo.json docs (pipeline→tasks), added rimraf for cross-platform clean scripts, added root tsconfig.json, fixed ui tsconfig to extend react config, added .editorconfig

### File List

- `reeltime-v2/turbo.json` (new) — Turborepo tasks configuration (v2.x)
- `reeltime-v2/package.json` (modified) — Root package.json with scripts, added rimraf devDep
- `reeltime-v2/tsconfig.json` (new) — Root TypeScript config for IDE workspace support
- `reeltime-v2/pnpm-workspace.yaml` (existing) — Workspace configuration
- `reeltime-v2/.npmrc` (modified) — Added shamefully-hoist=true
- `reeltime-v2/.gitignore` (modified) — Added *.db, data/ entries
- `reeltime-v2/.prettierrc` (new) — Prettier configuration
- `reeltime-v2/.prettierignore` (new) — Prettier ignore patterns
- `reeltime-v2/.editorconfig` (new) — Cross-IDE editor configuration
- `reeltime-v2/packages/config/package.json` (new) — @reeltime/config package
- `reeltime-v2/packages/config/typescript/base.json` (new) — Base TypeScript config
- `reeltime-v2/packages/config/typescript/react.json` (new) — React TypeScript config
- `reeltime-v2/packages/config/typescript/node.json` (new) — Node TypeScript config
- `reeltime-v2/packages/config/eslint/base.js` (new) — Base ESLint config
- `reeltime-v2/packages/config/eslint/react.js` (new) — React ESLint config
- `reeltime-v2/packages/config/eslint/node.js` (new) — Node ESLint config
- `reeltime-v2/packages/types/package.json` (new) — @reeltime/types package (rimraf clean)
- `reeltime-v2/packages/types/src/index.ts` (new) — Empty export stub
- `reeltime-v2/packages/types/tsconfig.json` (new) — TypeScript config
- `reeltime-v2/packages/types/.eslintrc.js` (new) — ESLint config
- `reeltime-v2/packages/ui/package.json` (new) — @reeltime/ui package (rimraf clean)
- `reeltime-v2/packages/ui/src/index.ts` (new) — Empty export stub
- `reeltime-v2/packages/ui/tsconfig.json` (modified) — TypeScript config extending react config
- `reeltime-v2/packages/ui/.eslintrc.js` (new) — ESLint config
- `reeltime-v2/packages/api-client/package.json` (new) — @reeltime/api-client package (rimraf clean)
- `reeltime-v2/packages/api-client/src/index.ts` (new) — Empty export stub
- `reeltime-v2/packages/api-client/tsconfig.json` (new) — TypeScript config
- `reeltime-v2/packages/api-client/.eslintrc.js` (new) — ESLint config
- `reeltime-v2/apps/api/.gitkeep` (new) — Placeholder for API app
- `reeltime-v2/apps/web/.gitkeep` (new) — Placeholder for Web app
- `reeltime-v2/apps/mobile/.gitkeep` (new) — Placeholder for Mobile app
