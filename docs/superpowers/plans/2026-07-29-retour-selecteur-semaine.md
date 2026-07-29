# Retour du sélecteur de dates par semaine — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la fenêtre glissante de 14 jours par une navigation par semaine calendaire (lundi→dimanche) sur `/` et `/soiree`, en conservant tous les acquis d'ergonomie mobile.

**Architecture:** Retour au chargement semaine par semaine via `useFilms(weekOffset)` (hook déjà présent) piloté par `useWeekNavigation` (restauré, synchronisé avec `?week=`). Le composant `WeekNavigator` est restauré au-dessus de la barre collée ; le `DateStrip` actuel est renommé `DayStrip` et adapté (jours passés désactivés, plus de « +7 jours »). Les hooks et utilitaires de la fenêtre glissante sont supprimés.

**Tech Stack:** React 19, TypeScript 5.9, Vite 6, Tailwind 3, React Query 5, Zustand 5, Vitest 4.

**Spec:** `docs/superpowers/specs/2026-07-29-retour-selecteur-semaine-design.md`

## Global Constraints

- Tous les chemins de ce plan sont relatifs à `reeltime-v2/apps/web/` sauf mention contraire. Les commandes se lancent depuis `reeltime-v2/apps/web/` sauf `pnpm lint` (depuis `reeltime-v2/`).
- **Vitest ne teste que des utilitaires purs.** `vitest.config.ts` impose `environment: 'node'` et `include: ['src/__tests__/**/*.test.ts']` — pas de `.tsx`, pas de jsdom, pas de React Testing Library. **Ne pas ajouter de dépendance de test de composant** : les composants et hooks React se vérifient par `npx tsc --noEmit`, `npx vite build` et la vérification manuelle de la tâche 8.
- Toutes les dates manipulées sont des chaînes `YYYY-MM-DD` comparables lexicographiquement. Les conversions en `Date` passent par `new Date(dateStr + 'T12:00:00Z')` et lisent des accesseurs `getUTC*`, comme le reste de `src/utils/dates.ts` — midi UTC évite les décalages de changement d'heure.
- Langue de l'interface : français. Les commentaires de code sont en français dans ce projet.
- Palette imposée (classes Tailwind du thème) : `rouge-cinema`, `bordeaux-profond`, `creme-ecran`, `beige-papier`, `sepia-chaud`, `or-antique`, `jaune-marquise`, `noir-velours`. Polices : `font-bebas`, `font-playfair`, `font-crimson`.
- Cibles tactiles : minimum 44 px, les puces de jour restent à `min-h-[48px]`.
- Barrels obligatoires : toute création/suppression dans `src/components/` ou `src/hooks/` se répercute dans `src/components/index.ts` / `src/hooks/index.ts`.
- Ne pas toucher à l'API : `GET /api/v1/films?weekOffset=` existe et suffit.
- Un commit par tâche, message en français, préfixe conventionnel (`feat(web):`, `refactor(web):`, `test(web):`, `chore(web):`), sans accents dans le sujet (convention du dépôt).

**Repères de dates pour tous les tests :** 2026-07-20 lundi, 2026-07-25 samedi, 2026-07-26 dimanche, 2026-07-27 lundi, 2026-07-29 mercredi, 2026-08-02 dimanche, 2026-08-03 lundi, 2026-12-28 lundi.

---

### Task 1: Utilitaires de dates

**Files:**
- Modify: `src/utils/dates.ts`
- Test: `src/__tests__/dates.test.ts`

**Interfaces:**
- Consumes: `weekDatesFrom(weekStart: string): string[]` (existe déjà dans `src/utils/dates.ts`).
- Produces:
  - `firstSelectableDate(weekDates: string[], today: string): string`
  - `formatWeekLabel(weekStart?: string, weekEnd?: string): string`

Ces deux fonctions sont consommées par la tâche 5 (`HomePage`) et la tâche 6 (`SoireePage`).

`formatWeekLabel` est écrite à la main plutôt qu'avec `toLocaleDateString('fr-FR')` comme l'ancienne version : la sortie d'ICU varie selon les environnements (`juil` vs `juil.`), ce qui rend le test fragile, et `new Date(s + 'T00:00:00')` interprété en heure locale décalait la date d'un jour selon le fuseau. Le reste de `dates.ts` code déjà les noms français à la main.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `src/__tests__/dates.test.ts`, et ajouter `weekDatesFrom`, `firstSelectableDate`, `formatWeekLabel` à l'`import` de la ligne 2 :

```ts
describe('weekDatesFrom', () => {
  it('renvoie 7 dates consécutives en incluant le départ', () => {
    expect(weekDatesFrom('2026-07-27')).toEqual([
      '2026-07-27',
      '2026-07-28',
      '2026-07-29',
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
      '2026-08-02',
    ]);
  });

  it('franchit le changement d année', () => {
    expect(weekDatesFrom('2026-12-28')).toEqual([
      '2026-12-28',
      '2026-12-29',
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
      '2027-01-03',
    ]);
  });
});

describe('firstSelectableDate', () => {
  const semaineCourante = weekDatesFrom('2026-07-27'); // 27 juil -> 2 aout

  it('renvoie aujourd hui quand la semaine est en cours', () => {
    expect(firstSelectableDate(semaineCourante, '2026-07-29')).toBe('2026-07-29');
  });

  it('renvoie le lundi quand la semaine est a venir', () => {
    expect(firstSelectableDate(weekDatesFrom('2026-08-03'), '2026-07-29')).toBe('2026-08-03');
  });

  it('renvoie le dernier jour quand la semaine est revolue', () => {
    expect(firstSelectableDate(weekDatesFrom('2026-07-20'), '2026-07-29')).toBe('2026-07-26');
  });

  it('gere le dimanche, dernier jour selectionnable de la semaine courante', () => {
    expect(firstSelectableDate(semaineCourante, '2026-08-02')).toBe('2026-08-02');
  });

  it('retombe sur aujourd hui quand la semaine n est pas encore chargee', () => {
    expect(firstSelectableDate([], '2026-07-29')).toBe('2026-07-29');
  });
});

describe('formatWeekLabel', () => {
  it('formate les deux bornes en jour + mois abrege', () => {
    expect(formatWeekLabel('2026-07-27', '2026-08-02')).toBe('27 juil. - 2 août');
  });

  it('n abrege pas les mois deja courts', () => {
    expect(formatWeekLabel('2026-03-02', '2026-03-08')).toBe('2 mars - 8 mars');
  });

  it('renvoie une chaine vide tant que la meta n est pas chargee', () => {
    expect(formatWeekLabel(undefined, undefined)).toBe('');
    expect(formatWeekLabel('2026-07-27', undefined)).toBe('');
  });
});
```

- [ ] **Step 2: Lancer les tests et vérifier qu'ils échouent**

Run: `npx vitest run src/__tests__/dates.test.ts`
Expected: FAIL — `firstSelectableDate is not a function` et `formatWeekLabel is not a function`. Les tests de `weekDatesFrom` passent déjà (la fonction existe).

- [ ] **Step 3: Écrire l'implémentation**

Ajouter dans `src/utils/dates.ts`, sous la constante `MONTHS_FR` existante :

```ts
const MONTHS_FR_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];
```

Puis à la fin du fichier :

```ts
/**
 * Jour à présélectionner dans une semaine quand une date est obligatoire :
 * aujourd'hui si la semaine est en cours, son lundi si elle est à venir, son
 * dernier jour si elle est révolue. Retombe sur `today` tant que la semaine
 * n'est pas chargée.
 */
export function firstSelectableDate(weekDates: string[], today: string): string {
  if (weekDates.length === 0) return today;
  return weekDates.find((d) => d >= today) ?? weekDates[weekDates.length - 1];
}

/** "2 août" */
function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return `${d.getUTCDate()} ${MONTHS_FR_SHORT[d.getUTCMonth()]}`;
}

/** "27 juil. - 2 août", vide tant que la meta de la semaine n'est pas là. */
export function formatWeekLabel(weekStart?: string, weekEnd?: string): string {
  if (!weekStart || !weekEnd) return '';
  return `${formatDayMonth(weekStart)} - ${formatDayMonth(weekEnd)}`;
}
```

- [ ] **Step 4: Lancer les tests et vérifier qu'ils passent**

Run: `npx vitest run src/__tests__/dates.test.ts`
Expected: PASS, tous les `describe` verts.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/dates.ts reeltime-v2/apps/web/src/__tests__/dates.test.ts
git commit -m "feat(web): helpers de semaine firstSelectableDate et formatWeekLabel"
```

---

### Task 2: Hook `useWeekNavigation`

**Files:**
- Create: `src/hooks/useWeekNavigation.ts`
- Modify: `src/hooks/index.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `useWeekNavigation(): { weekOffset: number; goToNextWeek: () => void; goToPrevWeek: () => void; goToToday: () => void }`. Consommé par les tâches 5 et 6.

Le hook est restauré tel qu'il existait avant le commit `0885914`. Pas de borne basse sur `weekOffset` : « Précédent » remonte indéfiniment dans le passé, décision explicite de l'utilisateur (spec §1).

Pas de test unitaire : le hook manipule `window.history` et `window.location`, hors du périmètre `environment: 'node'` de Vitest (voir les contraintes globales). Il est vérifié par `tsc`, par le build, et par la tâche 8.

- [ ] **Step 1: Créer le hook**

Créer `src/hooks/useWeekNavigation.ts` :

```ts
import { useState, useCallback, useEffect } from 'react';

/**
 * Décalage en semaines par rapport à la semaine courante, synchronisé avec
 * `?week=` dans l'URL pour qu'un lien partagé désigne bien une semaine. Le
 * paramètre est absent quand on est sur la semaine courante.
 */
export function useWeekNavigation() {
  const [weekOffset, setWeekOffset] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return parseInt(params.get('week') ?? '0', 10) || 0;
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    if (weekOffset === 0) {
      url.searchParams.delete('week');
    } else {
      url.searchParams.set('week', String(weekOffset));
    }
    if (url.toString() !== window.location.href) {
      window.history.pushState({}, '', url.toString());
    }
  }, [weekOffset]);

  // Retour arrière navigateur.
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setWeekOffset(parseInt(params.get('week') ?? '0', 10) || 0);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return {
    weekOffset,
    goToNextWeek: useCallback(() => setWeekOffset((w) => w + 1), []),
    goToPrevWeek: useCallback(() => setWeekOffset((w) => w - 1), []),
    goToToday: useCallback(() => setWeekOffset(0), []),
  };
}
```

Le garde `url.toString() !== window.location.href` n'était pas dans la version d'origine : sans lui, le premier rendu empile systématiquement une entrée d'historique identique à l'URL courante, et il faut alors deux « retour » pour quitter la page.

- [ ] **Step 2: Exporter depuis le barrel**

Dans `src/hooks/index.ts`, ajouter après la ligne `export { useFilms } from './useFilms';` :

```ts
export { useWeekNavigation } from './useWeekNavigation';
```

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/hooks/useWeekNavigation.ts reeltime-v2/apps/web/src/hooks/index.ts
git commit -m "feat(web): restaure le hook useWeekNavigation sur ?week="
```

---

### Task 3: Composant `WeekNavigator`

**Files:**
- Create: `src/components/WeekNavigator.tsx`
- Modify: `src/components/index.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `WeekNavigator` avec les props
  `{ weekOffset: number; weekLabel: string; onPrevWeek: () => void; onNextWeek: () => void; onToday: () => void; className?: string }`.
  Consommé par les tâches 5 et 6.

Restauration du composant supprimé par `0885914`. Le bouton « Cette semaine » n'apparaît que si `weekOffset !== 0`.

Le composant ne porte **aucune marge externe** : l'original avait `mb-4 sm:mb-6` en dur, ce qui aurait doublonné avec le `space-y-3` de la carte d'en-tête de `/soiree`. La marge est fournie par l'appelant via `className` — `HomePage` la met, `SoireePage` non.

- [ ] **Step 1: Créer le composant**

Créer `src/components/WeekNavigator.tsx` :

```tsx
interface WeekNavigatorProps {
  weekOffset: number;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  /** Marge externe, laissée à l'appelant : les deux pages l'espacent autrement. */
  className?: string;
}

export function WeekNavigator({
  weekOffset,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
  className = '',
}: WeekNavigatorProps) {
  return (
    <div className={`bg-beige-papier border-2 border-sepia-chaud rounded-xl md:rounded-2xl p-3 sm:p-5 shadow-md ${className}`}>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-center">
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="Semaine precedente"
            className="font-bebas px-3 sm:px-6 py-2 sm:py-2.5 min-h-[44px] bg-creme-ecran hover:bg-or-antique/20 border-2 border-sepia-chaud hover:border-rouge-cinema rounded-lg sm:rounded-xl text-noir-velours text-sm sm:text-base uppercase tracking-wide transition-all duration-200 hover:-translate-x-1"
          >
            <span className="hidden sm:inline">&larr; Précédent</span>
            <span className="sm:hidden">&larr;</span>
          </button>

          <div className="font-crimson px-3 sm:px-8 py-2 sm:py-2.5 bg-rouge-cinema border-2 border-bordeaux-profond rounded-lg sm:rounded-xl text-creme-ecran text-xs sm:text-base font-semibold text-center flex-1 sm:flex-none shadow-md">
            <span className="hidden sm:inline">📅 </span>
            {weekLabel}
          </div>

          <button
            type="button"
            onClick={onNextWeek}
            aria-label="Semaine suivante"
            className="font-bebas px-3 sm:px-6 py-2 sm:py-2.5 min-h-[44px] bg-creme-ecran hover:bg-or-antique/20 border-2 border-sepia-chaud hover:border-rouge-cinema rounded-lg sm:rounded-xl text-noir-velours text-sm sm:text-base uppercase tracking-wide transition-all duration-200 hover:translate-x-1"
          >
            <span className="hidden sm:inline">Suivant &rarr;</span>
            <span className="sm:hidden">&rarr;</span>
          </button>
        </div>

        {weekOffset !== 0 && (
          <button
            type="button"
            onClick={onToday}
            className="font-bebas px-3 sm:px-4 py-2 sm:py-2.5 min-h-[44px] bg-jaune-marquise hover:bg-or-antique border-2 border-or-antique rounded-lg sm:rounded-xl text-noir-velours text-sm sm:text-base font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span className="hidden sm:inline">🎬 Cette semaine</span>
            <span className="sm:hidden">Cette semaine</span>
          </button>
        )}
      </div>
    </div>
  );
}
```

Deux écarts assumés par rapport à la version d'origine : `min-h-[44px]` sur les trois boutons (règle de cible tactile issue de la refonte mobile, que l'ancien composant ne respectait pas), et la marge externe déportée dans `className`.

- [ ] **Step 2: Exporter depuis le barrel**

Dans `src/components/index.ts`, ajouter après la ligne `export { DateStrip } from './DateStrip';` :

```ts
export { WeekNavigator } from './WeekNavigator';
```

(La ligne `DateStrip` sera remplacée à la tâche 4.)

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/components/WeekNavigator.tsx reeltime-v2/apps/web/src/components/index.ts
git commit -m "feat(web): restaure le composant WeekNavigator"
```

---

### Task 4: `DateStrip` devient `DayStrip`

**Files:**
- Create: `src/components/DayStrip.tsx`
- Delete: `src/components/DateStrip.tsx`
- Modify: `src/components/index.ts`
- Modify: `src/pages/HomePage.tsx` (import et bloc `<DateStrip>`)
- Modify: `src/pages/SoireePage.tsx` (import et bloc `<DateStrip>`)

**Les numéros de ligne cités dans ce plan valent pour l'état du fichier avant la première édition de la tâche.** Dès qu'une étape a modifié un fichier, repérer le bloc suivant par son contenu, pas par sa ligne.

**Interfaces:**
- Consumes: `formatDayShort`, `localISODate` depuis `src/utils/dates.ts`.
- Produces: `DayStrip` avec les props
  `{ dates: string[]; value: string | null; onChange: (date: string | null) => void; hideAllChip?: boolean }`.
  Les props `onLoadMore` et `isLoadingMore` de `DateStrip` **disparaissent**. Consommé par les tâches 5 et 6.

Trois changements de comportement (spec §2) : suppression de la puce « +7 jours », désactivation des jours passés, sous-titre de « Tous » qui passe de `{dates.length} j` à `semaine`.

Cette tâche touche les deux pages parce que le renommage casse leurs imports ; elle ne change pas encore leur source de données (elles restent sur `useFilmsRange`). Le build doit rester vert à la fin.

- [ ] **Step 1: Créer `src/components/DayStrip.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { formatDayShort, localISODate } from '../utils/dates';

interface DayStripProps {
  /** Les 7 dates (YYYY-MM-DD) de la semaine affichée, lundi -> dimanche. */
  dates: string[];
  /** Date sélectionnée, ou null pour toute la semaine. */
  value: string | null;
  onChange: (date: string | null) => void;
  /** Masque la puce « Tous » (planificateur de soirée : un jour est obligatoire). */
  hideAllChip?: boolean;
}

/** « sam. 26 » -> { day: 'sam.', num: '26' } pour l'affichage sur deux lignes. */
function splitDayLabel(date: string): { day: string; num: string } {
  const [day, num] = formatDayShort(date).split(' ');
  return { day, num };
}

export function DayStrip({ dates, value, onChange, hideAllChip = false }: DayStripProps) {
  const today = localISODate();
  const activeRef = useRef<HTMLButtonElement>(null);

  // Amène la puce active dans le viewport horizontal au montage, sans faire
  // défiler la page verticalement (block: 'nearest').
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  const chipClass = (selected: boolean, disabled: boolean) =>
    `font-bebas shrink-0 snap-center flex flex-col items-center justify-center min-w-[52px] min-h-[48px] px-2 rounded-xl border-2 text-xs uppercase tracking-wide transition-colors ${
      selected
        ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
        : disabled
          ? 'bg-beige-papier border-sepia-chaud/30 text-sepia-chaud/40 cursor-not-allowed'
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
          className={chipClass(value === null, false)}
        >
          <span>Tous</span>
          <span className="text-[11px] opacity-80 normal-case">semaine</span>
        </button>
      )}

      {dates.map((date) => {
        const { day, num } = splitDayLabel(date);
        const isToday = date === today;
        const isPast = date < today;
        const selected = value === date;
        return (
          <button
            key={date}
            type="button"
            ref={selected ? activeRef : undefined}
            disabled={isPast}
            onClick={() => onChange(date)}
            aria-pressed={selected}
            aria-label={isToday ? "Aujourd'hui" : formatDayShort(date)}
            className={chipClass(selected, isPast)}
          >
            <span>{isToday ? 'Auj.' : day}</span>
            <span className="font-playfair text-base font-bold leading-none">{num}</span>
          </button>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Supprimer l'ancien fichier et corriger le barrel**

```bash
git rm reeltime-v2/apps/web/src/components/DateStrip.tsx
```

Dans `src/components/index.ts`, remplacer :

```ts
export { DateStrip } from './DateStrip';
```

par :

```ts
export { DayStrip } from './DayStrip';
```

- [ ] **Step 3: Corriger `HomePage.tsx`**

Remplacer l'import `import { DateStrip } from '../components/DateStrip';` par :

```tsx
import { DayStrip } from '../components/DayStrip';
```

Remplacer le bloc JSX qui commence par `<DateStrip` et se termine par `/>` (celui qui passe `onLoadMore={loadMore}`) par :

```tsx
              <DayStrip
                dates={weekDates}
                value={ceSoirMode ? today : selectedDate}
                onChange={(d) => {
                  setCeSoirMode(false);
                  setSelectedDate(d);
                }}
              />
```

`isLoadingMore` n'est plus consommé : le retirer de la déstructuration de `useFilmsRange` (la ligne `isLoadingMore,` dans le bloc `const { films: rangeFilms, dates: weekDates, ... } = useFilmsRange(selectedDate);`). `loadMore` reste utilisé par l'`EmptyState` jusqu'à la tâche 5 — ne pas y toucher ici.

- [ ] **Step 4: Corriger `SoireePage.tsx`**

Remplacer l'import `import { DateStrip } from '../components/DateStrip';` par :

```tsx
import { DayStrip } from '../components/DayStrip';
```

Puis, dans le seul bloc `<DateStrip … hideAllChip />` du fichier, remplacer le nom de balise ouvrante : `<DateStrip` devient `<DayStrip`. Les props passées sont déjà toutes valides.

- [ ] **Step 5: Vérifier compilation et build**

Run: `npx tsc --noEmit && npx vite build`
Expected: aucune erreur TypeScript, build réussi.

- [ ] **Step 6: Commit**

```bash
git add -A reeltime-v2/apps/web/src
git commit -m "refactor(web): DateStrip devient DayStrip, jours passes desactives"
```

---

### Task 5: Page d'accueil sur la navigation par semaine

**Files:**
- Modify: `src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `useWeekNavigation()` (tâche 2), `WeekNavigator` (tâche 3), `DayStrip` (tâche 4), `formatWeekLabel` (tâche 1), `useFilms(weekOffset)` et `weekDatesFrom(weekStart)` (existants).
- Produces: rien pour les autres tâches.

`useFilms` renvoie un `useQuery` avec `placeholderData: keepPreviousData` : `isPlaceholderData` sert à estomper la grille pendant qu'une nouvelle semaine charge, sans faire réapparaître le squelette. C'est le comportement qu'avait la page avant `0885914`, on le restaure.

**Ancres :** les numéros de ligne ci-dessous valent pour l'état du fichier **au début de la tâche**. Après la première étape ils dérivent — repérer chaque bloc suivant par le code cité, pas par sa ligne.

- [ ] **Step 1: Remplacer les imports**

En tête de `src/pages/HomePage.tsx`, remplacer le bloc d'imports (de `import { useState, …` jusqu'à `import { localISODate } from '../utils/dates';`, lignes 1 à 16) par :

```tsx
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { WeekNavigator } from '../components/WeekNavigator';
import { FilmGrid } from '../components/FilmGrid';
import { FilmDrawer } from '../components/FilmDrawer';
import { FilmGridSkeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FilterBar, FilterSheet, ActiveFilterTags } from '../components/filters';
import { DayStrip } from '../components/DayStrip';
import { PlanningView } from '../components/PlanningView';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { useFilteredFilms } from '../hooks/useFilteredFilms';
import { useCinemas } from '../hooks/useCinemas';
import { useFiltersStore } from '../stores/filtersStore';
import { formatWeekLabel, localISODate, weekDatesFrom } from '../utils/dates';
import type { FilmListItem } from '../types/components';

/** Référence stable : `?? []` en ligne recréerait un tableau à chaque rendu. */
const NO_FILMS: FilmListItem[] = [];
```

- [ ] **Step 2: Remplacer l'état et les données dérivées**

Dans le corps de `HomePage`, remplacer tout le bloc allant de `const { selectedDate, setSelectedDate } = useSelectedDate();` jusqu'à `const today = localISODate();` inclus par :

```tsx
  const { weekOffset, goToNextWeek, goToPrevWeek, goToToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch, isPlaceholderData } = useFilms(weekOffset);
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();
  const { data: cinemas = [] } = useCinemas();
  const resetAll = useFiltersStore((s) => s.resetAll);
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  const setSelectedDate = useFiltersStore((s) => s.setSelectedDate);
  const viewMode = useFiltersStore((s) => s.viewMode);
  const setViewMode = useFiltersStore((s) => s.setViewMode);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const setSearchQuery = useFiltersStore((s) => s.setSearchQuery);
  const today = localISODate();
```

- [ ] **Step 3: Restaurer l'effet de changement de semaine**

Juste après le `useEffect` qui garde la recherche dépliée (celui dont le corps est `if (searchQuery) setSearchOpen(true);`), ajouter :

```tsx
  // Un jour choisi n'a de sens que dans la semaine où on l'a choisi. « Ce soir »
  // ne se coupe qu'en quittant la semaine courante : l'activer depuis une autre
  // semaine ramène weekOffset à 0, ce qui ne doit pas le désactiver aussitôt.
  useEffect(() => {
    setSelectedDate(null);
    if (weekOffset !== 0) setCeSoirMode(false);
  }, [weekOffset, setSelectedDate, setCeSoirMode]);
```

- [ ] **Step 4: Remplacer les dérivations de films et de dates**

Remplacer la ligne `const { filteredFilms, activeFilterCount, hasActiveFilters } = useFilteredFilms(rangeFilms);` par :

```tsx
  const films = data?.films ?? NO_FILMS;
  const { filteredFilms, activeFilterCount, hasActiveFilters } = useFilteredFilms(films);

  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );
```

Puis remplacer les deux lignes `const hasFilms = rangeFilms.length > 0;` et `const noResults = hasFilms && filteredFilms.length === 0;` par :

```tsx
  const weekLabel = formatWeekLabel(data?.meta.weekStart, data?.meta.weekEnd);
  const hasFilms = films.length > 0;
  const noResults = hasFilms && filteredFilms.length === 0;
```

- [ ] **Step 5: Insérer `WeekNavigator` dans le JSX**

Entre `<ScrollToTopButton />` et le bloc de la barre collée, ajouter :

```tsx
      {/* Navigation par semaine : en tête de page, défile avec le contenu.
          Affichée même en chargement et en erreur, pour pouvoir toujours
          changer de semaine. */}
      <WeekNavigator
        weekOffset={weekOffset}
        weekLabel={weekLabel}
        onPrevWeek={goToPrevWeek}
        onNextWeek={goToNextWeek}
        onToday={goToToday}
        className="mb-3 sm:mb-6"
      />
```

Ne pas toucher au reste de la barre collée : `--sticky-top` mesure `stickyBarRef`, et comme `WeekNavigator` n'est pas `sticky`, la logique existante reste valable.

- [ ] **Step 6: Adapter l'état vide et la zone de contenu**

Remplacer le bloc `EmptyState` dont le `message` est `"Aucun film trouve sur les prochains jours"` par :

```tsx
      {!isLoading && !isError && !hasFilms && (
        <EmptyState
          message="Aucun film cette semaine"
          actionLabel="Semaine suivante"
          onAction={goToNextWeek}
        />
      )}
```

Remplacer le `<div>` nu qui ouvre la zone de contenu (celui juste sous `{!isLoading && !isError && filteredFilms.length > 0 && (`) par :

```tsx
        <div className={`transition-opacity duration-200 ${isPlaceholderData ? 'opacity-50 pointer-events-none' : ''}`}>
```

Ce fondu remplace le squelette pendant qu'une nouvelle semaine charge, `keepPreviousData` gardant l'ancienne à l'écran.

Enfin, dans le `<FilmDrawer>`, remplacer `films={rangeFilms}` par `films={films}`.

- [ ] **Step 7: Vérifier compilation et build**

Run: `npx tsc --noEmit && npx vite build`
Expected: aucune erreur. En particulier, plus aucune référence à `rangeFilms`, `isLoadingMore` ou `loadMore` dans le fichier.

- [ ] **Step 8: Commit**

```bash
git add reeltime-v2/apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): accueil sur la navigation par semaine calendaire"
```

---

### Task 6: Page /soiree sur la navigation par semaine

**Files:**
- Modify: `src/pages/SoireePage.tsx`

**Interfaces:**
- Consumes: `useWeekNavigation()` (tâche 2), `WeekNavigator` (tâche 3), `DayStrip` (tâche 4), `firstSelectableDate` et `formatWeekLabel` (tâche 1), `useFilms` et `weekDatesFrom` (existants).
- Produces: rien.

La page impose une date (`hideAllChip`, `selectedDate: string` non nullable). Changer de semaine doit donc recaler la sélection au lieu de la vider.

**Ancres :** mêmes règles qu'à la tâche 5 — les numéros de ligne valent pour l'état du fichier au début de la tâche, repérer les blocs suivants par leur contenu.

- [ ] **Step 1: Remplacer les imports**

Remplacer le bloc d'imports allant de `import { useMemo, useState, useCallback } from 'react';` à `import { localISODate } from '../utils/dates';` (lignes 1 à 12) par :

```tsx
import { useMemo, useState, useEffect, useCallback } from 'react';
import { WeekNavigator } from '../components/WeekNavigator';
import { DayStrip } from '../components/DayStrip';
import { FilmDrawer } from '../components/FilmDrawer';
import { ErrorState } from '../components/ErrorState';
import { FilmGridSkeleton } from '../components/Skeleton';
import { AddToSoireeButton } from '../components/soiree/AddToSoireeButton';
import { CandidateRow } from '../components/soiree/CandidateRow';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useCinemas } from '../hooks/useCinemas';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { normalizeText } from '../hooks/useFilteredFilms';
import { firstSelectableDate, formatWeekLabel, localISODate, weekDatesFrom } from '../utils/dates';
```

Sous la constante `const NO_POSTER = '/images/no-poster.svg';`, ajouter :

```tsx
/** Référence stable : `?? []` en ligne recréerait un tableau à chaque rendu. */
const NO_FILMS: FilmListItem[] = [];
```

(`FilmListItem` est déjà importé en type à la ligne 21.)

- [ ] **Step 2: Remplacer la source de données**

Remplacer la ligne `const { films: rangeFilms, dates: weekDates, isLoading, isError, refetch } = useFilmsRange();` par :

```tsx
  const { weekOffset, goToNextWeek, goToPrevWeek, goToToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch } = useFilms(weekOffset);
  const weekFilms = data?.films ?? NO_FILMS;
  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );
  const weekLabel = formatWeekLabel(data?.meta.weekStart, data?.meta.weekEnd);
```

- [ ] **Step 3: Recaler la date au changement de semaine**

Après la déclaration `const [sort, setSort] = useState<CandidateSort>('gap');`, ajouter :

```tsx
  // Un jour est obligatoire ici : dès que la date choisie sort de la semaine
  // affichée, on se recale sur son premier jour sélectionnable et on repart
  // d'une feuille blanche, comme le fait le clic sur une puce de jour.
  useEffect(() => {
    if (weekDates.length === 0) return;
    if (weekDates.includes(selectedDate)) return;
    setSelectedDate(firstSelectableDate(weekDates, today));
    setFilmId(null);
    setAnchorId(null);
  }, [weekDates, today, selectedDate]);
```

- [ ] **Step 4: Renommer `rangeFilms` en `weekFilms`**

Remplacer les 5 occurrences restantes de `rangeFilms` par `weekFilms` : dans `pickableFilms`, dans `selectedFilmItem`, dans les deux appels à `findChainable` (`before` et `after`, y compris leurs tableaux de dépendances `useMemo`), et dans `films={rangeFilms}` du `<FilmDrawer>`.

Vérifier ensuite qu'il n'en reste aucune :

```bash
grep -n "rangeFilms" reeltime-v2/apps/web/src/pages/SoireePage.tsx
```
Expected: aucune sortie.

- [ ] **Step 5: Insérer `WeekNavigator` et corriger la bande de jours**

Dans la carte d'en-tête, remplacer le bloc qui va de `<div className="space-y-3">` à la fin de l'élément `<DayStrip … hideAllChip />` par :

```tsx
        <div className="space-y-3">
          <WeekNavigator
            weekOffset={weekOffset}
            weekLabel={weekLabel}
            onPrevWeek={goToPrevWeek}
            onNextWeek={goToNextWeek}
            onToday={goToToday}
          />

          <DayStrip
            dates={weekDates}
            value={selectedDate}
            onChange={(d) => {
              setSelectedDate(d ?? today);
              setFilmId(null);
              setAnchorId(null);
            }}
            hideAllChip
          />
```

`className` n'est **pas** passé ici : l'espacement vient du `space-y-3` du conteneur (c'est la raison pour laquelle la tâche 3 a sorti la marge du composant).

- [ ] **Step 6: Vérifier compilation et build**

Run: `npx tsc --noEmit && npx vite build`
Expected: aucune erreur, plus aucune référence à `rangeFilms` ni à `useFilmsRange` dans le fichier.

- [ ] **Step 7: Commit**

```bash
git add reeltime-v2/apps/web/src/pages/SoireePage.tsx
git commit -m "feat(web): page soiree sur la navigation par semaine"
```

---

### Task 7: Suppression du code de la fenêtre glissante

**Files:**
- Delete: `src/hooks/useFilmsRange.ts`
- Delete: `src/hooks/useSelectedDate.ts`
- Delete: `src/utils/mergeFilms.ts`
- Delete: `src/__tests__/mergeFilms.test.ts`
- Modify: `src/hooks/index.ts`
- Modify: `src/utils/dates.ts`
- Modify: `src/__tests__/dates.test.ts`
- Modify: `reeltime-v2/CLAUDE.md` (relecture, changement non attendu)

**Interfaces:**
- Consumes: rien.
- Produces: rien.

Ces symboles n'ont plus aucun consommateur après les tâches 5 et 6. `rangeDates`, `rangeEnd`, `weeksNeededFor`, `mondayOf` et `addDays` formaient une chaîne dont `useFilmsRange` était l'unique point d'entrée : `addDays` n'était appelé que par `mondayOf` et `rangeDates`, `mondayOf` que par `rangeEnd` et `weeksNeededFor`.

- [ ] **Step 1: Vérifier qu'il ne reste aucun consommateur**

Run:
```bash
grep -rn "useFilmsRange\|useSelectedDate\|mergeFilmPages\|rangeDates\|rangeEnd\|weeksNeededFor\|mondayOf\|addDays\|DateStrip" reeltime-v2/apps/web/src
```
Expected: seules les définitions elles-mêmes et leurs tests apparaissent — aucun import depuis `pages/`, `components/` ou un autre `hooks/`. **Si un autre consommateur apparaît, arrêter et signaler** plutôt que de supprimer.

- [ ] **Step 2: Supprimer les fichiers**

```bash
git rm reeltime-v2/apps/web/src/hooks/useFilmsRange.ts \
       reeltime-v2/apps/web/src/hooks/useSelectedDate.ts \
       reeltime-v2/apps/web/src/utils/mergeFilms.ts \
       reeltime-v2/apps/web/src/__tests__/mergeFilms.test.ts
```

- [ ] **Step 3: Nettoyer le barrel des hooks**

Dans `src/hooks/index.ts`, supprimer ces deux lignes :

```ts
export { useFilmsRange } from './useFilmsRange';
export { useSelectedDate } from './useSelectedDate';
```

- [ ] **Step 4: Retirer les fonctions mortes de `dates.ts`**

Dans `src/utils/dates.ts`, supprimer entièrement `addDays`, `mondayOf`, `rangeDates`, `rangeEnd` et `weeksNeededFor` (le bloc allant de `/** Date ISO décalée de n jours (n peut être négatif). */` jusqu'à la fin de `weeksNeededFor`).

Conserver : `localISODate`, `weekDatesFrom`, `formatDayShort`, `formatDayLong`, `nowHHMM`, `firstSelectableDate`, `formatDayMonth`, `formatWeekLabel`, et les constantes `DAYS_FR`, `DAYS_FR_SHORT`, `MONTHS_FR`, `MONTHS_FR_SHORT`.

- [ ] **Step 5: Retirer les tests correspondants**

Dans `src/__tests__/dates.test.ts`, supprimer les blocs `describe('addDays')`, `describe('mondayOf')`, `describe('rangeDates')`, `describe('rangeEnd')` et `describe('weeksNeededFor')` (lignes 6 à 84), et ramener l'import de la ligne 2 à :

```ts
import {
  firstSelectableDate,
  formatWeekLabel,
  weekDatesFrom,
} from '../utils/dates';
```

Conserver le commentaire de repères de dates de la ligne 4.

- [ ] **Step 6: Relire `CLAUDE.md`**

Ouvrir `reeltime-v2/CLAUDE.md` et vérifier que la section « Web (`apps/web`) » décrit bien `WeekNavigator`, `DayStrip`, `useWeekNavigation`, et ne mentionne ni `DateStrip` ni `useFilmsRange`. Aucun changement n'est attendu (le fichier n'avait pas été mis à jour lors de la refonte du 2026-07-25). Corriger seulement si un écart apparaît.

- [ ] **Step 7: Vérification complète**

Run, depuis `reeltime-v2/apps/web/` :
```bash
npx vitest run
npx tsc --noEmit
npx vite build
```
Expected: tests verts (`dates.test.ts` et `gestures.test.ts`), pas d'erreur TypeScript, build réussi.

Puis, depuis `reeltime-v2/` :
```bash
pnpm lint
```
Expected: aucune erreur, en particulier aucun `no-unused-vars` résiduel.

- [ ] **Step 8: Commit**

```bash
git add -A reeltime-v2/apps/web reeltime-v2/CLAUDE.md
git commit -m "chore(web): supprime le code de la fenetre glissante de dates"
```

---

### Task 8: Vérification manuelle

**Files:** aucun (validation)

**Interfaces:**
- Consumes: l'application complète issue des tâches 1 à 7.
- Produces: rien.

Les composants et hooks React ne sont pas couverts par Vitest dans ce projet (contraintes globales). Cette tâche est la seule vérification du comportement réel.

- [ ] **Step 1: Lancer l'API et le web**

Depuis `reeltime-v2/` : `pnpm dev`. Ouvrir `http://localhost:5173`.

- [ ] **Step 2: Dérouler la checklist d'accueil**

- [ ] Le bandeau de semaine s'affiche en haut avec le libellé du type `27 juil. - 2 août`.
- [ ] « Suivant → » avance d'une semaine ; le libellé change, la grille se recharge sans passer par le squelette (elle s'estompe brièvement).
- [ ] Le bouton « 🎬 Cette semaine » apparaît dès qu'on quitte la semaine courante et ramène à `weekOffset = 0`.
- [ ] L'URL affiche `?week=1`, `?week=-1`… et perd le paramètre sur la semaine courante.
- [ ] Le bouton « retour » du navigateur revient à la semaine précédemment consultée.
- [ ] La bande de jours montre 7 puces lundi→dimanche ; sur la semaine courante, les jours révolus sont grisés et non cliquables.
- [ ] La puce « Tous » affiche « semaine » en sous-titre et il n'y a plus de puce « +7 jours ».
- [ ] Sélectionner un jour, puis changer de semaine : la sélection retombe sur « Tous ».
- [ ] Activer « Ce soir » depuis les filtres, puis changer de semaine : le mode se coupe.
- [ ] En défilant, le bandeau de semaine disparaît et la bande de jours reste collée en haut avec les boutons 🔍 et ⚙.
- [ ] En vue Planning, les en-têtes de jour se collent juste sous la bande de dates, sans chevauchement (vérifie `--sticky-top`).

- [ ] **Step 3: Dérouler la checklist /soiree**

- [ ] Le bandeau de semaine est dans la carte d'en-tête, au-dessus de la bande de jours, avec un espacement régulier (pas de double marge).
- [ ] Il n'y a pas de puce « Tous » ; un jour est toujours sélectionné.
- [ ] Passer à la semaine suivante sélectionne son lundi et remet à zéro le film et la séance choisis.
- [ ] Revenir à la semaine courante resélectionne aujourd'hui.
- [ ] Remonter à une semaine passée sélectionne son dimanche et affiche une liste vide, sans planter.

- [ ] **Step 4: Vérifier sur mobile**

Dans les outils de développement, largeur 390 px :
- [ ] Le bandeau de semaine tient sur deux lignes et ses trois boutons font au moins 44 px de haut.
- [ ] La bande de jours défile horizontalement et se centre sur la puce active à l'ouverture.
- [ ] Les onglets bas et la barre « Ma soirée » sont inchangés.

- [ ] **Step 5: Signaler le résultat**

Rapporter les points de la checklist qui échouent. Ne pas commiter : cette tâche ne produit pas de code. Si un correctif est nécessaire, il fait l'objet d'un commit `fix(web):` dédié.

---

## Notes d'exécution

- Les tâches 1 à 3 sont indépendantes entre elles et peuvent être menées en parallèle. Les tâches 4, 5, 6 sont séquentielles et dépendent de 1-3. La 7 dépend de 5 et 6. La 8 dépend de tout.
- Le dépôt est sur `main`. Créer une branche `feat/selecteur-semaine` avant la tâche 1 si le travail doit être isolé.
- Ne pas pousser ni redéployer : la production tourne via Portainer/ghcr et le redéploiement est une décision de l'utilisateur.
