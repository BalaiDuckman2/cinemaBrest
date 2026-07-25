# Refonte ergonomique mobile (PWA web) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre `apps/web` utilisable à une main sur téléphone — diviser par trois le chrome avant le premier film, porter toutes les cibles tactiles au-dessus de 44 px, et rendre les feuilles fermables au doigt.

**Architecture :** Trois changements structurels. (1) La pagination par semaine calendaire est remplacée par une fenêtre de dates glissante démarrant aujourd'hui, ce qui supprime `WeekNavigator` et les puces de jours grisées. (2) Une primitive `<BottomSheet>` avec glissement à la vélocité est extraite de `FilmDrawer`, puis réutilisée par la feuille de filtres et les feuilles de sélection qui remplacent les `<select>`. (3) La navigation mobile descend dans une barre d'onglets, le header cesse d'être collé et les commandes migrent dans la barre de dates, seul élément désormais épinglé en haut.

**Tech Stack :** React 19, TypeScript 5.9, Vite 6, Tailwind 3, React Query 5, Zustand 5, Vitest 4.

**Spec :** `docs/superpowers/specs/2026-07-25-refonte-ergonomie-mobile-design.md`

## Global Constraints

- **Aucun changement API ni base.** Tout est côté client. `GET /api/v1/films?weekOffset=N` reste l'unique source.
- **Breakpoint mobile = `md` de Tailwind (768 px).** `md:` désigne le desktop.
- **Cible tactile minimale 44 px**, 48 px pour les listes d'options.
- **Taille de texte minimale 11 px.** Les classes `text-[9px]` et `text-[10px]` sont proscrites.
- **Palette et polices inchangées** : `rouge-cinema` `#D32F2F`, `noir-velours` `#1A1A1A`, `creme-ecran` `#FFF8E1`, `or-antique` `#FFD54F`, `sepia-chaud` `#8D6E63`, `beige-papier` `#EFEBE9`, `bordeaux-profond` `#5D4037` ; `font-bebas` pour les libellés UI, `font-playfair` pour les titres, `font-crimson` pour le texte courant.
- **Libellés en français**, sans abréviation inventée.
- **React 19 :** `useRef<T>(undefined)` et non `useRef<T>()`.
- **Les barils `src/components/index.ts` et `src/hooks/index.ts` doivent être mis à jour** à chaque ajout ou suppression de fichier.
- **Zustand persist :** tout état transitoire reste hors du `partialize` de `filtersStore`.
- **Vérification à chaque tâche :** `npx tsc --noEmit` puis `npx vite build` depuis `apps/web`, plus `npx vitest run` quand la tâche touche du code testé.

## Phases et points d'arrêt

| Phase | Tâches | Livrable arrêtable |
|---|---|---|
| 1 — Modèle de dates | 1 à 5 | L'app tourne sur la fenêtre glissante, `WeekNavigator` supprimé |
| 2 — Gestes et feuilles | 6 à 10 | Toutes les feuilles se ferment au doigt, `<select>` remplacés |
| 3 — Chrome mobile | 11 à 12 | Barre d'onglets et barre de dates collée en place |
| 4 — Séances et fluidité | 13 à 14 | Séances en lignes, saisie de recherche fluide |

L'app doit builder et fonctionner à la fin de **chaque** tâche.

---

# Phase 1 — Modèle de dates

### Task 1: Outillage de test web + utilitaires de dates

**Files:**
- Create: `apps/web/vitest.config.ts`
- Create: `apps/web/src/__tests__/dates.test.ts`
- Modify: `apps/web/package.json` (scripts `test`/`test:watch`, devDependency `vitest`)
- Modify: `apps/web/src/utils/dates.ts` (ajouts en fin de fichier)

**Interfaces:**
- Consumes: rien.
- Produces:
  - `addDays(dateStr: string, n: number): string`
  - `mondayOf(dateStr: string): string`
  - `rangeDates(from: string, to: string): string[]`
  - `rangeEnd(today: string, weeks: number): string`
  - `weeksNeededFor(target: string, today: string): number`

Les dates sont des chaînes `YYYY-MM-DD`. Toutes ces fonctions suivent la convention déjà en place dans `dates.ts` : parsing en `new Date(dateStr + 'T12:00:00Z')` puis accesseurs UTC, ce qui immunise contre les changements d'heure d'été.

- [ ] **Step 1: Installer vitest dans apps/web**

```bash
cd reeltime-v2/apps/web
pnpm add -D vitest@^4.0.18
```

- [ ] **Step 2: Créer la configuration vitest**

Créer `apps/web/vitest.config.ts` (calquée sur `apps/api/vitest.config.ts`) :

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
```

Environnement `node` et non `jsdom` : seules des fonctions pures sont testées. Les composants et les gestes sont vérifiés manuellement (voir la section Vérification manuelle de chaque tâche).

- [ ] **Step 3: Ajouter les scripts de test**

Dans `apps/web/package.json`, ajouter dans `scripts`, après `"lint"` :

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

`turbo.json` déclare déjà une tâche `test` : `pnpm test` à la racine les exécutera.

- [ ] **Step 4: Écrire les tests qui échouent**

Créer `apps/web/src/__tests__/dates.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { addDays, mondayOf, rangeDates, rangeEnd, weeksNeededFor } from '../utils/dates';

// Repères : 2026-07-25 samedi, 2026-07-26 dimanche, 2026-07-27 lundi.

describe('addDays', () => {
  it('avance et recule', () => {
    expect(addDays('2026-07-25', 1)).toBe('2026-07-26');
    expect(addDays('2026-07-25', -1)).toBe('2026-07-24');
    expect(addDays('2026-07-25', 0)).toBe('2026-07-25');
  });

  it('franchit les mois et les années', () => {
    expect(addDays('2026-07-31', 1)).toBe('2026-08-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('ignore les changements d heure', () => {
    // Passage à l'heure d'été en France : nuit du 28 au 29 mars 2026.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29');
    // Passage à l'heure d'hiver : nuit du 24 au 25 octobre 2026.
    expect(addDays('2026-10-24', 1)).toBe('2026-10-25');
  });
});

describe('mondayOf', () => {
  it('renvoie le lundi de la semaine', () => {
    expect(mondayOf('2026-07-27')).toBe('2026-07-27'); // lundi -> lui-même
    expect(mondayOf('2026-07-25')).toBe('2026-07-20'); // samedi
    expect(mondayOf('2026-07-26')).toBe('2026-07-20'); // dimanche, pas le lundi suivant
  });
});

describe('rangeDates', () => {
  it('inclut les deux bornes', () => {
    expect(rangeDates('2026-07-25', '2026-07-27')).toEqual([
      '2026-07-25',
      '2026-07-26',
      '2026-07-27',
    ]);
  });

  it('renvoie un seul jour quand les bornes sont égales', () => {
    expect(rangeDates('2026-07-25', '2026-07-25')).toEqual(['2026-07-25']);
  });

  it('renvoie une liste vide quand la fin précède le début', () => {
    expect(rangeDates('2026-07-27', '2026-07-25')).toEqual([]);
  });
});

describe('rangeEnd', () => {
  it('renvoie le dimanche de la dernière semaine chargée', () => {
    expect(rangeEnd('2026-07-27', 2)).toBe('2026-08-09'); // lundi -> 14 jours
    expect(rangeEnd('2026-07-25', 2)).toBe('2026-08-02'); // samedi -> 9 jours
    expect(rangeEnd('2026-07-26', 2)).toBe('2026-08-02'); // dimanche -> 8 jours, le minimum
  });

  it('une seule semaine s arrête au dimanche courant', () => {
    expect(rangeEnd('2026-07-25', 1)).toBe('2026-07-26');
  });
});

describe('weeksNeededFor', () => {
  it('demande une semaine pour aujourd hui ou le passé', () => {
    expect(weeksNeededFor('2026-07-25', '2026-07-25')).toBe(1);
    expect(weeksNeededFor('2026-07-01', '2026-07-25')).toBe(1);
  });

  it('demande une semaine pour une date de la semaine courante', () => {
    expect(weeksNeededFor('2026-07-26', '2026-07-25')).toBe(1);
  });

  it('compte les semaines calendaires d écart', () => {
    expect(weeksNeededFor('2026-07-27', '2026-07-25')).toBe(2); // semaine suivante
    expect(weeksNeededFor('2026-08-09', '2026-07-25')).toBe(3);
  });

  it('reste cohérent avec rangeEnd', () => {
    const today = '2026-07-25';
    const target = '2026-08-09';
    expect(rangeEnd(today, weeksNeededFor(target, today)) >= target).toBe(true);
  });
});
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd reeltime-v2/apps/web && npx vitest run
```

Attendu : ÉCHEC, `addDays is not a function` (ou une erreur d'import équivalente).

- [ ] **Step 6: Implémenter les fonctions**

Ajouter à la fin de `apps/web/src/utils/dates.ts` :

```ts
/** Date ISO décalée de n jours (n peut être négatif). */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lundi de la semaine calendaire contenant dateStr. */
export function mondayOf(dateStr: string): string {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay(); // 0 = dimanche
  return addDays(dateStr, -(dow === 0 ? 6 : dow - 1));
}

/** Toutes les dates de from à to inclus. Liste vide si to précède from. */
export function rangeDates(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** Dernier jour couvert par `weeks` semaines à partir de la semaine de today. */
export function rangeEnd(today: string, weeks: number): string {
  return addDays(mondayOf(today), weeks * 7 - 1);
}

/** Nombre de semaines à charger pour que `target` tombe dans la fenêtre. */
export function weeksNeededFor(target: string, today: string): number {
  if (target <= today) return 1;
  const from = Date.parse(mondayOf(today) + 'T12:00:00Z');
  const to = Date.parse(mondayOf(target) + 'T12:00:00Z');
  return Math.round((to - from) / (7 * 86_400_000)) + 1;
}
```

- [ ] **Step 7: Lancer les tests pour vérifier qu'ils passent**

```bash
cd reeltime-v2/apps/web && npx vitest run
```

Attendu : SUCCÈS, 13 tests.

- [ ] **Step 8: Vérifier la compilation**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit
```

Attendu : aucune sortie.

- [ ] **Step 9: Commit**

```bash
git add reeltime-v2/apps/web/vitest.config.ts reeltime-v2/apps/web/package.json reeltime-v2/apps/web/src/utils/dates.ts reeltime-v2/apps/web/src/__tests__/dates.test.ts reeltime-v2/pnpm-lock.yaml
git commit -m "test(web): vitest + utilitaires de dates pour la fenetre glissante"
```

---

### Task 2: Fusion des pages de films

**Files:**
- Create: `apps/web/src/utils/mergeFilms.ts`
- Create: `apps/web/src/__tests__/mergeFilms.test.ts`

**Interfaces:**
- Consumes: `FilmsData` de `apps/web/src/api/filmsApi.ts`, `FilmListItem` et `ShowtimeEntry` de `apps/web/src/types/components.ts`.
- Produces: `mergeFilmPages(pages: FilmsData[], from: string, to: string): FilmListItem[]`

Deux semaines chargées peuvent contenir le même film. La fusion unionne les séances et rogne sur la fenêtre. Les identifiants de séance sont déterministes côté `filmsApi` (`${filmId}-${cinemaId}-${date}-${time}`), la déduplication par `id` est donc fiable.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/web/src/__tests__/mergeFilms.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { mergeFilmPages } from '../utils/mergeFilms';
import type { FilmsData } from '../api/filmsApi';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

function showtime(filmId: string, date: string, time: string, cinemaId = 'P0153'): ShowtimeEntry {
  return {
    id: `${filmId}-${cinemaId}-${date}-${time}`,
    filmId,
    cinemaId,
    cinemaName: 'Les Studios',
    datetime: `${date}T${time}:00`,
    time,
    version: 'VF',
    bookingUrl: null,
  };
}

function film(id: string, title: string, showtimes: ShowtimeEntry[]): FilmListItem {
  return {
    id,
    title,
    year: 2026,
    posterUrl: null,
    rating: null,
    letterboxdRating: null,
    filmAge: null,
    synopsis: null,
    director: null,
    cast: [],
    genres: [],
    runtime: 120,
    letterboxdUrl: null,
    showtimes,
  };
}

function page(weekOffset: number, films: FilmListItem[]): FilmsData {
  return {
    films,
    meta: { weekStart: '2026-07-20', weekEnd: '2026-07-26', weekOffset, totalFilms: films.length },
  };
}

describe('mergeFilmPages', () => {
  it('unionne les séances d un film présent dans deux pages', () => {
    const a = page(0, [film('1', 'Dune', [showtime('1', '2026-07-25', '14:10')])]);
    const b = page(1, [film('1', 'Dune', [showtime('1', '2026-07-28', '20:00')])]);

    const result = mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(result).toHaveLength(1);
    expect(result[0].showtimes).toHaveLength(2);
  });

  it('ne duplique pas une séance présente dans les deux pages', () => {
    const st = showtime('1', '2026-07-26', '18:00');
    const a = page(0, [film('1', 'Dune', [st])]);
    const b = page(1, [film('1', 'Dune', [{ ...st }])]);

    const result = mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(result[0].showtimes).toHaveLength(1);
  });

  it('rogne les séances hors de la fenêtre', () => {
    const a = page(0, [
      film('1', 'Dune', [
        showtime('1', '2026-07-20', '14:00'), // avant la fenêtre
        showtime('1', '2026-07-25', '18:00'), // dedans
        showtime('1', '2026-08-05', '21:00'), // après
      ]),
    ]);

    const result = mergeFilmPages([a], '2026-07-25', '2026-08-02');

    expect(result[0].showtimes.map((s) => s.time)).toEqual(['18:00']);
  });

  it('écarte un film qui n a plus aucune séance dans la fenêtre', () => {
    const a = page(0, [film('1', 'Dune', [showtime('1', '2026-07-20', '14:00')])]);

    expect(mergeFilmPages([a], '2026-07-25', '2026-08-02')).toEqual([]);
  });

  it('trie les séances chronologiquement', () => {
    const a = page(0, [film('1', 'Dune', [showtime('1', '2026-07-28', '20:00')])]);
    const b = page(1, [film('1', 'Dune', [showtime('1', '2026-07-25', '14:10')])]);

    const result = mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(result[0].showtimes.map((s) => s.datetime)).toEqual([
      '2026-07-25T14:10:00',
      '2026-07-28T20:00:00',
    ]);
  });

  it('conserve les métadonnées de la première page qui contient le film', () => {
    const a = page(0, [film('1', 'Titre de reference', [showtime('1', '2026-07-25', '14:10')])]);
    const b = page(1, [film('1', 'Titre concurrent', [showtime('1', '2026-07-28', '20:00')])]);

    expect(mergeFilmPages([a, b], '2026-07-25', '2026-08-02')[0].title).toBe('Titre de reference');
  });

  it('ne modifie pas les pages reçues', () => {
    const original = showtime('1', '2026-07-25', '14:10');
    const a = page(0, [film('1', 'Dune', [original])]);
    const b = page(1, [film('1', 'Dune', [showtime('1', '2026-07-28', '20:00')])]);

    mergeFilmPages([a, b], '2026-07-25', '2026-08-02');

    expect(a.films[0].showtimes).toHaveLength(1);
  });

  it('accepte une liste de pages vide', () => {
    expect(mergeFilmPages([], '2026-07-25', '2026-08-02')).toEqual([]);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd reeltime-v2/apps/web && npx vitest run mergeFilms
```

Attendu : ÉCHEC, module `../utils/mergeFilms` introuvable.

- [ ] **Step 3: Implémenter la fusion**

Créer `apps/web/src/utils/mergeFilms.ts` :

```ts
import type { FilmsData } from '../api/filmsApi';
import type { FilmListItem } from '../types/components';

/**
 * Fusionne plusieurs semaines de résultats en un seul catalogue rogné sur
 * [from, to]. Les métadonnées d'un film viennent de la première page qui le
 * contient ; seules les séances sont unionnées, dédoublonnées par `id`.
 * Les pages reçues ne sont jamais modifiées.
 */
export function mergeFilmPages(pages: FilmsData[], from: string, to: string): FilmListItem[] {
  const byId = new Map<string, FilmListItem>();

  for (const page of pages) {
    for (const film of page.films) {
      const existing = byId.get(film.id);
      if (!existing) {
        byId.set(film.id, { ...film, showtimes: [...film.showtimes] });
        continue;
      }
      const seen = new Set(existing.showtimes.map((st) => st.id));
      for (const st of film.showtimes) {
        if (!seen.has(st.id)) existing.showtimes.push(st);
      }
    }
  }

  const out: FilmListItem[] = [];
  for (const film of byId.values()) {
    const showtimes = film.showtimes
      .filter((st) => {
        const date = st.datetime.slice(0, 10);
        return date >= from && date <= to;
      })
      .sort((a, b) => a.datetime.localeCompare(b.datetime));
    if (showtimes.length > 0) out.push({ ...film, showtimes });
  }
  return out;
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
cd reeltime-v2/apps/web && npx vitest run
```

Attendu : SUCCÈS, 21 tests au total.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/mergeFilms.ts reeltime-v2/apps/web/src/__tests__/mergeFilms.test.ts
git commit -m "feat(web): fusion des semaines de films pour la fenetre glissante"
```

---

### Task 3: Hook `useFilmsRange`

**Files:**
- Create: `apps/web/src/hooks/useFilmsRange.ts`
- Modify: `apps/web/src/hooks/index.ts`

**Interfaces:**
- Consumes: `mergeFilmPages` (Task 2) ; `rangeEnd`, `rangeDates`, `weeksNeededFor`, `localISODate` (Task 1 et existant) ; `fetchFilms`, `FilmsData` de `filmsApi` ; `queryKeys.films.week`.
- Produces:

```ts
interface FilmsRange {
  films: FilmListItem[];   // fusionnés et rognés sur la fenêtre
  dates: string[];         // toutes les dates de la fenêtre, aujourd'hui en tête
  rangeStart: string;
  rangeEnd: string;
  isLoading: boolean;      // seule la première semaine pilote le squelette
  isLoadingMore: boolean;  // semaines ajoutées par loadMore()
  isError: boolean;
  refetch: () => void;
  loadMore: () => void;
  weeks: number;
}
export function useFilmsRange(targetDate?: string | null): FilmsRange
```

`useFilms(weekOffset)` reste en place : `SoireeBar` et `MesSoireesPage` l'utilisent, et React Query déduplique avec les requêtes de ce hook (mêmes clés).

- [ ] **Step 1: Écrire le hook**

Créer `apps/web/src/hooks/useFilmsRange.ts` :

```ts
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchFilms, type FilmsData } from '../api/filmsApi';
import { queryKeys } from '../services/queryKeys';
import { mergeFilmPages } from '../utils/mergeFilms';
import { localISODate, rangeDates, rangeEnd, weeksNeededFor } from '../utils/dates';
import type { FilmListItem } from '../types/components';

/** Nombre de semaines chargées au démarrage : garantit une fenêtre de 8 à 14 jours. */
const INITIAL_WEEKS = 2;

export interface FilmsRange {
  films: FilmListItem[];
  dates: string[];
  rangeStart: string;
  rangeEnd: string;
  isLoading: boolean;
  isLoadingMore: boolean;
  isError: boolean;
  refetch: () => void;
  loadMore: () => void;
  weeks: number;
}

/**
 * Catalogue sur une fenêtre glissante démarrant aujourd'hui, et non sur la
 * semaine calendaire. `targetDate` (typiquement le `?date=` de l'URL) étend
 * automatiquement le chargement si la date visée tombe au-delà de la fenêtre.
 */
export function useFilmsRange(targetDate?: string | null): FilmsRange {
  const today = localISODate();
  const [weeks, setWeeks] = useState(INITIAL_WEEKS);

  useEffect(() => {
    if (!targetDate) return;
    const needed = weeksNeededFor(targetDate, today);
    setWeeks((w) => (needed > w ? needed : w));
  }, [targetDate, today]);

  const results = useQueries({
    queries: Array.from({ length: weeks }, (_, offset) => ({
      queryKey: queryKeys.films.week(offset),
      queryFn: () => fetchFilms(offset),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
    })),
  });

  const to = rangeEnd(today, weeks);

  // `results` est un nouveau tableau à chaque rendu, mais les `data` de React
  // Query sont stables : `dataUpdatedAt` suffit à détecter un vrai changement.
  const signature = results.map((r) => r.dataUpdatedAt).join('|');

  const films = useMemo(
    () =>
      mergeFilmPages(
        results.map((r) => r.data).filter((d): d is FilmsData => d != null),
        today,
        to,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [signature, today, to],
  );

  const dates = useMemo(() => rangeDates(today, to), [today, to]);

  const refetch = useCallback(() => {
    for (const r of results) r.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const loadMore = useCallback(() => setWeeks((w) => w + 1), []);

  return {
    films,
    dates,
    rangeStart: today,
    rangeEnd: to,
    // La première semaine seule pilote le squelette : ajouter une semaine via
    // loadMore() ne doit pas faire disparaître la liste déjà affichée.
    isLoading: results[0]?.isLoading ?? true,
    isLoadingMore: results.slice(1).some((r) => r.isLoading),
    isError: results[0]?.isError ?? false,
    refetch,
    loadMore,
    weeks,
  };
}
```

- [ ] **Step 2: Exporter le hook**

Dans `apps/web/src/hooks/index.ts`, ajouter après la ligne `export { useFilms } from './useFilms';` :

```ts
export { useFilmsRange } from './useFilmsRange';
```

- [ ] **Step 3: Vérifier la compilation**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

Attendu : compilation et build sans erreur. Le hook n'est pas encore consommé.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/hooks/useFilmsRange.ts reeltime-v2/apps/web/src/hooks/index.ts
git commit -m "feat(web): hook useFilmsRange sur fenetre glissante"
```

---

### Task 4: `useSelectedDate` et composant `DateStrip`

**Files:**
- Create: `apps/web/src/hooks/useSelectedDate.ts`
- Create: `apps/web/src/components/DateStrip.tsx`
- Modify: `apps/web/src/hooks/index.ts`
- Modify: `apps/web/src/components/index.ts`

**Interfaces:**
- Consumes: `useFiltersStore` (`selectedDate`, `setSelectedDate`) ; `localISODate`, `formatDayShort` de `dates.ts`.
- Produces:
  - `useSelectedDate(): { selectedDate: string | null; setSelectedDate: (d: string | null) => void }`
  - `<DateStrip dates value onChange onLoadMore isLoadingMore hideAllChip />`

`DateStrip` remplace `DayStrip` : puces de 48 px sur deux lignes, aucune puce désactivée, accrochage au défilement, puce active recentrée au montage, puce `+ 7 jours` en fin de bande.

- [ ] **Step 1: Écrire le hook de synchronisation d'URL**

Créer `apps/web/src/hooks/useSelectedDate.ts` :

```ts
import { useCallback, useEffect, useRef } from 'react';
import { useFiltersStore } from '../stores/filtersStore';

function dateFromUrl(): string | null {
  const raw = new URLSearchParams(window.location.search).get('date');
  return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

/**
 * Lie `selectedDate` du store au paramètre `?date=` de l'URL, pour qu'un lien
 * partagé désigne un jour et non un décalage relatif à la date d'ouverture.
 * Un `?week=` résiduel des anciennes URL est simplement ignoré.
 */
export function useSelectedDate() {
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);
  const initialised = useRef(false);

  // Lecture initiale.
  useEffect(() => {
    const fromUrl = dateFromUrl();
    if (fromUrl) setSelectedDate(fromUrl);
  }, [setSelectedDate]);

  // Écriture vers l'URL. Le premier passage est ignoré : il aurait effacé le
  // `?date=` de l'URL avant que la lecture initiale ne soit appliquée au store.
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      return;
    }
    const url = new URL(window.location.href);
    if (selectedDate) url.searchParams.set('date', selectedDate);
    else url.searchParams.delete('date');
    if (url.toString() !== window.location.href) {
      window.history.pushState({}, '', url.toString());
    }
  }, [selectedDate]);

  // Retour arrière navigateur.
  useEffect(() => {
    const onPop = () => setSelectedDate(dateFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [setSelectedDate]);

  return { selectedDate, setSelectedDate: useCallback(setSelectedDate, [setSelectedDate]) };
}
```

- [ ] **Step 2: Écrire le composant DateStrip**

Créer `apps/web/src/components/DateStrip.tsx` :

```tsx
import { useEffect, useRef } from 'react';
import { formatDayShort, localISODate } from '../utils/dates';

interface DateStripProps {
  /** Toutes les dates de la fenêtre (YYYY-MM-DD), aujourd'hui en tête. */
  dates: string[];
  /** Date sélectionnée, ou null pour toute la fenêtre. */
  value: string | null;
  onChange: (date: string | null) => void;
  /** Charge une semaine de plus. Masque la puce si absent. */
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  /** Masque la puce « Tous » (planificateur de soirée : un jour est obligatoire). */
  hideAllChip?: boolean;
}

/** « sam. 26 » -> { day: 'sam.', num: '26' } pour l'affichage sur deux lignes. */
function splitDayLabel(date: string): { day: string; num: string } {
  const [day, num] = formatDayShort(date).split(' ');
  return { day, num };
}

export function DateStrip({
  dates,
  value,
  onChange,
  onLoadMore,
  isLoadingMore = false,
  hideAllChip = false,
}: DateStripProps) {
  const today = localISODate();
  const activeRef = useRef<HTMLButtonElement>(null);

  // Amène la puce active dans le viewport horizontal au montage, sans faire
  // défiler la page verticalement (block: 'nearest').
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  const chipClass = (selected: boolean) =>
    `font-bebas shrink-0 snap-center flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 rounded-xl border-2 text-xs uppercase tracking-wide transition-colors ${
      selected
        ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
        : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
    }`;

  return (
    <div
      className="flex gap-1.5 overflow-x-auto snap-x snap-proximity overscroll-x-contain pb-1"
      role="group"
      aria-label="Filtrer par jour"
    >
      {!hideAllChip && (
        <button
          type="button"
          ref={value === null ? activeRef : undefined}
          onClick={() => onChange(null)}
          aria-pressed={value === null}
          className={chipClass(value === null)}
        >
          <span>Tous</span>
          <span className="text-[11px] opacity-80 normal-case">{dates.length} j</span>
        </button>
      )}

      {dates.map((date) => {
        const { day, num } = splitDayLabel(date);
        const isToday = date === today;
        const selected = value === date;
        return (
          <button
            key={date}
            type="button"
            ref={selected ? activeRef : undefined}
            onClick={() => onChange(date)}
            aria-pressed={selected}
            aria-label={isToday ? "Aujourd'hui" : formatDayShort(date)}
            className={chipClass(selected)}
          >
            <span>{isToday ? 'Auj.' : day}</span>
            <span className="font-playfair text-base font-bold leading-none">{num}</span>
          </button>
        );
      })}

      {onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isLoadingMore}
          className="font-bebas shrink-0 flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 rounded-xl border-2 border-dashed border-sepia-chaud bg-beige-papier text-sepia-chaud text-xs uppercase tracking-wide hover:border-rouge-cinema hover:text-rouge-cinema transition-colors disabled:opacity-50"
        >
          {isLoadingMore ? <span>…</span> : <><span>+7</span><span className="text-[11px] normal-case">jours</span></>}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Mettre à jour les barils**

Dans `apps/web/src/hooks/index.ts`, ajouter :

```ts
export { useSelectedDate } from './useSelectedDate';
```

Dans `apps/web/src/components/index.ts`, ajouter à côté de la ligne `DayStrip` (qui sera retirée à la tâche 5) :

```ts
export { DateStrip } from './DateStrip';
```

- [ ] **Step 4: Vérifier la compilation**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

Attendu : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/src/hooks/useSelectedDate.ts reeltime-v2/apps/web/src/components/DateStrip.tsx reeltime-v2/apps/web/src/hooks/index.ts reeltime-v2/apps/web/src/components/index.ts
git commit -m "feat(web): DateStrip et synchronisation ?date= dans l URL"
```

---

### Task 5: Câbler `HomePage`, supprimer la pagination par semaine

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`
- Delete: `apps/web/src/components/WeekNavigator.tsx`
- Delete: `apps/web/src/components/DayStrip.tsx`
- Delete: `apps/web/src/hooks/useWeekNavigation.ts`
- Modify: `apps/web/src/components/index.ts`
- Modify: `apps/web/src/hooks/index.ts`

**Interfaces:**
- Consumes: `useFilmsRange` (Task 3), `useSelectedDate` et `DateStrip` (Task 4).
- Produces: rien de nouveau. C'est le point où la phase 1 devient visible.

C'est la tâche la plus risquée de la phase : elle retire trois fichiers et réécrit le corps de `HomePage`. Le bouton « Ce soir » du bandeau reste en place jusqu'à la tâche 10, où il migre dans la feuille de filtres.

- [ ] **Step 1: Réécrire le haut de HomePage**

Dans `apps/web/src/pages/HomePage.tsx`, remplacer les imports de `WeekNavigator`, `DayStrip`, `useFilms`, `useWeekNavigation` par :

```tsx
import { DateStrip } from '../components/DateStrip';
import { useFilmsRange } from '../hooks/useFilmsRange';
import { useSelectedDate } from '../hooks/useSelectedDate';
```

Retirer les imports devenus inutiles : `weekDatesFrom` (`utils/dates`) et la fonction locale `formatWeekLabel` avec elle.

- [ ] **Step 2: Remplacer le corps du composant**

Dans `HomePage`, remplacer le bloc allant de `const { weekOffset, goToNextWeek, ... }` jusqu'à la définition de `weekLabel` par :

```tsx
  const { selectedDate, setSelectedDate } = useSelectedDate();
  const {
    films: rangeFilms,
    dates: weekDates,
    isLoading,
    isLoadingMore,
    isError,
    refetch,
    loadMore,
  } = useFilmsRange(selectedDate);
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();
  const { data: cinemas = [] } = useCinemas();
  const resetAll = useFiltersStore((s) => s.resetAll);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const viewMode = useFiltersStore((s) => s.viewMode);
  const setViewMode = useFiltersStore((s) => s.setViewMode);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const today = localISODate();

  const { filteredFilms, activeFilterCount, hasActiveFilters } = useFilteredFilms(rangeFilms);

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  const hasFilms = rangeFilms.length > 0;
  const noResults = hasFilms && filteredFilms.length === 0;
```

Le `useEffect` qui remettait `selectedDate` à `null` et coupait `ceSoirMode` au changement de semaine est **supprimé** : il n'y a plus de semaines.

- [ ] **Step 3: Remplacer le JSX de navigation**

Retirer entièrement le bloc `<WeekNavigator ... />`. Remplacer le `<DayStrip ... />` par :

```tsx
            <DateStrip
              dates={weekDates}
              value={ceSoirMode ? today : selectedDate}
              onChange={(d) => {
                setCeSoirMode(false);
                setSelectedDate(d);
              }}
              onLoadMore={loadMore}
              isLoadingMore={isLoadingMore}
            />
```

Dans le bouton « Ce soir », remplacer l'appel `goToToday()` par `setSelectedDate(null)` :

```tsx
              onClick={() => {
                if (ceSoirMode) {
                  setCeSoirMode(false);
                } else {
                  setSelectedDate(null);
                  setCeSoirMode(true);
                }
              }}
```

- [ ] **Step 4: Corriger les états vides et le rendu**

Remplacer les trois références restantes à `data` :

```tsx
      {!isLoading && !isError && !hasFilms && (
        <EmptyState
          message="Aucun film trouve sur les prochains jours"
          actionLabel="Charger une semaine de plus"
          onAction={loadMore}
        />
      )}
```

Le bloc `EmptyState` « Aucune séance ce jour-là » garde son `onAction={() => setSelectedDate(null)}` mais son libellé devient `"Voir tous les jours"`.

Le conteneur de résultats perd son opacité conditionnelle (`isPlaceholderData` n'existe plus) :

```tsx
      {!isLoading && !isError && filteredFilms.length > 0 && (
        <div>
          {viewMode === 'planning' ? (
            <PlanningView films={filteredFilms} dates={weekDates} cityOf={cityOf} onFilmClick={openDrawer} />
          ) : (
            <FilmGrid films={filteredFilms} onFilmClick={openDrawer} />
          )}
        </div>
      )}
```

Enfin, `<FilmDrawer ... films={rangeFilms} ... />` au lieu de `films={data?.films}`.

- [ ] **Step 5: Supprimer les fichiers obsolètes**

```bash
cd reeltime-v2/apps/web
rm src/components/WeekNavigator.tsx src/components/DayStrip.tsx src/hooks/useWeekNavigation.ts
```

Retirer de `src/components/index.ts` :

```ts
export { WeekNavigator } from './WeekNavigator';
export { DayStrip } from './DayStrip';
```

Retirer de `src/hooks/index.ts` :

```ts
export { useWeekNavigation } from './useWeekNavigation';
```

- [ ] **Step 6: Vérifier qu'aucune référence ne subsiste**

```bash
cd reeltime-v2/apps/web && grep -rn "WeekNavigator\|DayStrip\|useWeekNavigation\|weekOffset=" src/
```

Attendu : aucun résultat hors `useFilms.ts`, `useFilmsRange.ts`, `filmsApi.ts` et `queryKeys.ts`, qui gardent légitimement la notion de `weekOffset` côté API. `SoireePage.tsx` utilise `DayStrip` — si `grep` le signale, y substituer `DateStrip` avec `hideAllChip` et les dates issues de `useFilmsRange`.

- [ ] **Step 7: Compiler et builder**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vitest run && npx vite build
```

Attendu : aucune erreur, 22 tests au vert.

- [ ] **Step 8: Vérification manuelle**

```bash
cd reeltime-v2 && pnpm turbo run dev --filter=@reeltime/api --filter=@reeltime/web
```

Dans le navigateur, en émulation mobile 375 × 667 :
- La bande de dates commence à aujourd'hui, **aucune puce grisée**.
- La puce `Tous` annonce entre 8 et 14 jours.
- Taper une puce filtre la liste ; l'URL affiche `?date=`.
- Le retour arrière du navigateur revient au jour précédent.
- `+7 jours` allonge la bande sans vider la liste affichée.
- Recharger sur une URL `?date=` d'une date lointaine : la fenêtre s'étend seule et la date est sélectionnée.
- Décaler l'horloge système sur un dimanche et recharger : la fenêtre fait au moins 8 jours, toujours sans puce grisée.

- [ ] **Step 9: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "feat(web): fenetre de dates glissante, suppression de WeekNavigator"
```

---

# Phase 2 — Gestes et feuilles

### Task 6: Décision de fermeture par geste et verrou de scroll

**Files:**
- Create: `apps/web/src/utils/gestures.ts`
- Create: `apps/web/src/hooks/useScrollLock.ts`
- Create: `apps/web/src/__tests__/gestures.test.ts`
- Modify: `apps/web/src/hooks/index.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `interface DragSample { y: number; t: number }`
  - `dragVelocity(samples: DragSample[]): number` — px/ms, positif vers le bas
  - `shouldDismiss(deltaY: number, samples: DragSample[]): boolean`
  - `useScrollLock(active: boolean): void`

C'est l'absence du critère de vélocité qui donne aujourd'hui la sensation que le drawer « résiste » : un coup sec sur 60 px ne ferme pas.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/web/src/__tests__/gestures.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { dragVelocity, shouldDismiss, type DragSample } from '../utils/gestures';

/** Échantillons régulièrement espacés de `step` px toutes les 16 ms. */
function samples(step: number, count = 4): DragSample[] {
  return Array.from({ length: count }, (_, i) => ({ y: i * step, t: i * 16 }));
}

describe('dragVelocity', () => {
  it('renvoie 0 sans assez d échantillons', () => {
    expect(dragVelocity([])).toBe(0);
    expect(dragVelocity([{ y: 0, t: 0 }])).toBe(0);
  });

  it('renvoie 0 quand le temps ne progresse pas', () => {
    expect(dragVelocity([{ y: 0, t: 5 }, { y: 40, t: 5 }])).toBe(0);
  });

  it('mesure une vélocité descendante positive', () => {
    // 16 px toutes les 16 ms sur les 3 derniers points = 1 px/ms.
    expect(dragVelocity(samples(16))).toBeCloseTo(1, 5);
  });

  it('mesure une vélocité montante négative', () => {
    expect(dragVelocity(samples(-16))).toBeCloseTo(-1, 5);
  });

  it('ne regarde que les trois derniers échantillons', () => {
    const mixed: DragSample[] = [
      { y: 0, t: 0 },
      { y: 500, t: 16 }, // pic ancien, doit être ignoré
      { y: 510, t: 32 },
      { y: 520, t: 48 },
    ];
    expect(dragVelocity(mixed)).toBeCloseTo((520 - 500) / 32, 5);
  });
});

describe('shouldDismiss', () => {
  it('ferme au-delà du seuil de distance, même lentement', () => {
    expect(shouldDismiss(150, samples(1))).toBe(true);
  });

  it('ferme sur un lancer rapide malgré une courte distance', () => {
    expect(shouldDismiss(60, samples(16))).toBe(true);
  });

  it('ne ferme pas sur un geste court et lent', () => {
    expect(shouldDismiss(60, samples(1))).toBe(false);
  });

  it('ne ferme jamais sur un geste vers le haut', () => {
    expect(shouldDismiss(-150, samples(-16))).toBe(false);
    expect(shouldDismiss(0, samples(16))).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
cd reeltime-v2/apps/web && npx vitest run gestures
```

Attendu : ÉCHEC, module `../utils/gestures` introuvable.

- [ ] **Step 3: Implémenter les fonctions de geste**

Créer `apps/web/src/utils/gestures.ts` :

```ts
export interface DragSample {
  /** Position verticale du doigt, en px. */
  y: number;
  /** Horodatage de l'événement, en ms. */
  t: number;
}

/** Distance au-delà de laquelle un glissement ferme, quelle que soit la vitesse. */
export const DISMISS_DISTANCE_PX = 100;
/** Vitesse au-delà de laquelle un glissement ferme, quelle que soit la distance. */
export const DISMISS_VELOCITY_PX_PER_MS = 0.5;

/**
 * Vélocité verticale en px/ms sur les trois derniers échantillons, positive
 * vers le bas. 0 si elle est indéterminable.
 */
export function dragVelocity(samples: DragSample[]): number {
  if (samples.length < 2) return 0;
  const last = samples[samples.length - 1];
  const first = samples[Math.max(0, samples.length - 3)];
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return (last.y - first.y) / dt;
}

/**
 * Un glissement vers le bas ferme s'il dépasse le seuil de distance OU s'il est
 * lancé assez vite. Sans le second critère, un coup sec et court ne ferme pas,
 * ce qui donne l'impression que la feuille résiste.
 */
export function shouldDismiss(deltaY: number, samples: DragSample[]): boolean {
  if (deltaY <= 0) return false;
  return deltaY > DISMISS_DISTANCE_PX || dragVelocity(samples) > DISMISS_VELOCITY_PX_PER_MS;
}
```

- [ ] **Step 4: Implémenter le verrou de scroll**

Créer `apps/web/src/hooks/useScrollLock.ts` :

```ts
import { useEffect } from 'react';

// Compteur au niveau module : une feuille de sélection ouverte par-dessus la
// feuille de filtres ne doit pas libérer le verrou en se refermant.
let lockCount = 0;
let savedY = 0;

function lock(): void {
  if (lockCount++ > 0) return;
  savedY = window.scrollY;
  const { style } = document.body;
  style.position = 'fixed';
  style.top = `-${savedY}px`;
  style.left = '0';
  style.right = '0';
  style.width = '100%';
}

function unlock(): void {
  if (--lockCount > 0) return;
  lockCount = 0;
  const { style } = document.body;
  style.position = '';
  style.top = '';
  style.left = '';
  style.right = '';
  style.width = '';
  window.scrollTo(0, savedY);
}

/**
 * Bloque le scroll de la page en préservant sa position. `overflow: hidden`
 * seul fait remonter la page en haut sur iOS à la libération.
 */
export function useScrollLock(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    lock();
    return unlock;
  }, [active]);
}
```

- [ ] **Step 5: Exporter le hook**

Dans `apps/web/src/hooks/index.ts` :

```ts
export { useScrollLock } from './useScrollLock';
```

- [ ] **Step 6: Lancer les tests pour vérifier qu'ils passent**

```bash
cd reeltime-v2/apps/web && npx vitest run && npx tsc --noEmit
```

Attendu : SUCCÈS, 30 tests au total.

- [ ] **Step 7: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/gestures.ts reeltime-v2/apps/web/src/hooks/useScrollLock.ts reeltime-v2/apps/web/src/__tests__/gestures.test.ts reeltime-v2/apps/web/src/hooks/index.ts
git commit -m "feat(web): decision de fermeture par velocite et verrou de scroll"
```

---

### Task 7: Primitive `<BottomSheet>`

**Files:**
- Create: `apps/web/src/components/ui/BottomSheet.tsx`
- Modify: `apps/web/src/components/index.ts`

**Interfaces:**
- Consumes: `useScrollLock` et `shouldDismiss`, `DragSample` (Task 6).
- Produces:

```ts
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** aria-label du dialogue. */
  label: string;
  /** Hauteur maximale CSS, défaut '85vh'. */
  maxHeight?: string;
  children: React.ReactNode;
}
export function BottomSheet(props: BottomSheetProps): JSX.Element | null
```

- [ ] **Step 1: Écrire le composant**

Créer `apps/web/src/components/ui/BottomSheet.tsx` :

```tsx
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../hooks/useScrollLock';
import { shouldDismiss, type DragSample } from '../../utils/gestures';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  maxHeight?: string;
  children: ReactNode;
}

/** Distance de glissement au bout de laquelle le fond est totalement transparent. */
const BACKDROP_FADE_PX = 400;
/** Tolérance avant de décider qu'un mouvement est un glissement et non un scroll. */
const DRAG_START_PX = 4;

export function BottomSheet({
  open,
  onClose,
  label,
  maxHeight = '85vh',
  children,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  // Montage puis animation d'entrée sur deux frames, pour que la transition
  // parte bien de translate-y-full.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimating(true)),
      );
      return () => cancelAnimationFrame(id);
    }
    setAnimating(false);
    const timer = setTimeout(() => setMounted(false), 300);
    return () => clearTimeout(timer);
  }, [open]);

  // Remise à zéro des styles inline laissés par un précédent glissement.
  useEffect(() => {
    if (!open) return;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (backdropRef.current) backdropRef.current.style.opacity = '';
  }, [open]);

  useEffect(() => {
    if (mounted) sheetRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Glissement. Les écouteurs sont posés à la main : le onTouchMove de React
  // ne permet pas de bloquer le scroll de la page de façon fiable.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !mounted) return;

    let startY = 0;
    let delta = 0;
    let dragging = false;
    let samples: DragSample[] = [];

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      delta = 0;
      dragging = false;
      samples = [{ y: startY, t: e.timeStamp }];
    };

    const onMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const dy = y - startY;

      if (!dragging) {
        // On ne prend la main que si le contenu est déjà en haut : sinon le
        // geste appartient au scroll interne.
        const atTop = (contentRef.current?.scrollTop ?? 0) <= 0;
        if (dy > DRAG_START_PX && atTop) {
          dragging = true;
          sheet.style.willChange = 'transform';
          sheet.style.transition = 'none';
        } else {
          return;
        }
      }
      if (dy < 0) return;

      e.preventDefault();
      delta = dy;
      samples.push({ y, t: e.timeStamp });
      if (samples.length > 5) samples.shift();

      sheet.style.transform = `translateY(${dy}px)`;
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / BACKDROP_FADE_PX));
      }
    };

    const onEnd = () => {
      if (!dragging) return;
      sheet.style.willChange = '';
      sheet.style.transition = '';
      if (shouldDismiss(delta, samples)) {
        onClose();
      } else {
        sheet.style.transform = '';
        if (backdropRef.current) backdropRef.current.style.opacity = '';
      }
      dragging = false;
      delta = 0;
    };

    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    return () => {
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label}>
      <div
        ref={backdropRef}
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-noir-velours/70 z-40 transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`fixed inset-x-0 bottom-0 max-w-4xl mx-auto z-50 outline-none transition-transform duration-300 ease-out ${
          animating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="bg-creme-ecran rounded-t-3xl overflow-hidden shadow-2xl border-t-4 border-rouge-cinema"
          style={{ maxHeight }}
        >
          <div className="sticky top-0 bg-creme-ecran pt-3 pb-2 z-10 flex items-center justify-between px-4 border-b border-sepia-chaud/20">
            <div className="w-11" />
            <div className="w-16 h-1.5 bg-or-antique rounded-full shadow-inner" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-11 h-11 flex items-center justify-center text-sepia-chaud hover:text-rouge-cinema transition rounded-full hover:bg-beige-papier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            ref={contentRef}
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: `calc(${maxHeight} - 56px)` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
```

- [ ] **Step 2: Exporter le composant**

Dans `apps/web/src/components/index.ts` :

```ts
export { BottomSheet } from './ui/BottomSheet';
```

- [ ] **Step 3: Vérifier la compilation**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

Attendu : aucune erreur. Le composant n'est pas encore consommé.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/components/ui/BottomSheet.tsx reeltime-v2/apps/web/src/components/index.ts
git commit -m "feat(web): primitive BottomSheet avec glissement a la velocite"
```

---

### Task 8: Porter `FilmDrawer` sur `BottomSheet`

**Files:**
- Modify: `apps/web/src/components/FilmDrawer.tsx`
- Modify: `apps/web/src/styles/globals.css` (retrait de trois règles)

**Interfaces:**
- Consumes: `BottomSheet` (Task 7).
- Produces: `FilmDrawer` garde sa signature actuelle (`film`, `isOpen`, `onClose`, `films`, `cityOf`, `onFilmSelect`).

`FilmDrawer` perd toute sa gestion tactile, son portail, son verrou de scroll et son écouteur `Escape` : la primitive s'en charge. Il ne garde que le contenu du film et l'état `chainAnchor`.

- [ ] **Step 1: Réécrire FilmDrawer**

Remplacer l'intégralité de `apps/web/src/components/FilmDrawer.tsx` par :

```tsx
import { useEffect, useRef, useState } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { FilmShowtimes } from './FilmShowtimes';
import { SequencePanel } from './SequencePanel';
import { BottomSheet } from './ui/BottomSheet';

const NO_POSTER = '/images/no-poster.svg';

interface FilmDrawerProps {
  film: FilmListItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Catalogue complet, active l'enchaînement de séances. */
  films?: FilmListItem[];
  cityOf?: (cinemaId: string) => string | undefined;
  /** Appelé quand l'utilisateur choisit un autre film dans les suggestions. */
  onFilmSelect?: (film: FilmListItem) => void;
}

function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

export function FilmDrawer({ film, isOpen, onClose, films, cityOf, onFilmSelect }: FilmDrawerProps) {
  const [chainAnchor, setChainAnchor] = useState<ShowtimeEntry | null>(null);
  const filmId = film?.id;
  const bodyRef = useRef<HTMLDivElement>(null);

  // Changer de film réinitialise la vue enchaînement et remonte le contenu.
  useEffect(() => {
    setChainAnchor(null);
    bodyRef.current?.scrollIntoView({ block: 'start' });
  }, [filmId]);

  if (!film) return null;

  const chainEnabled = films != null && cityOf != null;
  const runtimeStr = formatRuntime(film.runtime);

  return (
    <BottomSheet open={isOpen} onClose={onClose} label={`Details du film ${film.title}`}>
      <div ref={bodyRef} className="px-4 sm:px-6 pb-8">
        <div className="flex gap-4 mb-6 mt-4">
          <img
            src={film.posterUrl ?? NO_POSTER}
            alt={film.title}
            className="w-24 h-36 object-cover rounded-lg shadow-lg flex-shrink-0 border-2 border-sepia-chaud"
            onError={(e) => { e.currentTarget.src = NO_POSTER; }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-playfair text-2xl font-bold text-noir-velours leading-tight">
              {film.title}
            </h3>
            <p className="font-crimson text-sepia-chaud text-sm mt-1 italic">
              {film.year ? `${film.year}` : ''}
              {film.year && runtimeStr ? ' · ' : ''}
              {runtimeStr}
            </p>
            {film.filmAge != null && film.filmAge > 0 && (
              <span className="font-bebas inline-block mt-2 bg-or-antique/20 text-sepia-chaud px-2 py-1 rounded text-xs uppercase tracking-wide border border-or-antique/40">
                Il y a {film.filmAge} ans
              </span>
            )}
            {film.letterboxdRating != null && (
              <p className="font-crimson text-or-antique text-sm mt-2">
                ★ {film.letterboxdRating.toFixed(1)} Letterboxd
              </p>
            )}
            {film.letterboxdUrl && (
              <a
                href={film.letterboxdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-crimson inline-flex items-center gap-1 mt-2 text-rouge-cinema text-sm hover:text-bordeaux-profond underline"
              >
                Voir sur Letterboxd
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="mb-6">
          <svg viewBox="0 0 200 20" className="w-full h-5" aria-hidden="true">
            <line x1="0" y1="10" x2="80" y2="10" stroke="#F9A825" strokeWidth="2" />
            <circle cx="100" cy="10" r="6" fill="#D32F2F" stroke="#F9A825" strokeWidth="2" />
            <line x1="120" y1="10" x2="200" y2="10" stroke="#F9A825" strokeWidth="2" />
          </svg>
        </div>

        {chainAnchor && chainEnabled ? (
          <SequencePanel
            anchorFilm={film}
            anchor={chainAnchor}
            films={films}
            cityOf={cityOf}
            onBack={() => setChainAnchor(null)}
            onFilmClick={(f) => {
              setChainAnchor(null);
              onFilmSelect?.(f);
            }}
          />
        ) : (
          <>
            <FilmShowtimes
              showtimes={film.showtimes}
              film={film}
              onChain={chainEnabled ? setChainAnchor : undefined}
              cityOf={cityOf}
            />

            <div className="border-t-2 border-sepia-chaud/30 pt-6 space-y-3 text-sm">
              {film.director && (
                <p className="font-crimson text-noir-velours">
                  <span className="font-bold text-rouge-cinema">Réalisateur:</span> {film.director}
                </p>
              )}
              {film.genres.length > 0 && (
                <p className="font-crimson text-noir-velours">
                  <span className="font-bold text-rouge-cinema">Genre:</span> {film.genres.join(', ')}
                </p>
              )}
              {film.cast.length > 0 && (
                <p className="font-crimson text-noir-velours">
                  <span className="font-bold text-rouge-cinema">Casting:</span> {film.cast.join(', ')}
                </p>
              )}
              {film.synopsis && (
                <p className="font-crimson text-sepia-chaud text-xs mt-4 leading-relaxed italic">
                  {film.synopsis}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
```

- [ ] **Step 2: Retirer les règles CSS devenues mortes**

Dans `apps/web/src/styles/globals.css`, supprimer le bloc final :

```css
/* === DRAWER ANIMATION === */
#filmDrawer {
  will-change: transform;
}

.drawer-open {
  transform: translateY(0) !important;
}

body.drawer-active {
  overflow: hidden;
}
```

`will-change` est désormais posé et retiré par `BottomSheet` pendant le seul geste ; `body.drawer-active` est remplacé par `useScrollLock`.

- [ ] **Step 3: Vérifier qu'aucune référence ne subsiste**

```bash
cd reeltime-v2/apps/web && grep -rn "drawer-active\|drawer-open\|filmDrawer" src/
```

Attendu : aucun résultat.

- [ ] **Step 4: Compiler et builder**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

- [ ] **Step 5: Vérification manuelle sur téléphone réel**

Le comportement tactile ne se vérifie pas en émulation. Servir le build sur le réseau local :

```bash
cd reeltime-v2/apps/web && npx vite preview --host
```

Sur le téléphone :
- Ouvrir un film, glisser vers le bas **depuis le milieu de la feuille** : elle suit le doigt.
- Coup sec vers le bas sur ~60 px : ferme.
- Glissement lent de 50 px puis relâcher : revient en place.
- Faire défiler la liste des séances, puis glisser vers le bas : ça scrolle, ça ne ferme pas. Une fois en haut, le geste suivant ferme.
- Arriver en bas du contenu et continuer : la page derrière ne bouge pas.
- Fermer : la page est restée à la position où on l'avait laissée.

- [ ] **Step 6: Commit**

```bash
git add reeltime-v2/apps/web/src/components/FilmDrawer.tsx reeltime-v2/apps/web/src/styles/globals.css
git commit -m "refactor(web): FilmDrawer sur la primitive BottomSheet"
```

---

### Task 9: Options de filtres et feuilles de sélection

**Files:**
- Create: `apps/web/src/components/filters/filterOptions.ts`
- Create: `apps/web/src/components/ui/SelectSheet.tsx`
- Create: `apps/web/src/components/filters/FilterSelect.tsx`
- Modify: `apps/web/src/components/filters/index.ts`

**Interfaces:**
- Consumes: `BottomSheet` (Task 7).
- Produces:

```ts
interface FilterOption { value: string; label: string }
export const SORT_OPTIONS: FilterOption[]
export const VERSION_OPTIONS: FilterOption[]
export const TIME_SLOT_OPTIONS: FilterOption[]
export const MIN_AGE_OPTIONS: FilterOption[]
export const DEPARTMENTS: { label: string; cities: string[] }[]

export function SelectSheet(props: {
  value: string; options: FilterOption[]; onChange: (v: string) => void;
  label: string; className?: string;
}): JSX.Element

export function FilterSelect(props: {
  value: string; options: FilterOption[]; onChange: (v: string) => void; label: string;
}): JSX.Element
```

`FilterSelect` rend `SelectSheet` en `md:hidden` et un `<select>` natif en `hidden md:block`, **à partir des mêmes constantes** — une seule source de données pour les deux plateformes.

- [ ] **Step 1: Extraire les options**

Créer `apps/web/src/components/filters/filterOptions.ts` :

```ts
export interface FilterOption {
  value: string;
  label: string;
}

export const SORT_OPTIONS: FilterOption[] = [
  { value: 'popularity', label: 'Popularité' },
  { value: 'letterboxd', label: 'Letterboxd ★' },
  { value: 'alphabetical', label: 'A→Z' },
  { value: 'year-desc', label: '+ Récent' },
  { value: 'year-asc', label: '+ Ancien' },
  { value: 'showtimes', label: 'Nb séances' },
];

export const VERSION_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Toutes versions' },
  { value: 'VF', label: 'VF' },
  { value: 'VO', label: 'VO/VOST' },
];

export const TIME_SLOT_OPTIONS: FilterOption[] = [
  { value: 'all', label: 'Tous horaires' },
  { value: 'morning', label: 'Matin' },
  { value: 'afternoon', label: 'Après-midi' },
  { value: 'evening', label: 'Soirée' },
  { value: 'night', label: 'Nuit' },
];

export const MIN_AGE_OPTIONS: FilterOption[] = [
  { value: '0', label: 'Tous films' },
  { value: '1', label: '+1 an' },
  { value: '5', label: '+5 ans' },
  { value: '10', label: '+10 ans' },
  { value: '20', label: '+20 ans' },
  { value: '30', label: '+30 ans' },
  { value: '50', label: '+50 ans' },
];

export const DEPARTMENTS = [
  { label: 'Finistère (29)', cities: ['Brest', 'Landerneau', 'Morlaix', 'Quimper'] },
];

/** Libellés courts des créneaux, pour les étiquettes de filtres actifs. */
export const TIME_LABELS: Record<string, string> = {
  morning: 'Matin',
  afternoon: 'Après-midi',
  evening: 'Soirée',
  night: 'Nuit',
};
```

- [ ] **Step 2: Écrire SelectSheet**

Créer `apps/web/src/components/ui/SelectSheet.tsx` :

```tsx
import { useState } from 'react';
import { BottomSheet } from './BottomSheet';
import type { FilterOption } from '../filters/filterOptions';

interface SelectSheetProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** Intitulé du réglage, affiché en titre de la feuille. */
  label: string;
  className?: string;
}

export function SelectSheet({ value, options, onChange, label, className = '' }: SelectSheetProps) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="listbox"
        aria-label={`${label} : ${current.label}`}
        className={`font-crimson flex items-center justify-between gap-2 min-h-[44px] w-full px-3 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm ${className}`}
      >
        <span className="truncate">{current.label}</span>
        <svg className="w-4 h-4 shrink-0 text-sepia-chaud" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <BottomSheet open={open} onClose={() => setOpen(false)} label={label} maxHeight="70vh">
        <div className="px-4 pb-8">
          <h3 className="font-bebas text-rouge-cinema text-lg uppercase tracking-wider py-3">
            {label}
          </h3>
          <ul role="listbox" aria-label={label} className="divide-y divide-sepia-chaud/20">
            {options.map((option) => {
              const selected = option.value === value;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`font-crimson flex items-center justify-between w-full min-h-[48px] px-2 text-left text-base ${
                      selected ? 'text-rouge-cinema font-semibold' : 'text-noir-velours'
                    }`}
                  >
                    <span>{option.label}</span>
                    {selected && (
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </BottomSheet>
    </>
  );
}
```

- [ ] **Step 3: Écrire FilterSelect**

Créer `apps/web/src/components/filters/FilterSelect.tsx` :

```tsx
import { SelectSheet } from '../ui/SelectSheet';
import type { FilterOption } from './filterOptions';

interface FilterSelectProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  label: string;
}

const SELECT_CLASS =
  'font-crimson w-full px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20';

/**
 * Un réglage de filtre, rendu en feuille basse sur mobile et en select natif
 * sur desktop, à partir de la même liste d'options.
 */
export function FilterSelect({ value, options, onChange, label }: FilterSelectProps) {
  return (
    <>
      <SelectSheet
        value={value}
        options={options}
        onChange={onChange}
        label={label}
        className="md:hidden"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className={`hidden md:block ${SELECT_CLASS}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </>
  );
}
```

- [ ] **Step 4: Exporter**

Dans `apps/web/src/components/filters/index.ts`, ajouter :

```ts
export { FilterSelect } from './FilterSelect';
export * from './filterOptions';
```

- [ ] **Step 5: Compiler et builder**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

Attendu : aucune erreur. Rien n'est encore branché.

- [ ] **Step 6: Commit**

```bash
git add reeltime-v2/apps/web/src/components/filters/filterOptions.ts reeltime-v2/apps/web/src/components/ui/SelectSheet.tsx reeltime-v2/apps/web/src/components/filters/FilterSelect.tsx reeltime-v2/apps/web/src/components/filters/index.ts
git commit -m "feat(web): feuilles de selection en remplacement des select natifs"
```

---

### Task 10: Scinder `FilterBar`, feuille de filtres mobile, « Ce soir » en option

**Files:**
- Modify: `apps/web/src/components/filters/FilterBar.tsx`
- Create: `apps/web/src/components/filters/FilterControls.tsx`
- Create: `apps/web/src/components/filters/ActiveFilterTags.tsx`
- Create: `apps/web/src/components/filters/FilterSheet.tsx`
- Modify: `apps/web/src/components/filters/index.ts`
- Modify: `apps/web/src/pages/HomePage.tsx` (retrait du bouton « Ce soir »)
- Modify: `apps/web/src/styles/globals.css` (retrait de la règle `select option`)

**Interfaces:**
- Consumes: `FilterSelect`, `filterOptions` (Task 9), `BottomSheet` (Task 7).
- Produces:
  - `<FilterControls cinemas />` — les six réglages et les puces cinémas, sans conteneur
  - `<ActiveFilterTags />` — les étiquettes supprimables
  - `<FilterSheet open onClose cinemas />` — `FilterControls` dans une `BottomSheet`
  - `<FilterBar cinemas activeFilterCount />` conserve sa signature ; il ne rend plus que le desktop

`FilterBar` porte aujourd'hui trois choses dans un seul composant. La recherche part dans la barre collée (tâche 12), les étiquettes restent sous la barre, les réglages passent en feuille sur mobile.

- [ ] **Step 1: Extraire les réglages dans FilterControls**

Créer `apps/web/src/components/filters/FilterControls.tsx`. Reprendre depuis `FilterBar.tsx` : les six sélecteurs, les gestionnaires `handleDepartmentChange`, `handleCityChange`, `handleVersionChange`, le calcul de `availableCities` / `visibleCinemas` et les puces cinémas. Chaque `<select>` devient un `<FilterSelect>`. Ajouter en tête la bascule « Ce soir ».

```tsx
import { useFiltersStore } from '../../stores/filtersStore';
import type { SortOption, TimeSlotFilter, MinAgeFilter } from '../../stores/filtersStore';
import { getCinemaShortName } from '../../utils/cinemaNames';
import { FilterSelect } from './FilterSelect';
import {
  DEPARTMENTS,
  MIN_AGE_OPTIONS,
  SORT_OPTIONS,
  TIME_SLOT_OPTIONS,
  VERSION_OPTIONS,
} from './filterOptions';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

export function FilterControls({ cinemas }: { cinemas: Cinema[] }) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const toggleCinema = useFiltersStore((s) => s.toggleCinema);
  const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
  const selectedDepartment = useFiltersStore((s) => s.selectedDepartment);
  const setDepartment = useFiltersStore((s) => s.setDepartment);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const setCity = useFiltersStore((s) => s.setCity);
  const version = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const sort = useFiltersStore((s) => s.sort);
  const setSort = useFiltersStore((s) => s.setSort);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);

  const availableCities = selectedDepartment
    ? DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? []
    : DEPARTMENTS.flatMap((d) => d.cities);

  const visibleCinemas = cinemas.filter((cinema) => {
    if (selectedCity) return cinema.city === selectedCity;
    if (selectedDepartment) return availableCities.includes(cinema.city);
    return true;
  });

  const cityOptions = [
    { value: 'all', label: 'Toutes villes' },
    ...availableCities.map((c) => ({ value: c, label: c })),
  ];
  const departmentOptions = [
    { value: 'all', label: 'Tous départements' },
    ...DEPARTMENTS.map((d) => ({ value: d.label, label: d.label })),
  ];

  const handleDepartmentChange = (value: string) => {
    const dept = value === 'all' ? null : value;
    setDepartment(dept);
    setCity(null);
    if (!dept) {
      setSelectedCinemas([]);
      return;
    }
    const deptCities = DEPARTMENTS.find((d) => d.label === dept)?.cities ?? [];
    setSelectedCinemas(cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id));
  };

  const handleCityChange = (value: string) => {
    const city = value === 'all' ? null : value;
    setCity(city);
    if (!city) {
      if (selectedDepartment) {
        const deptCities = DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? [];
        setSelectedCinemas(cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id));
      } else {
        setSelectedCinemas([]);
      }
      return;
    }
    setSelectedCinemas(cinemas.filter((c) => c.city === city).map((c) => c.id));
  };

  return (
    <div className="space-y-3">
      {/* « Ce soir » : ex-bouton du bandeau haut, devenu un réglage parmi les autres. */}
      <button
        type="button"
        onClick={() => {
          if (ceSoirMode) {
            setCeSoirMode(false);
          } else {
            setSelectedDate(null);
            setCeSoirMode(true);
          }
        }}
        aria-pressed={ceSoirMode}
        className={`font-bebas flex items-center justify-between w-full min-h-[48px] px-3 rounded-lg border-2 text-sm uppercase tracking-wide transition-colors ${
          ceSoirMode
            ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
            : 'bg-creme-ecran border-sepia-chaud text-noir-velours'
        }`}
      >
        <span>🌙 Ce soir (après 18h)</span>
        <span className="text-xs">{ceSoirMode ? 'Activé' : 'Désactivé'}</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3">
        <FilterSelect label="Tri" value={sort} options={SORT_OPTIONS} onChange={(v) => setSort(v as SortOption)} />
        <FilterSelect label="Version" value={version ?? 'all'} options={VERSION_OPTIONS} onChange={(v) => setVersion(v === 'all' ? null : (v as 'VF' | 'VO' | 'VOST'))} />
        <FilterSelect label="Horaires" value={timeSlot} options={TIME_SLOT_OPTIONS} onChange={(v) => setTimeSlot(v as TimeSlotFilter)} />
        <FilterSelect label="Âge du film" value={String(minAge)} options={MIN_AGE_OPTIONS} onChange={(v) => setMinAge(Number(v) as MinAgeFilter)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
        <FilterSelect label="Département" value={selectedDepartment ?? 'all'} options={departmentOptions} onChange={handleDepartmentChange} />
        <FilterSelect label="Ville" value={selectedCity ?? 'all'} options={cityOptions} onChange={handleCityChange} />
      </div>

      <div className="flex flex-wrap gap-2">
        {visibleCinemas.map((cinema) => {
          const isSelected = selectedCinemas.length === 0 || selectedCinemas.includes(cinema.id);
          return (
            <label
              key={cinema.id}
              className={`ticket-chip flex items-center gap-2 min-h-[44px] px-3 border-2 rounded-full font-bebas text-[11px] text-noir-velours uppercase tracking-wide cursor-pointer ${
                isSelected ? 'bg-creme-ecran border-sepia-chaud' : 'bg-beige-papier border-sepia-chaud/50 opacity-60'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleCinema(cinema.id)}
                className="w-4 h-4 rounded accent-rouge-cinema"
              />
              {getCinemaShortName(cinema.name)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Extraire les étiquettes actives**

Créer `apps/web/src/components/filters/ActiveFilterTags.tsx` :

```tsx
import { useFiltersStore } from '../../stores/filtersStore';
import { DEPARTMENTS, TIME_LABELS } from './filterOptions';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

const SORT_LABELS: Record<string, string> = {
  alphabetical: 'A→Z',
  'year-desc': '+ Récent',
  'year-asc': '+ Ancien',
  showtimes: 'Nb séances',
  letterboxd: 'Letterboxd',
};

export function ActiveFilterTags({ cinemas }: { cinemas: Cinema[] }) {
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const setSelectedCinemas = useFiltersStore((s) => s.setSelectedCinemas);
  const selectedDepartment = useFiltersStore((s) => s.selectedDepartment);
  const setDepartment = useFiltersStore((s) => s.setDepartment);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const setCity = useFiltersStore((s) => s.setCity);
  const version = useFiltersStore((s) => s.version);
  const setVersion = useFiltersStore((s) => s.setVersion);
  const sort = useFiltersStore((s) => s.sort);
  const setSort = useFiltersStore((s) => s.setSort);
  const timeSlot = useFiltersStore((s) => s.timeSlot);
  const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const resetAll = useFiltersStore((s) => s.resetAll);

  // Retirer l'étiquette « département » remet la sélection de cinémas à zéro,
  // exactement comme le fait le sélecteur correspondant.
  const clearDepartment = () => {
    setDepartment(null);
    setCity(null);
    setSelectedCinemas([]);
  };

  const clearCity = () => {
    setCity(null);
    if (selectedDepartment) {
      const deptCities = DEPARTMENTS.find((d) => d.label === selectedDepartment)?.cities ?? [];
      setSelectedCinemas(cinemas.filter((c) => deptCities.includes(c.city)).map((c) => c.id));
    } else {
      setSelectedCinemas([]);
    }
  };

  const tags: { label: string; onRemove: () => void }[] = [];

  // « Ce soir » passe en premier et masque l'étiquette de créneau horaire :
  // le mode remplace ce filtre au lieu de s'y ajouter.
  if (ceSoirMode) tags.push({ label: 'Ce soir', onRemove: () => setCeSoirMode(false) });
  if (version !== null) {
    tags.push({ label: version === 'VF' ? 'VF' : 'VO/VOST', onRemove: () => setVersion(null) });
  }
  if (!ceSoirMode && timeSlot !== 'all') {
    tags.push({ label: TIME_LABELS[timeSlot] ?? timeSlot, onRemove: () => setTimeSlot('all') });
  }
  if (minAge !== 0) tags.push({ label: `+${minAge} ans`, onRemove: () => setMinAge(0) });
  if (selectedDepartment !== null) {
    tags.push({ label: selectedDepartment, onRemove: clearDepartment });
  }
  if (selectedCity !== null) tags.push({ label: selectedCity, onRemove: clearCity });
  if (selectedCinemas.length > 0 && selectedDepartment === null) {
    tags.push({
      label: `${selectedCinemas.length} cinéma${selectedCinemas.length > 1 ? 's' : ''}`,
      onRemove: () => setSelectedCinemas([]),
    });
  }
  if (sort !== 'popularity') {
    tags.push({
      label: `Tri: ${SORT_LABELS[sort] ?? sort}`,
      onRemove: () => setSort('popularity'),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <button
          key={tag.label}
          type="button"
          onClick={tag.onRemove}
          aria-label={`Retirer le filtre ${tag.label}`}
          className="flex items-center gap-1 min-h-[32px] bg-rouge-cinema/10 border border-rouge-cinema/30 text-rouge-cinema text-[11px] font-bebas px-2.5 rounded-full hover:bg-rouge-cinema/20 transition uppercase tracking-wide"
        >
          {tag.label}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      <button
        type="button"
        onClick={resetAll}
        className="text-[11px] font-bebas text-sepia-chaud hover:text-rouge-cinema min-h-[32px] px-2 uppercase tracking-wide transition"
      >
        Tout effacer
      </button>
    </div>
  );
}
```

Le composant renvoie `null` quand aucun filtre n'est actif : c'est ce qui permet au conteneur `empty:mt-0` de la tâche 12 de ne pas réserver d'espace.

- [ ] **Step 3: Écrire FilterSheet**

Créer `apps/web/src/components/filters/FilterSheet.tsx` :

```tsx
import { BottomSheet } from '../ui/BottomSheet';
import { FilterControls } from './FilterControls';
import { useFiltersStore } from '../../stores/filtersStore';

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  cinemas: { id: string; name: string; city: string }[];
}

export function FilterSheet({ open, onClose, cinemas }: FilterSheetProps) {
  const resetAll = useFiltersStore((s) => s.resetAll);

  return (
    <BottomSheet open={open} onClose={onClose} label="Filtres">
      <div className="px-4 pb-8">
        <div className="flex items-center justify-between py-3">
          <h3 className="font-bebas text-rouge-cinema text-lg uppercase tracking-wider">Filtres</h3>
          <button
            type="button"
            onClick={resetAll}
            className="font-bebas min-h-[44px] px-3 text-sm text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
          >
            Tout effacer
          </button>
        </div>
        <FilterControls cinemas={cinemas} />
      </div>
    </BottomSheet>
  );
}
```

- [ ] **Step 4: Réduire FilterBar au rendu desktop**

Remplacer l'intégralité de `apps/web/src/components/filters/FilterBar.tsx` par :

```tsx
import { useState } from 'react';
import { useFiltersStore } from '../../stores/filtersStore';
import { FilterControls } from './FilterControls';
import { ActiveFilterTags } from './ActiveFilterTags';

interface Cinema {
  id: string;
  name: string;
  city: string;
}

interface FilterBarProps {
  cinemas: Cinema[];
  activeFilterCount: number;
}

/**
 * Rendu desktop des filtres : recherche, étiquettes actives et panneau
 * accordéon. Sur mobile, ces trois morceaux vivent séparément — recherche et
 * étiquettes dans la barre collée, réglages dans FilterSheet.
 */
export function FilterBar({ cinemas, activeFilterCount }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un film..."
            aria-label="Rechercher un film"
            className="font-crimson w-full px-3 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema shadow-sm"
          />
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sepia-chaud"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-label="Filtres"
          className={`font-bebas px-3 py-2 border-2 rounded-lg text-sm uppercase tracking-wide transition flex items-center gap-1.5 shadow-sm ${
            expanded
              ? 'bg-rouge-cinema/20 border-rouge-cinema text-noir-velours'
              : 'bg-beige-papier border-sepia-chaud text-noir-velours hover:bg-creme-ecran hover:border-rouge-cinema'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {activeFilterCount > 0 && (
            <span className="bg-rouge-cinema text-creme-ecran text-[11px] font-bebas px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <ActiveFilterTags cinemas={cinemas} />

      <div className={`filter-panel ${expanded ? 'filter-panel-open' : ''}`}>
        <div>
          <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-4 shadow-md">
            <FilterControls cinemas={cinemas} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Retirer le bouton « Ce soir » du bandeau**

Dans `apps/web/src/pages/HomePage.tsx`, supprimer le `<button>` « 🌙 Ce soir » et les lectures `ceSoirMode` / `setCeSoirMode` devenues inutiles, **sauf** celle qui alimente `value={ceSoirMode ? today : selectedDate}` de `DateStrip`.

- [ ] **Step 6: Retirer la règle CSS des options**

Dans `apps/web/src/styles/globals.css`, supprimer :

```css
select option {
  background-color: #1f2937;
  color: white;
}
```

- [ ] **Step 7: Mettre à jour le baril**

Dans `apps/web/src/components/filters/index.ts` :

```ts
export { FilterBar } from './FilterBar';
export { FilterControls } from './FilterControls';
export { ActiveFilterTags } from './ActiveFilterTags';
export { FilterSheet } from './FilterSheet';
export { FilterSelect } from './FilterSelect';
export * from './filterOptions';
```

- [ ] **Step 8: Compiler, builder, vérifier**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vitest run && npx vite build
```

Puis en dev, sur desktop : les six réglages produisent le même résultat qu'avant, les étiquettes se suppriment, « Ce soir » fonctionne depuis le panneau et son étiquette masque bien celle du créneau horaire.

- [ ] **Step 9: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "refactor(web): FilterBar scinde, feuille de filtres, Ce soir en reglage"
```

---

# Phase 3 — Chrome mobile

### Task 11: Barre d'onglets basse

**Files:**
- Create: `apps/web/src/components/layout/MobileTabBar.tsx`
- Modify: `apps/web/src/components/layout/Layout.tsx`
- Modify: `apps/web/src/components/layout/Header.tsx`
- Modify: `apps/web/src/components/layout/index.ts`
- Modify: `apps/web/src/components/soiree/SoireeBar.tsx`
- Modify: `apps/web/src/pages/HomePage.tsx` (`ScrollToTopButton`)
- Modify: `apps/web/src/styles/globals.css` (animation du badge)

**Interfaces:**
- Consumes: `useFiltersStore` (`viewMode`, `setViewMode`), `useSoireeStore`.
- Produces: `<MobileTabBar />`, monté par `Layout`, sans prop.

- [ ] **Step 1: Écrire MobileTabBar**

Créer `apps/web/src/components/layout/MobileTabBar.tsx` :

```tsx
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFiltersStore } from '../../stores/filtersStore';
import { useSoireeStore } from '../../stores/soireeStore';

/** Durée de l'impulsion visuelle du badge, alignée sur l'animation CSS. */
const PULSE_MS = 400;

export function MobileTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const viewMode = useFiltersStore((s) => s.viewMode);
  const setViewMode = useFiltersStore((s) => s.setViewMode);
  const count = useSoireeStore((s) =>
    Object.values(s.soirees).reduce((n, items) => n + items.length, 0),
  );

  // Sans la barre « Ma soirée » sur mobile, l'incrément du badge est le seul
  // retour visuel d'un ajout : il doit se remarquer.
  const [pulse, setPulse] = useState(false);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), PULSE_MS);
      prevCount.current = count;
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  const onHome = pathname === '/';
  const tabs = [
    {
      key: 'grid',
      icon: '🎥',
      label: 'Affiche',
      active: onHome && viewMode === 'grid',
      onClick: () => {
        setViewMode('grid');
        if (!onHome) navigate('/');
      },
    },
    {
      key: 'planning',
      icon: '≣',
      label: 'Planning',
      active: onHome && viewMode === 'planning',
      onClick: () => {
        setViewMode('planning');
        if (!onHome) navigate('/');
      },
    },
    {
      key: 'soirees',
      icon: '🎟',
      label: 'Soirées',
      active: pathname === '/mes-soirees',
      badge: count,
      onClick: () => navigate('/mes-soirees'),
    },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-beige-papier border-t-2 border-sepia-chaud shadow-2xl pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={tab.onClick}
          aria-current={tab.active ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] font-bebas text-[11px] uppercase tracking-wide transition-colors ${
            tab.active ? 'text-rouge-cinema' : 'text-sepia-chaud'
          }`}
        >
          <span className="relative text-xl leading-none" aria-hidden="true">
            {tab.icon}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={`absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rouge-cinema text-creme-ecran text-[11px] font-bebas ${
                  pulse ? 'badge-pulse' : ''
                }`}
              >
                {tab.badge}
              </span>
            )}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
```

- [ ] **Step 2: Ajouter l'animation du badge**

Ajouter à la fin de `apps/web/src/styles/globals.css` :

```css
/* === BADGE « MA SOIREE » === */
@keyframes badge-pulse {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.5); }
  100% { transform: scale(1); }
}

.badge-pulse {
  animation: badge-pulse 400ms ease-out;
}

@media (prefers-reduced-motion: reduce) {
  .badge-pulse { animation: none; }
}
```

- [ ] **Step 3: Monter la barre dans Layout**

Dans `apps/web/src/components/layout/Layout.tsx` : importer `MobileTabBar`, le rendre après `<Footer />`, et réserver la place en bas :

```tsx
        <main className={`flex-1 pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0${showBar ? ' md:pb-24' : ''}`}>
          <Outlet />
        </main>
        <Footer />
        {showBar && <SoireeBar />}
        <MobileTabBar />
```

`showBar` ne pilote plus que le rembourrage desktop, puisque `SoireeBar` disparaît sur mobile.

- [ ] **Step 4: Masquer la navigation du header et la barre soirée sur mobile**

Dans `Header.tsx`, sur l'élément `<nav>`, remplacer `className="flex shrink-0 ..."` par `className="hidden md:flex shrink-0 ..."`.

Dans `SoireeBar.tsx`, sur le conteneur racine, remplacer `className="fixed bottom-0 inset-x-0 z-40 sm:inset-x-auto ..."` par :

```tsx
    <div className="hidden md:block fixed z-40 md:inset-x-auto md:right-4 md:bottom-4 md:w-[28rem] md:max-w-[calc(100vw-2rem)]">
```

et sur son enfant direct, remplacer `sm:border-2` / `sm:rounded-xl` par `border-2 rounded-xl`.

- [ ] **Step 5: Fixer le bouton retour-en-haut**

Dans `apps/web/src/pages/HomePage.tsx`, `ScrollToTopButton` perd sa lecture de `useSoireeStore` et son décalage conditionnel :

```tsx
      className={`fixed bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-8 right-4 md:right-8 bg-rouge-cinema hover:bg-bordeaux-profond text-creme-ecran p-3 md:p-4 rounded-full shadow-lg transition-opacity duration-300 z-30 border-2 border-or-antique ${
        showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
```

Le `z-30` le place sous la barre d'onglets (`z-40`).

- [ ] **Step 6: Mettre à jour le baril**

Dans `apps/web/src/components/layout/index.ts` :

```ts
export { MobileTabBar } from './MobileTabBar';
```

- [ ] **Step 7: Compiler, builder, vérifier**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

En émulation 375 × 667 :
- Les trois onglets basculent correctement, l'onglet actif est en `rouge-cinema`.
- Ajouter une séance depuis un film : le badge apparaît et pulse.
- La barre « Ma soirée » flottante n'apparaît plus sur mobile, mais reste sur desktop.
- Rien n'est masqué en bas de page ; le bouton retour-en-haut ne passe pas sous les onglets.

- [ ] **Step 8: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "feat(web): barre d onglets mobile, barre soiree reservee au desktop"
```

---

### Task 12: Barre de dates collée, header libéré, footer compact

**Files:**
- Modify: `apps/web/src/components/layout/Header.tsx`
- Modify: `apps/web/src/components/layout/Footer.tsx`
- Modify: `apps/web/src/pages/HomePage.tsx`
- Modify: `apps/web/src/components/PlanningView.tsx`
- Modify: `apps/web/src/styles/globals.css`

**Interfaces:**
- Consumes: `DateStrip` (Task 4), `FilterSheet` et `ActiveFilterTags` (Task 10).
- Produces: variable CSS `--sticky-top` posée sur le conteneur de `HomePage`, consommée par `PlanningView`.

Le header cesse d'être collé sur mobile ; les commandes qui doivent rester atteignables descendent dans la barre de dates, seul élément épinglé.

- [ ] **Step 1: Rendre le header non collant sur mobile**

Dans `Header.tsx`, remplacer `className="stage-curtain sticky top-0 z-50 ..."` par :

```tsx
    <header className="stage-curtain md:sticky md:top-0 z-50 shadow-xl border-b-2 border-or-antique">
```

- [ ] **Step 2: Construire la barre collée dans HomePage**

Dans `HomePage.tsx`, ajouter l'état local de la recherche dépliée et de la feuille de filtres :

```tsx
  const [searchOpen, setSearchOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);
```

Remplacer le bloc « Day strip + Ce soir + view mode toggle » et le bloc « Filters » par :

```tsx
      {!isLoading && !isError && hasFilms && (
        <div className="sticky top-0 z-30 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 bg-beige-papier/95 backdrop-blur border-b-2 border-sepia-chaud md:static md:bg-transparent md:backdrop-blur-none md:border-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <DateStrip
                dates={weekDates}
                value={ceSoirMode ? today : selectedDate}
                onChange={(d) => {
                  setCeSoirMode(false);
                  setSelectedDate(d);
                }}
                onLoadMore={loadMore}
                isLoadingMore={isLoadingMore}
              />
            </div>

            <div className="md:hidden flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setSearchOpen((v) => !v)}
                aria-expanded={searchOpen}
                aria-label="Rechercher un film"
                className="w-11 h-11 flex items-center justify-center rounded-lg border-2 border-sepia-chaud bg-creme-ecran text-noir-velours"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                aria-label="Filtres"
                className="relative w-11 h-11 flex items-center justify-center rounded-lg border-2 border-sepia-chaud bg-creme-ecran text-noir-velours"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rouge-cinema text-creme-ecran text-[11px] font-bebas">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {searchOpen && (
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un film..."
              aria-label="Rechercher un film"
              className="md:hidden font-crimson w-full mt-2 px-3 min-h-[44px] bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema"
            />
          )}

          <div className="md:hidden mt-2 empty:mt-0">
            <ActiveFilterTags cinemas={cinemas} />
          </div>
        </div>
      )}

      {/* Desktop : barre de filtres complète, inchangée */}
      {!isLoading && !isError && hasFilms && (
        <div className="hidden md:block -mx-4 px-4 pb-3">
          <FilterBar cinemas={cinemas} activeFilterCount={activeFilterCount} />
        </div>
      )}

      <FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} cinemas={cinemas} />
```

La recherche reste dépliée tant que la requête est non vide : ajouter

```tsx
  useEffect(() => {
    if (searchQuery) setSearchOpen(true);
  }, [searchQuery]);
```

- [ ] **Step 3: Poser la variable --sticky-top**

La valeur diffère entre mobile et desktop : elle passe donc par une classe et non
par un style inline, qu'aucune media query ne pourrait surcharger.

Ajouter dans `globals.css` :

```css
/* === ANCRAGE DES EN-TETES COLLES === */
/* Hauteur de l'élément épinglé en haut de page : barre de dates seule sur
   mobile, header + barre de filtres sur desktop. Consommée par PlanningView
   pour aligner ses en-têtes de jour juste dessous. */
.page-sticky-root {
  --sticky-top: 60px;
}

@media (min-width: 768px) {
  .page-sticky-root {
    --sticky-top: 112px;
  }
}
```

Et sur le conteneur racine de `HomePage` :

```tsx
    <div className="page-sticky-root container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
```

- [ ] **Step 4: Consommer la variable dans PlanningView**

Dans `PlanningView.tsx`, remplacer `className="sticky top-[52px] sm:top-[60px] z-30 ..."` de l'en-tête de jour par :

```tsx
            <h2
              style={{ top: 'var(--sticky-top, 60px)' }}
              className="sticky z-20 -mx-2 px-4 sm:mx-0 sm:px-4 py-2 mb-3 bg-rouge-cinema border-2 border-bordeaux-profond sm:rounded-lg shadow-md font-bebas text-creme-ecran text-lg sm:text-xl uppercase tracking-wider flex items-center justify-between"
            >
```

`z-20` passe sous la barre de dates (`z-30`).

- [ ] **Step 5: Passer en dvh**

Dans `globals.css`, remplacer `min-height: 100vh;` de la règle `body` par :

```css
  min-height: 100dvh;
```

Dans `Layout.tsx`, remplacer `className="flex min-h-screen flex-col"` par `className="flex min-h-[100dvh] flex-col"`.

- [ ] **Step 6: Compacter le footer**

Dans `Footer.tsx` : passer `py-8 mt-16` à `py-4 mt-8 md:py-8 md:mt-16`, et ajouter `hidden md:block` au paragraphe descriptif (« Tous les horaires de cinéma… ») ainsi qu'au bloc final « Données mises à jour automatiquement… ».

- [ ] **Step 7: Compiler, builder, vérifier**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

En émulation 375 × 667 :
- Le header défile et sort de l'écran ; la barre de dates reste collée en haut avec 🔍 et ⚙︎.
- Remonter fait revenir le header.
- 🔍 déplie le champ ; il reste déplié tant que la recherche est non vide.
- ⚙︎ ouvre la feuille de filtres, avec le compteur.
- En vue Planning, les en-têtes de jour se collent **juste sous** la barre de dates, sans chevauchement ni trou.
- Mesurer la hauteur avant le premier film : viser ~100 px contre ~270 px avant la refonte.

- [ ] **Step 8: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "feat(web): barre de dates collee, header libere, footer compact"
```

---

# Phase 4 — Séances et fluidité

### Task 13: Séances en lignes

**Files:**
- Create: `apps/web/src/components/ShowtimeRow.tsx`
- Modify: `apps/web/src/components/FilmShowtimes.tsx`
- Modify: `apps/web/src/components/PlanningView.tsx`
- Modify: `apps/web/src/components/index.ts`

**Interfaces:**
- Consumes: `AddToSoireeButton`, `getCinemaShortName`, `useFiltersStore` (`selectedDate`).
- Produces:

```ts
export function ShowtimeRow(props: {
  showtime: ShowtimeEntry;
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  city: string | undefined;
  /** Affiche le bouton d'enchaînement (desktop uniquement). */
  onChain?: (st: ShowtimeEntry) => void;
  /** Nom du cinéma, masqué quand il est déjà porté par un en-tête de groupe. */
  showCinema?: boolean;
}): JSX.Element
```

Deux cibles au lieu de trois, 56 px au lieu de 22.

- [ ] **Step 1: Écrire ShowtimeRow**

Créer `apps/web/src/components/ShowtimeRow.tsx` :

```tsx
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { getCinemaShortName } from '../utils/cinemaNames';
import { AddToSoireeButton } from './soiree/AddToSoireeButton';

interface ShowtimeRowProps {
  showtime: ShowtimeEntry;
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  city: string | undefined;
  onChain?: (st: ShowtimeEntry) => void;
  showCinema?: boolean;
}

export function ShowtimeRow({
  showtime,
  film,
  city,
  onChain,
  showCinema = true,
}: ShowtimeRowProps) {
  const bookable = showtime.bookingUrl != null;

  const inner = (
    <>
      {/* Bloc heure, avec le décrochage « ticket » hérité des anciennes pastilles. */}
      <span className="relative font-bebas shrink-0 w-16 text-center text-lg text-creme-ecran bg-rouge-cinema border-2 border-or-antique rounded-md py-1">
        {showtime.time}
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-creme-ecran rounded-bl-lg"
        />
      </span>
      <span className="flex-1 min-w-0 font-crimson text-sm text-noir-velours truncate">
        {showCinema && getCinemaShortName(showtime.cinemaName)}
        {showCinema && showtime.version ? ' · ' : ''}
        {showtime.version}
      </span>
    </>
  );

  return (
    <div className="flex items-center gap-3 min-h-[56px] border-b border-sepia-chaud/20 last:border-0">
      {bookable ? (
        <a
          href={showtime.bookingUrl!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Réserver ${film.title} à ${showtime.time} au ${getCinemaShortName(showtime.cinemaName)}`}
          className="flex flex-1 min-w-0 items-center gap-3 py-2 pr-2 hover:bg-beige-papier/60 rounded-lg transition-colors"
        >
          {inner}
        </a>
      ) : (
        <div
          aria-disabled="true"
          title="Réservation en ligne non disponible"
          className="flex flex-1 min-w-0 items-center gap-3 py-2 pr-2 opacity-50"
        >
          {inner}
        </div>
      )}

      {onChain && (
        <button
          type="button"
          onClick={() => onChain(showtime)}
          title="Que voir avant ou après cette séance ?"
          aria-label={`Enchaîner avec une autre séance autour de ${showtime.time}`}
          className="hidden md:flex w-11 h-11 shrink-0 items-center justify-center rounded-md border-2 border-sepia-chaud bg-beige-papier text-sepia-chaud hover:text-rouge-cinema hover:border-rouge-cinema transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
          </svg>
        </button>
      )}

      <AddToSoireeButton film={film} showtime={showtime} city={city} className="w-11 h-11 shrink-0" />
    </div>
  );
}
```

- [ ] **Step 2: Réécrire FilmShowtimes autour des lignes**

Dans `FilmShowtimes.tsx`, remplacer les `<details>` par des sections à état contrôlé pour pouvoir pré-ouvrir le jour sélectionné :

```tsx
import { useState } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import { ShowtimeRow } from './ShowtimeRow';
```

Dans le composant, après `const sortedDates = Object.keys(grouped).sort();` :

```tsx
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  // Le drawer s'ouvre sur le jour choisi dans la bande de dates, et non
  // systématiquement sur le premier jour programmé.
  const [openDate, setOpenDate] = useState<string | null>(
    selectedDate && sortedDates.includes(selectedDate) ? selectedDate : sortedDates[0] ?? null,
  );
```

Remplacer chaque `<details>` par :

```tsx
            <section key={date} className="bg-beige-papier rounded-lg border-2 border-sepia-chaud shadow-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenDate((d) => (d === date ? null : date))}
                aria-expanded={openDate === date}
                style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
                className="w-full min-h-[44px] p-3 flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="text-creme-ecran flex flex-col items-center min-w-[50px]">
                    <span className="font-bebas text-xs uppercase tracking-wider opacity-90">{dayName}</span>
                    <span className="font-playfair text-3xl font-bold leading-none">{dayNumber}</span>
                    <span className="font-crimson text-xs italic opacity-80">{monthName}</span>
                  </div>
                  <div className="font-bebas text-creme-ecran text-sm uppercase tracking-wide">
                    {Object.values(cinemas).flat().length} séance{Object.values(cinemas).flat().length > 1 ? 's' : ''}
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-jaune-marquise transform transition-transform ${openDate === date ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openDate === date && (
                <div className="px-3 bg-creme-ecran">
                  {Object.entries(cinemas).map(([cinemaName, times]) => (
                    <div key={cinemaName} className="py-2">
                      <h5 className="font-bebas text-rouge-cinema text-sm uppercase tracking-wider mb-1 flex items-center gap-2">
                        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
                        {getCinemaShortName(cinemaName)}
                      </h5>
                      {times.map((st) => (
                        <ShowtimeRow
                          key={st.id}
                          showtime={st}
                          film={film}
                          city={cityOf?.(st.cinemaId)}
                          onChain={onChain}
                          showCinema={false}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </section>
```

Le paramètre `idx` de `sortedDates.map` n'est plus utilisé : le retirer.

- [ ] **Step 3: Agrandir les séances de PlanningView**

Dans `PlanningView.tsx`, remplacer le bloc `<div className="mt-1.5 flex flex-wrap gap-1 pl-[60px] sm:pl-[68px]">` et son contenu par :

```tsx
                  <div className="mt-1.5 pl-[60px] sm:pl-[68px]">
                    {showtimes.map((st) => (
                      <ShowtimeRow
                        key={st.id}
                        showtime={st}
                        film={film}
                        city={cityOf(st.cinemaId)}
                      />
                    ))}
                  </div>
```

Ajouter l'import `import { ShowtimeRow } from './ShowtimeRow';` et retirer ceux d'`AddToSoireeButton` et `getCinemaShortName` s'ils ne servent plus.

- [ ] **Step 4: Mettre à jour le baril**

Dans `apps/web/src/components/index.ts` :

```ts
export { ShowtimeRow } from './ShowtimeRow';
```

- [ ] **Step 5: Vérifier qu'aucune taille de texte sous 11 px ne subsiste**

```bash
cd reeltime-v2/apps/web && grep -rn "text-\[9px\]\|text-\[10px\]" src/
```

Attendu : aucun résultat. Remplacer toute occurrence restante par `text-[11px]`.

- [ ] **Step 6: Compiler, builder, vérifier**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vite build
```

Sur téléphone réel :
- Choisir samedi dans la bande, ouvrir un film : samedi est déjà déplié.
- Taper une ligne ouvre la billetterie ; taper le ⊕ n'ouvre jamais la billetterie, y compris en visant la frontière entre les deux zones.
- Une séance sans billetterie est grisée et ne réagit pas.
- Le bouton 🔗 n'apparaît pas sur mobile, mais bien sur desktop.

- [ ] **Step 7: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "feat(web): seances en lignes de 56 px, jour selectionne pre-ouvert"
```

---

### Task 14: Fluidité — recherche différée et scroll

**Files:**
- Modify: `apps/web/src/hooks/useFilteredFilms.ts`
- Modify: `apps/web/src/components/soiree/SoireeBar.tsx`
- Modify: `apps/web/src/pages/MesSoireesPage.tsx`
- Modify: `apps/web/src/styles/globals.css`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: rien de nouveau. `useFilteredFilms` garde sa signature.

- [ ] **Step 1: Différer la recherche**

Dans `apps/web/src/hooks/useFilteredFilms.ts`, ajouter `useDeferredValue` à l'import React :

```ts
import { useDeferredValue, useMemo } from 'react';
```

Puis, juste après les lectures du store :

```ts
  // Le filtrage remappe et retrie tout le catalogue. Le différer garde la
  // saisie fluide : React recalcule en tâche de fond sans bloquer la frappe.
  const deferredQuery = useDeferredValue(searchQuery);
```

Dans le `useMemo`, remplacer les deux usages de `searchQuery` par `deferredQuery` (le filtre `if (searchQuery)` et l'appel `matchesSearch(film.title, searchQuery)`), et remplacer `searchQuery` par `deferredQuery` dans le tableau de dépendances.

`activeFilterCount` continue d'utiliser `searchQuery` (non différé) pour que le compteur réagisse immédiatement.

- [ ] **Step 2: Contenir le scroll des listes**

Dans `SoireeBar.tsx`, sur le conteneur déplié, remplacer `className="px-3 pb-3 max-h-[55vh] overflow-y-auto ..."` par `className="px-3 pb-3 max-h-[55vh] overflow-y-auto overscroll-contain ..."`.

Dans la bande de dates de `SoireeBar` (le `div` `flex gap-1.5 overflow-x-auto pb-1`), ajouter `snap-x snap-proximity overscroll-x-contain` et `snap-center` sur les puces.

Dans `MesSoireesPage.tsx`, ajouter `overscroll-contain` à tout conteneur portant `overflow-y-auto`. S'il n'y en a aucun, ignorer cette étape.

- [ ] **Step 3: Profiler la texture des cartes, et ne changer que si nécessaire**

`.vintage-texture::before` applique un SVG `feTurbulence` en data-URI sur chaque
carte. L'URL étant identique partout, le navigateur la décode en principe une
seule fois — le gain d'un remplacement est donc **incertain**, et la spec impose
de mesurer d'abord.

Ouvrir l'onglet Performance des devtools en émulation mobile avec ralentissement
CPU 4×, enregistrer un défilement rapide d'une grille d'au moins 40 films, et
regarder la part de `Paint` et `Composite Layers`.

- Si la peinture des cartes ne ressort pas : **ne rien changer**, passer à
  l'étape suivante.
- Si elle ressort : générer un PNG de bruit de 64 × 64 dans
  `apps/web/public/images/noise.png`, et remplacer le `background-image` de
  `.vintage-texture::before` par `url('/images/noise.png')` avec
  `background-repeat: repeat`.

Noter la décision et la mesure dans le message de commit.

- [ ] **Step 4: Vérifier l'état du CSS global**

Ouvrir `apps/web/src/styles/globals.css` et confirmer que les règles suivantes ont bien disparu au fil des tâches précédentes :

- `#filmDrawer { will-change: transform; }` (tâche 8)
- `.drawer-open` (tâche 8)
- `body.drawer-active` (tâche 8)
- `select option { background-color: #1f2937; }` (tâche 10)

Et que `min-height: 100dvh` a remplacé `100vh` sur `body` (tâche 12).

- [ ] **Step 5: Compiler, builder, tester**

```bash
cd reeltime-v2/apps/web && npx tsc --noEmit && npx vitest run && npx vite build
```

Attendu : 30 tests au vert, build sans erreur.

- [ ] **Step 6: Vérification manuelle**

- Taper vite et longtemps dans la recherche sur le catalogue complet : aucune saccade dans le champ.
- Le compteur de filtres réagit immédiatement à la frappe, même si la liste met un instant à suivre.
- Faire défiler jusqu'en bas de la barre « Ma soirée » dépliée (desktop) : la page derrière ne bouge pas.
- Bandes horizontales : le défilement s'arrête sur une puce entière, pas au milieu.

- [ ] **Step 7: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "perf(web): recherche differee et confinement du scroll"
```

---

## Recette finale

À exécuter une fois les 14 tâches terminées, sur téléphone réel, PWA installée depuis l'écran d'accueil.

```bash
cd reeltime-v2 && pnpm build && pnpm test
cd apps/web && npx vite preview --host
```

- [ ] Aucune puce de jour grisée, un lundi comme un dimanche
- [ ] Moins de 110 px de chrome avant le premier film
- [ ] Les trois onglets, le badge Soirées, la safe-area en bas
- [ ] Header qui sort au scroll, barre de dates qui reste
- [ ] Toutes les feuilles (film, filtres, sélection) se ferment au doigt depuis leur milieu, y compris sur un coup sec
- [ ] Aucune fuite de scroll vers la page derrière une feuille
- [ ] Position de page préservée après fermeture d'une feuille
- [ ] Feuille de sélection ouverte depuis la feuille de filtres : sa fermeture ne débloque pas le scroll
- [ ] Le drawer pré-ouvre le jour sélectionné
- [ ] Aucune cible tactile sous 44 px, aucun texte sous 11 px
- [ ] Les six filtres donnent le même résultat en feuille (mobile) et en select (desktop)
- [ ] Desktop non régressé : barre soirée flottante, panneau de filtres accordéon, bouton d'enchaînement
