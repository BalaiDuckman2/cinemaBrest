# Filtre/priorisation par note Letterboxd — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une note Letterboxd aux films (récupérée via TMDB), l'afficher sur les fiches, et l'utiliser comme priorisation douce (les films bien notés remontent, aucun n'est masqué).

**Architecture:** Le backend Fastify enrichit en tâche de fond les films stockés (TMDB → page Letterboxd → JSON-LD), persiste `letterboxdRating` en base, l'expose dans les réponses API. Le web ajoute un seuil de priorisation dans le store Zustand qui repartitionne le tri sans filtrer, et affiche la note sur FilmCard/FilmDrawer.

**Tech Stack:** TypeScript, Fastify 5, Prisma (SQLite), vitest (API), React 19 + Vite + Zustand (web), pnpm workspaces.

**Toutes les commandes sont lancées depuis `reeltime-v2/`.** Pas de RTK ici (les commandes de test/build sont déjà compactes via vitest run / tsc).

---

## Notes de contexte (lire avant de commencer)

- **Flux d'écriture des films** : `cacheService.ts:setInL2()` fait `prisma.film.upsert`. **Ne JAMAIS ajouter `letterboxdRating`/`tmdbId`/`letterboxdFetchedAt` à ce upsert** — sinon le sync AlloCiné toutes les 6h écraserait l'enrichissement.
- **Flux de lecture** : `cacheService.ts:getFromL2()` reconstruit un `ParsedFilm[]` depuis la base → `filmService.ts` construit les réponses (`FilmListItem` / `FilmDetailResponse`).
- **Échelle** : Letterboxd `aggregateRating.ratingValue` est déjà sur 0–5, comme `rating` AlloCiné. Aucune conversion.
- **Tests** : l'API a vitest (`apps/api/src/__tests__/*.test.ts`). Le web **n'a pas** d'infra de test → vérification par `tsc --noEmit` + `vite build` + contrôle manuel.

---

## Task 1: Schéma Prisma — nouveaux champs Film

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (modèle `Film`, après `filmAge`)

- [ ] **Step 1: Ajouter les trois champs au modèle `Film`**

Dans `model Film`, juste après la ligne `filmAge Int? @map("film_age")`, ajouter :

```prisma
  tmdbId              Int?      @map("tmdb_id")
  letterboxdRating    Float?    @map("letterboxd_rating")
  letterboxdFetchedAt DateTime? @map("letterboxd_fetched_at")
```

- [ ] **Step 2: Appliquer la migration et régénérer le client**

Run:
```bash
cd apps/api && npx prisma db push && npx prisma generate
```
Expected: `Your database is now in sync with your Prisma schema.` puis `Generated Prisma Client`.

- [ ] **Step 3: Vérifier que le client typé connaît les champs**

Run: `cd apps/api && npx tsc --build`
Expected: compile sans erreur (le client régénéré expose `letterboxdRating`, etc.).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/src/generated
git commit -m "feat(db): add tmdbId, letterboxdRating, letterboxdFetchedAt to Film"
```

---

## Task 2: Propager `letterboxdRating` dans le type interne `ParsedFilm` et la lecture L2

`ParsedFilm` est la forme partagée qui transporte un film de la base vers `filmService`. On l'étend pour transporter la note Letterboxd lue en base. Le chemin AlloCiné la met simplement à `null`.

**Files:**
- Modify: `apps/api/src/services/allocineParser.ts` (interface `ParsedFilm` ~l.39-52, et la construction des films ~l.203+)
- Modify: `apps/api/src/services/cacheService.ts` (mapping `getFromL2` ~l.113-130)

- [ ] **Step 1: Ajouter le champ à l'interface `ParsedFilm`**

Dans `apps/api/src/services/allocineParser.ts`, dans `export interface ParsedFilm`, après `filmAge: number | null;` ajouter :

```typescript
  letterboxdRating: number | null;
```

- [ ] **Step 2: Initialiser `letterboxdRating: null` dans le parser AlloCiné**

Toujours dans `allocineParser.ts`, dans le `push({ ... })` qui construit chaque `ParsedFilm` (là où `filmAge` est défini), ajouter à l'objet :

```typescript
      letterboxdRating: null,
```

- [ ] **Step 3: Lire `letterboxdRating` depuis la base dans `getFromL2`**

Dans `apps/api/src/services/cacheService.ts`, dans le `films.push({ ... })` de `getFromL2` (après `filmAge: st.film.filmAge,`), ajouter :

```typescript
        letterboxdRating: st.film.letterboxdRating,
```

- [ ] **Step 4: Vérifier la compilation**

Run: `cd apps/api && npx tsc --build`
Expected: aucune erreur. (Si une autre construction de `ParsedFilm` manque le champ, TS l'indiquera — ajouter `letterboxdRating: null` à ces endroits.)

- [ ] **Step 5: Lancer les tests existants (non-régression)**

Run: `cd apps/api && npx vitest run`
Expected: tous les tests passent (PASS).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/services/allocineParser.ts apps/api/src/services/cacheService.ts
git commit -m "feat(api): carry letterboxdRating through ParsedFilm and L2 read"
```

---

## Task 3: Fonction pure `extractTmdbId` (TDD)

Extrait l'ID TMDB du premier résultat d'une réponse de recherche TMDB.

**Files:**
- Create: `apps/api/src/services/letterboxdEnrich.ts`
- Test: `apps/api/src/__tests__/letterboxdEnrich.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `apps/api/src/__tests__/letterboxdEnrich.test.ts` :

```typescript
import { describe, it, expect } from 'vitest';
import { extractTmdbId } from '../services/letterboxdEnrich.js';

describe('extractTmdbId', () => {
  it('returns the id of the first result', () => {
    const json = { results: [{ id: 777, title: 'A' }, { id: 888, title: 'B' }] };
    expect(extractTmdbId(json)).toBe(777);
  });

  it('returns null when results is empty', () => {
    expect(extractTmdbId({ results: [] })).toBeNull();
  });

  it('returns null when results is missing or malformed', () => {
    expect(extractTmdbId({})).toBeNull();
    expect(extractTmdbId(null)).toBeNull();
    expect(extractTmdbId({ results: [{ title: 'no id' }] })).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

Run: `cd apps/api && npx vitest run letterboxdEnrich`
Expected: FAIL — `Failed to resolve import` / `extractTmdbId is not a function`.

- [ ] **Step 3: Implémenter `extractTmdbId`**

Créer `apps/api/src/services/letterboxdEnrich.ts` :

```typescript
// Pure parsers + network fetchers for Letterboxd enrichment (no Prisma here).

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

interface TmdbSearchResult {
  id?: unknown;
}
interface TmdbSearchResponse {
  results?: unknown;
}

/** Extract the TMDB movie id of the first search result, or null. */
export function extractTmdbId(json: unknown): number | null {
  const resp = json as TmdbSearchResponse | null;
  const results = resp?.results;
  if (!Array.isArray(results) || results.length === 0) return null;
  const first = results[0] as TmdbSearchResult;
  return typeof first.id === 'number' ? first.id : null;
}
```

- [ ] **Step 4: Lancer le test pour le voir passer**

Run: `cd apps/api && npx vitest run letterboxdEnrich`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/letterboxdEnrich.ts apps/api/src/__tests__/letterboxdEnrich.test.ts
git commit -m "feat(api): add extractTmdbId pure parser"
```

---

## Task 4: Fonction pure `extractLetterboxdRating` (TDD)

Extrait `aggregateRating.ratingValue` du JSON-LD d'une page film Letterboxd. Le JSON-LD est enveloppé dans des commentaires CDATA.

**Files:**
- Modify: `apps/api/src/services/letterboxdEnrich.ts`
- Test: `apps/api/src/__tests__/letterboxdEnrich.test.ts`

- [ ] **Step 1: Ajouter les tests qui échouent**

Dans `apps/api/src/__tests__/letterboxdEnrich.test.ts`, ajouter l'import et un nouveau bloc :

```typescript
import { extractLetterboxdRating } from '../services/letterboxdEnrich.js';

describe('extractLetterboxdRating', () => {
  const page = (jsonLd: string) =>
    `<html><head><script type="application/ld+json">\n/* <![CDATA[ */\n${jsonLd}\n/* ]]> */\n</script></head></html>`;

  it('reads ratingValue from the JSON-LD aggregateRating', () => {
    const html = page(
      JSON.stringify({ '@type': 'Movie', aggregateRating: { ratingValue: 3.86, ratingCount: 1200 } }),
    );
    expect(extractLetterboxdRating(html)).toBe(3.86);
  });

  it('returns null when there is no aggregateRating', () => {
    const html = page(JSON.stringify({ '@type': 'Movie' }));
    expect(extractLetterboxdRating(html)).toBeNull();
  });

  it('returns null when there is no JSON-LD script', () => {
    expect(extractLetterboxdRating('<html><body>nope</body></html>')).toBeNull();
  });

  it('returns null on malformed JSON', () => {
    const html = '<script type="application/ld+json">/* <![CDATA[ */ {bad json} /* ]]> */</script>';
    expect(extractLetterboxdRating(html)).toBeNull();
  });
});
```

- [ ] **Step 2: Lancer les tests pour les voir échouer**

Run: `cd apps/api && npx vitest run letterboxdEnrich`
Expected: FAIL — `extractLetterboxdRating is not a function`.

- [ ] **Step 3: Implémenter `extractLetterboxdRating`**

Dans `apps/api/src/services/letterboxdEnrich.ts`, ajouter :

```typescript
const JSON_LD_RE = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/i;

/** Extract the Letterboxd average rating (0-5) from a film page HTML, or null. */
export function extractLetterboxdRating(html: string): number | null {
  const match = JSON_LD_RE.exec(html);
  if (!match) return null;
  const raw = match[1]
    .replace('/* <![CDATA[ */', '')
    .replace('/* ]]> */', '')
    .trim();
  try {
    const data = JSON.parse(raw) as { aggregateRating?: { ratingValue?: unknown } };
    const value = data.aggregateRating?.ratingValue;
    return typeof value === 'number' ? value : null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Lancer les tests pour les voir passer**

Run: `cd apps/api && npx vitest run letterboxdEnrich`
Expected: PASS (tous les tests des deux blocs).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/services/letterboxdEnrich.ts apps/api/src/__tests__/letterboxdEnrich.test.ts
git commit -m "feat(api): add extractLetterboxdRating JSON-LD parser"
```

---

## Task 5: Fetchers réseau TMDB + Letterboxd

Deux fonctions réseau (pas de Prisma) : chercher l'ID TMDB, puis lire la note Letterboxd via la redirection `/tmdb/{id}/`.

**Files:**
- Modify: `apps/api/src/services/letterboxdEnrich.ts`

- [ ] **Step 1: Ajouter `fetchTmdbId`**

Dans `apps/api/src/services/letterboxdEnrich.ts`, ajouter :

```typescript
const TMDB_SEARCH_URL = 'https://api.themoviedb.org/3/search/movie';
const FETCH_TIMEOUT_MS = 10_000;

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Search TMDB for a film by title (+ optional year). Returns the TMDB id or null. */
export async function fetchTmdbId(
  apiKey: string,
  title: string,
  year: number | null,
): Promise<number | null> {
  const params = new URLSearchParams({
    api_key: apiKey,
    query: title,
    language: 'fr-FR',
    include_adult: 'false',
  });
  if (year != null) params.set('year', String(year));
  const json = await fetchJsonWithTimeout(`${TMDB_SEARCH_URL}?${params.toString()}`);
  return extractTmdbId(json);
}
```

- [ ] **Step 2: Ajouter `fetchLetterboxdRatingByTmdbId`**

Toujours dans le même fichier, ajouter :

```typescript
/** Resolve a TMDB id to a Letterboxd film page and read its average rating (0-5), or null. */
export async function fetchLetterboxdRatingByTmdbId(tmdbId: number): Promise<number | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // letterboxd.com/tmdb/{id}/ redirects (followed by fetch) to the canonical film page.
    const res = await fetch(`https://letterboxd.com/tmdb/${tmdbId}/`, {
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractLetterboxdRating(html);
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 3: Vérifier la compilation**

Run: `cd apps/api && npx tsc --build`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/services/letterboxdEnrich.ts
git commit -m "feat(api): add TMDB search and Letterboxd rating fetchers"
```

---

## Task 6: Config `TMDB_API_KEY`

**Files:**
- Modify: `apps/api/src/config/index.ts`
- Modify: `.env.example` (racine du repo) et `reeltime-v2/CLAUDE.md` (doc des variables)

- [ ] **Step 1: Ajouter `tmdbApiKey` à la config**

Dans `apps/api/src/config/index.ts`, dans l'objet `config`, après `timezone: ...,` ajouter :

```typescript
  tmdbApiKey: process.env.TMDB_API_KEY || '',
```

- [ ] **Step 2: Documenter la variable**

Dans `.env.example` (à la racine du repo `cinemaBrest`), ajouter une ligne :

```
TMDB_API_KEY=
```

Dans `reeltime-v2/CLAUDE.md`, sous « API Environment (`apps/api/.env`) », ajouter une puce :

```
- `TMDB_API_KEY` - Clé API TMDB pour l'enrichissement des notes Letterboxd
```

- [ ] **Step 3: Vérifier la compilation**

Run: `cd apps/api && npx tsc --build`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/config/index.ts .env.example reeltime-v2/CLAUDE.md
git commit -m "feat(api): add TMDB_API_KEY config"
```

---

## Task 7: Service d'orchestration `runLetterboxdEnrichment`

Sélectionne les films à enrichir (jamais enrichis, ou `letterboxdFetchedAt` > 7 jours), appelle les fetchers en rate-limité, persiste le résultat. Ne lève jamais d'erreur vers l'appelant.

**Files:**
- Create: `apps/api/src/services/letterboxdService.ts`

- [ ] **Step 1: Implémenter le service**

Créer `apps/api/src/services/letterboxdService.ts` :

```typescript
import { prisma } from '../lib/prisma.js';
import { config } from '../config/index.js';
import { RateLimiter } from '../utils/rateLimiter.js';
import { fetchTmdbId, fetchLetterboxdRatingByTmdbId } from './letterboxdEnrich.js';

interface Logger {
  info(obj: unknown, msg?: string): void;
  warn(obj: unknown, msg?: string): void;
  error(obj: unknown, msg?: string): void;
}

const STALE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const BATCH_LIMIT = 40; // cap work per run to stay gentle on TMDB/Letterboxd
const rateLimiter = new RateLimiter(1500);

let isEnriching = false;

/** Enrich films missing a recent Letterboxd rating. Background-only, never throws. */
export async function runLetterboxdEnrichment(logger: Logger): Promise<void> {
  if (!config.tmdbApiKey) {
    logger.warn({ msg: 'TMDB_API_KEY not set, skipping Letterboxd enrichment' });
    return;
  }
  if (isEnriching) {
    logger.warn({ msg: 'Letterboxd enrichment already running, skipping' });
    return;
  }
  isEnriching = true;
  const staleBefore = new Date(Date.now() - STALE_MS);

  try {
    const films = await prisma.film.findMany({
      where: {
        OR: [{ letterboxdFetchedAt: null }, { letterboxdFetchedAt: { lt: staleBefore } }],
      },
      select: { id: true, title: true, year: true, productionYear: true },
      take: BATCH_LIMIT,
    });

    logger.info({ count: films.length }, 'Letterboxd enrichment started');

    let updated = 0;
    for (const film of films) {
      try {
        await rateLimiter.acquire();
        const tmdbId = await fetchTmdbId(
          config.tmdbApiKey,
          film.title,
          film.productionYear ?? film.year,
        );
        let rating: number | null = null;
        if (tmdbId != null) {
          await rateLimiter.acquire();
          rating = await fetchLetterboxdRatingByTmdbId(tmdbId);
        }
        await prisma.film.update({
          where: { id: film.id },
          data: { tmdbId, letterboxdRating: rating, letterboxdFetchedAt: new Date() },
        });
        if (rating != null) updated++;
      } catch (err) {
        // Mark as fetched so we don't retry this film in a tight loop.
        await prisma.film
          .update({ where: { id: film.id }, data: { letterboxdFetchedAt: new Date() } })
          .catch(() => {});
        logger.error({ film: film.title, error: String(err) }, 'Letterboxd enrichment failed for film');
      }
    }

    logger.info({ processed: films.length, rated: updated }, 'Letterboxd enrichment complete');
  } catch (err) {
    logger.error({ error: String(err) }, 'Letterboxd enrichment run failed');
  } finally {
    isEnriching = false;
  }
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `cd apps/api && npx tsc --build`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/letterboxdService.ts
git commit -m "feat(api): add background Letterboxd enrichment service"
```

---

## Task 8: Brancher l'enrichissement sur le scheduler

Lancer l'enrichissement en arrière-plan après chaque sync planifié, sans bloquer.

**Files:**
- Modify: `apps/api/src/services/cacheScheduler.ts`

- [ ] **Step 1: Importer et déclencher l'enrichissement après le sync**

Dans `apps/api/src/services/cacheScheduler.ts`, ajouter en haut l'import :

```typescript
import { runLetterboxdEnrichment } from './letterboxdService.js';
```

Puis dans le callback de `cron.schedule`, après `await runFullSync(logger);`, ajouter (fire-and-forget, jamais bloquant) :

```typescript
      // Background enrichment — never blocks the schedule or HTTP path.
      void runLetterboxdEnrichment(logger);
```

Et à la fin de `preloadAll`, après `await runFullSync(logger);`, ajouter :

```typescript
  void runLetterboxdEnrichment(logger);
```

- [ ] **Step 2: Vérifier la compilation**

Run: `cd apps/api && npx tsc --build`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/services/cacheScheduler.ts
git commit -m "feat(api): trigger Letterboxd enrichment after sync"
```

---

## Task 9: Exposer `letterboxdRating` dans les réponses API

**Files:**
- Modify: `apps/api/src/types/filmResponses.ts` (`FilmListItem` ~l.10-22, `FilmDetailResponse` ~l.40-55)
- Modify: `apps/api/src/services/filmService.ts` (3 constructions : ~l.148, ~l.215, ~l.343)

- [ ] **Step 1: Ajouter le champ aux types de réponse**

Dans `apps/api/src/types/filmResponses.ts` :
- dans `interface FilmListItem`, après `rating: number | null;` ajouter `letterboxdRating: number | null;`
- dans `interface FilmDetailResponse`, après `rating: number | null;` ajouter `letterboxdRating: number | null;`

- [ ] **Step 2: Renseigner le champ dans `filmService`**

Dans `apps/api/src/services/filmService.ts`, aux **trois** endroits où un objet film est construit avec `rating: film.rating,` (la liste hebdo ~l.148, le détail ~l.215, la liste filtrée ~l.343), ajouter juste après :

```typescript
      letterboxdRating: film.letterboxdRating,
```

(Pour le détail ~l.215, respecter l'indentation à 4 espaces : `    letterboxdRating: film.letterboxdRating,`.)

- [ ] **Step 3: Vérifier la compilation**

Run: `cd apps/api && npx tsc --build`
Expected: aucune erreur. Si TS signale que `film.letterboxdRating` n'existe pas sur un objet, c'est que cette source vient de `ParsedFilm` (Task 2 le fournit) — vérifier que Task 2 est bien appliqué.

- [ ] **Step 4: Tests de non-régression**

Run: `cd apps/api && npx vitest run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/types/filmResponses.ts apps/api/src/services/filmService.ts
git commit -m "feat(api): expose letterboxdRating in film responses"
```

---

## Task 10: Contrat partagé `@reeltime/types`

Mettre à jour le schéma partagé pour rester honnête, même si web/api définissent leurs propres types.

**Files:**
- Modify: `packages/types/src/film.ts` (`FilmSchema`)
- Modify: `packages/types/src/responses.ts` (schémas de réponse, ~l.24 et ~l.51)

- [ ] **Step 1: Ajouter le champ au `FilmSchema`**

Dans `packages/types/src/film.ts`, dans `FilmSchema`, après la ligne `rating: ...`, ajouter :

```typescript
  letterboxdRating: z.number().min(0).max(5).nullable().optional(),
```

- [ ] **Step 2: Ajouter le champ aux schémas de réponse**

Dans `packages/types/src/responses.ts`, aux deux endroits où figure `rating: z.number().nullable().optional(),` (~l.24 et ~l.51), ajouter juste après :

```typescript
  letterboxdRating: z.number().nullable().optional(),
```

- [ ] **Step 3: Vérifier le build du package types**

Run: `cd packages/types && npx tsc --noEmit`
Expected: aucune erreur. (Si pas de tsconfig dédié, lancer plutôt `cd reeltime-v2 && npx tsc --build` à la racine.)

- [ ] **Step 4: Commit**

```bash
git add packages/types/src/film.ts packages/types/src/responses.ts
git commit -m "feat(types): add letterboxdRating to shared film schemas"
```

---

## Task 11: Types web — `ApiFilm`, `FilmListItem`, `mapFilm`

**Files:**
- Modify: `apps/web/src/api/filmsApi.ts` (`ApiFilm` ~l.10-21, `mapFilm` ~l.58-74)
- Modify: `apps/web/src/types/components.ts` (`FilmListItem` ~l.4-17)

- [ ] **Step 1: Ajouter le champ à `ApiFilm` et `FilmListItem`**

Dans `apps/web/src/api/filmsApi.ts`, dans `interface ApiFilm`, après `rating: number | null;` ajouter :

```typescript
  letterboxdRating: number | null;
```

Dans `apps/web/src/types/components.ts`, dans `interface FilmListItem`, après `rating: number | null;` ajouter :

```typescript
  letterboxdRating: number | null;
```

- [ ] **Step 2: Mapper le champ dans `mapFilm`**

Dans `apps/web/src/api/filmsApi.ts`, dans `mapFilm`, après `rating: film.rating,` ajouter :

```typescript
    letterboxdRating: film.letterboxdRating,
```

- [ ] **Step 3: Vérifier la compilation web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/filmsApi.ts apps/web/src/types/components.ts
git commit -m "feat(web): carry letterboxdRating in web film types"
```

---

## Task 12: Store — seuil `minLetterboxdRating`

**Files:**
- Modify: `apps/web/src/stores/filtersStore.ts`

- [ ] **Step 1: Ajouter l'état, le setter, la persistance et le reset**

Dans `apps/web/src/stores/filtersStore.ts` :

1. Dans `interface FiltersState`, après `minRating: number | null;` ajouter :
```typescript
  minLetterboxdRating: number | null;
```
2. Dans la même interface, après `setMinRating: (r: number | null) => void;` ajouter :
```typescript
  setMinLetterboxdRating: (r: number | null) => void;
```
3. Dans l'état initial (après `minRating: null,`) ajouter :
```typescript
      minLetterboxdRating: null,
```
4. Dans les setters (après `setMinRating: (minRating) => set({ minRating }),`) ajouter :
```typescript
      setMinLetterboxdRating: (minLetterboxdRating) => set({ minLetterboxdRating }),
```
5. Dans `resetAll`, dans l'objet `set({ ... })`, après `minRating: null,` ajouter :
```typescript
minLetterboxdRating: null,
```
6. Dans `partialize`, après `minRating: state.minRating,` ajouter :
```typescript
        minLetterboxdRating: state.minLetterboxdRating,
```

- [ ] **Step 2: Vérifier la compilation web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/filtersStore.ts
git commit -m "feat(web): add minLetterboxdRating to filters store"
```

---

## Task 13: Priorisation douce dans `useFilteredFilms`

Aucun film masqué : quand `minLetterboxdRating` est défini, les films `letterboxdRating >= seuil` passent devant, le reste (note plus basse ou absente) est repoussé en bas. Le tri actif s'applique à l'intérieur de chaque groupe.

**Files:**
- Modify: `apps/web/src/hooks/useFilteredFilms.ts`

- [ ] **Step 1: Lire le seuil depuis le store**

Dans `apps/web/src/hooks/useFilteredFilms.ts`, après `const minRating = useFiltersStore((s) => s.minRating);` ajouter :

```typescript
  const minLetterboxdRating = useFiltersStore((s) => s.minLetterboxdRating);
```

- [ ] **Step 2: Repartitionner après le tri**

Toujours dans `useFilteredFilms`, juste après le bloc `result = [...result].sort(...)` (et avant `return result;`), ajouter :

```typescript
    // Soft prioritization by Letterboxd rating: nothing is hidden — films at or
    // above the threshold float to the top, others (lower or unrated) sink, while
    // keeping the active sort order within each group.
    if (minLetterboxdRating !== null) {
      const meets = (f: FilmListItem) => (f.letterboxdRating ?? -1) >= minLetterboxdRating;
      result = [...result].sort((a, b) => Number(meets(b)) - Number(meets(a)));
    }
```

- [ ] **Step 3: Ajouter au tableau de dépendances du `useMemo`**

Dans la liste de dépendances du `useMemo` (la ligne `[films, searchQuery, ..., minAge]`), ajouter `minLetterboxdRating` :

```typescript
  }, [films, searchQuery, selectedCinemas, version, minTime, minRating, sort, dayFilter, timeSlot, minAge, minLetterboxdRating]);
```

- [ ] **Step 4: Compter dans `activeFilterCount`**

Dans le calcul de `activeFilterCount`, ajouter un terme :

```typescript
    (minLetterboxdRating !== null ? 1 : 0) +
```

(L'insérer dans la somme, par ex. après `(minRating !== null ? 1 : 0) +` — attention à garder une expression bien formée.)

- [ ] **Step 5: Vérifier la compilation web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/useFilteredFilms.ts
git commit -m "feat(web): soft-prioritize films by Letterboxd rating"
```

---

## Task 14: Contrôle UI du seuil dans la FilterBar

**Files:**
- Modify: `apps/web/src/components/filters/FilterBar.tsx`

- [ ] **Step 1: Lire l'état du store dans le composant**

Dans `apps/web/src/components/filters/FilterBar.tsx`, près des autres lectures du store (ex. après `const setMinAge = useFiltersStore((s) => s.setMinAge);`), ajouter :

```typescript
  const minLetterboxdRating = useFiltersStore((s) => s.minLetterboxdRating);
  const setMinLetterboxdRating = useFiltersStore((s) => s.setMinLetterboxdRating);
```

- [ ] **Step 2: Ajouter le `<select>` dans la grille du panneau**

Dans le panneau de filtres, juste après le `<select>` de `minAge` (celui dont les options vont de `Tous films` à `+50 ans`), ajouter un nouveau `<select>` utilisant la même classe `selectClass` :

```tsx
              <select
                value={minLetterboxdRating ?? 'all'}
                onChange={(e) =>
                  setMinLetterboxdRating(e.target.value === 'all' ? null : Number(e.target.value))
                }
                className={selectClass}
              >
                <option value="all">Toute note LB</option>
                <option value="3">LB ≥ 3</option>
                <option value="3.5">LB ≥ 3.5</option>
                <option value="4">LB ≥ 4</option>
                <option value="4.5">LB ≥ 4.5</option>
              </select>
```

- [ ] **Step 3: Ajouter un tag actif retirable**

Dans la construction de `activeTags`, après le bloc qui gère `minAge`, ajouter :

```typescript
    if (minLetterboxdRating !== null) {
      activeTags.push({
        label: `LB ≥ ${minLetterboxdRating}`,
        onRemove: () => setMinLetterboxdRating(null),
      });
    }
```

- [ ] **Step 4: Vérifier la compilation web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/filters/FilterBar.tsx
git commit -m "feat(web): add Letterboxd rating threshold control to FilterBar"
```

---

## Task 15: Affichage de la note sur FilmCard et FilmDrawer

**Files:**
- Modify: `apps/web/src/components/FilmCard.tsx`
- Modify: `apps/web/src/components/FilmDrawer.tsx`

- [ ] **Step 1: Badge note Letterboxd sur la carte**

Dans `apps/web/src/components/FilmCard.tsx`, à l'intérieur du `<div className="relative">`, juste après la fermeture du `<div className="absolute inset-0 bg-gradient-to-t ..." />` (l'overlay), ajouter un badge en haut à droite :

```tsx
        {film.letterboxdRating != null && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-noir-velours/80 px-2 py-0.5 font-bebas text-xs text-or-antique">
            <span aria-hidden>★</span>
            <span>{film.letterboxdRating.toFixed(1)}</span>
            <span className="text-[9px] opacity-80">LB</span>
          </div>
        )}
```

- [ ] **Step 2: Note Letterboxd dans le tiroir de détail**

Dans `apps/web/src/components/FilmDrawer.tsx`, dans la zone des métadonnées (près du lien `film.letterboxdUrl`, ~l.189), ajouter avant ou après ce lien :

```tsx
              {film.letterboxdRating != null && (
                <span className="font-crimson text-sm text-or-antique">
                  ★ {film.letterboxdRating.toFixed(1)} Letterboxd
                </span>
              )}
```

(Adapter le wrapper/séparateur au markup existant autour de `letterboxdUrl` pour rester cohérent visuellement.)

- [ ] **Step 3: Vérifier la compilation web**

Run: `cd apps/web && npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/FilmCard.tsx apps/web/src/components/FilmDrawer.tsx
git commit -m "feat(web): display Letterboxd rating on card and drawer"
```

---

## Task 16: Vérification finale de bout en bout

**Files:** aucun (vérification)

- [ ] **Step 1: Build + tests API**

Run: `cd apps/api && npx tsc --build && npx vitest run`
Expected: build OK, tous les tests PASS.

- [ ] **Step 2: Typecheck + build web**

Run: `cd apps/web && npx tsc --noEmit && npx vite build`
Expected: typecheck OK, build Vite réussi.

- [ ] **Step 3: Vérification manuelle de l'enrichissement (optionnel mais recommandé)**

Avec `TMDB_API_KEY` renseignée dans `apps/api/.env`, lancer l'API en dev, déclencher un sync (ou attendre le scheduler), puis ouvrir `npx prisma studio` et vérifier que certains films ont `letterboxd_rating` renseigné et `letterboxd_fetched_at` daté.

Côté web : ouvrir l'app, vérifier que le badge LB apparaît sur les cartes notées, et que choisir « LB ≥ 4 » remonte les films bien notés sans masquer les autres.

- [ ] **Step 4: Notification de fin**

Run:
```bash
powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()"
```

---

## Auto-revue du plan (déjà effectuée)

- **Couverture du spec** : données Prisma (T1), service TMDB→Letterboxd (T3-T5,T7), enrichissement paresseux 7j + rate-limit + jamais sur le chemin HTTP (T7,T8), config TMDB_API_KEY (T6), types partagés + API (T9,T10), store + priorisation douce (T12,T13), UI FilterBar (T14), affichage carte/drawer (T15). Tous les points du spec sont couverts.
- **Comportement clé** : la priorisation douce (aucun film masqué) est implémentée comme un re-tri stable (T13), pas un `.filter()`.
- **Cohérence des noms** : `letterboxdRating`, `tmdbId`, `letterboxdFetchedAt`, `minLetterboxdRating`, `setMinLetterboxdRating`, `runLetterboxdEnrichment`, `extractTmdbId`, `extractLetterboxdRating`, `fetchTmdbId`, `fetchLetterboxdRatingByTmdbId` — utilisés de façon identique partout.
- **Anti-clobber** : note explicite de ne pas ajouter les champs Letterboxd au `upsert` AlloCiné de `setInL2` (Notes de contexte + T2).
