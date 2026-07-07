# Ergonomie quotidienne (« Ce soir » + « Ma soirée ») — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le mode transitoire « Ce soir » (aujourd'hui, séances ≥ max(18h, maintenant)) et le plan « Ma soirée » (constructeur d'enchaînements persisté, barre repliable en bas) à l'app web ReelTime.

**Architecture:** Tout côté client dans `reeltime-v2/apps/web`. « Ce soir » = booléen non persisté dans le `filtersStore` existant + overlay dans `useFilteredFilms`. « Ma soirée » = nouveau store Zustand persisté `soireeStore` (snapshots de séances), une barre `SoireeBar` montée dans `Layout`, un bouton partagé `AddToSoireeButton` branché sur 4 points d'entrée (FilmShowtimes, SequencePanel, PlanningView, SoireePage).

**Tech Stack:** React 19 + Vite 6 + Tailwind 3 + Zustand (persist) + React Query 5. Spec de référence : `docs/superpowers/specs/2026-07-06-ergonomie-quotidienne-design.md`.

## Global Constraints

- **Aucun changement API/backend.** Seul `reeltime-v2/apps/web/src` est modifié.
- **Pas de framework de test dans `apps/web`.** Vérification par tâche : `npx tsc --noEmit` (lancé depuis `reeltime-v2/apps/web`). `npx vite build` aux jalons (fin de la partie « Ce soir », fin de plan). QA manuelle en tâche finale.
- Clé persist filtres : `reeltime-filters` ; clé persist soirée : `reeltime-soiree`. `ceSoirMode` **exclu du `partialize`** de `reeltime-filters`.
- Libellés français exacts (copier tels quels) : « Ce soir », « Ma soirée », « Tout effacer », « + un film avant », « + un film après », « Utiliser ce combo », « Ajouter cette séance », « ⚠ villes différentes », confirm `Remplacer la soirée du ${formatDayShort(date)} ?`.
- Design system vintage : classes `font-bebas` / `font-playfair` / `font-crimson`, couleurs `rouge-cinema`, `creme-ecran`, `beige-papier`, `sepia-chaud`, `bordeaux-profond`, `or-antique`, `noir-velours`.
- Réutiliser `utils/chaining.ts` (`estimatedEnd`, `toMinutes`, `formatClock`, `formatGap`, `findChainable`, `OVERLAP_TOLERANCE_MIN`) — ne rien redéfinir.
- Barrel exports : tout nouveau fichier doit être ajouté à `components/index.ts` / `stores/index.ts` (règle CLAUDE.md du repo).
- Messages de commit **sans accents**, préfixe `feat(web):`, avec le trailer `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- React 19 : `useRef<T>(undefined)` et non `useRef<T>()` (si besoin d'un ref).
- HTML valide : **jamais de `<button>` imbriqué dans un `<button>`** (PlanningView et SequencePanel doivent être restructurés pour ça, voir tâches 10-11).

## File Structure

**Créés :**
- `reeltime-v2/apps/web/src/stores/soireeStore.ts` — store persisté + helpers `makeSoireeItem` / `addToSoiree` / `replaceSoiree` (toute la logique de règles : dédup, confirmation inter-dates, tri, purge).
- `reeltime-v2/apps/web/src/components/soiree/AddToSoireeButton.tsx` — bouton « + / ✓ » partagé (icône seule ou icône + label).
- `reeltime-v2/apps/web/src/components/soiree/SoireeBar.tsx` — barre repliable fixe (timeline, battements, suggestions, purge au montage).

**Modifiés :**
- `stores/filtersStore.ts` — `ceSoirMode` + setter (hors partialize).
- `stores/index.ts`, `components/index.ts` — barrels.
- `utils/dates.ts` — helper `nowHHMM()`.
- `utils/chaining.ts` — `anchorFilm` élargi à `Pick<FilmListItem, 'id' | 'runtime'>`.
- `hooks/useFilteredFilms.ts` — overlay « Ce soir ».
- `pages/HomePage.tsx` — bouton « Ce soir », DayStrip, désactivation au changement de semaine, `cityOf` vers PlanningView, offset ScrollToTopButton.
- `components/filters/FilterBar.tsx` — tag « Ce soir » (prioritaire sur le tag créneau).
- `components/layout/Layout.tsx` — monte `SoireeBar` + padding-bottom conditionnel.
- `components/FilmShowtimes.tsx`, `components/FilmDrawer.tsx` — « + » par pastille horaire.
- `components/SequencePanel.tsx` — « + » par candidat + « Ajouter cette séance » pour l'ancre.
- `components/PlanningView.tsx` — « + » par séance (ligne restructurée).
- `pages/SoireePage.tsx` — bouton « Utiliser ce combo ».

---

### Task 1: `ceSoirMode` transitoire dans `filtersStore`

**Files:**
- Modify: `reeltime-v2/apps/web/src/stores/filtersStore.ts`

**Interfaces:**
- Consumes: rien (état existant).
- Produces: `useFiltersStore` expose `ceSoirMode: boolean` (défaut `false`) et `setCeSoirMode: (v: boolean) => void`. `resetAll()` remet `ceSoirMode: false`. `ceSoirMode` n'apparaît **pas** dans `partialize` (non persisté).

- [ ] **Step 1: Ajouter l'état et le setter**

Dans `interface FiltersState`, après la ligne `viewMode: ViewMode;` :

```ts
  /** Mode « Ce soir » : overlay transitoire (aujourd'hui, séances >= max(18h, maintenant)). Jamais persisté. */
  ceSoirMode: boolean;
```

Et après `setViewMode: (m: ViewMode) => void;` :

```ts
  setCeSoirMode: (v: boolean) => void;
```

Dans le créateur du store, après `viewMode: 'grid',` :

```ts
      ceSoirMode: false,
```

Après `setViewMode: (viewMode) => set({ viewMode }),` :

```ts
      setCeSoirMode: (ceSoirMode) => set({ ceSoirMode }),
```

Et modifier `resetAll` pour inclure `ceSoirMode: false` :

```ts
      resetAll: () =>
        set({ searchQuery: '', selectedCinemas: [], selectedDepartment: null, selectedCity: null, version: null, minTime: null, minRating: null, sort: 'popularity', selectedDate: null, timeSlot: 'all', minAge: 0, ceSoirMode: false }),
```

**Ne pas toucher au `partialize`** : il liste explicitement les champs persistés, donc `ceSoirMode` en est déjà exclu.

- [ ] **Step 2: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add reeltime-v2/apps/web/src/stores/filtersStore.ts
git commit -m "feat(web): etat ceSoirMode transitoire dans filtersStore"
```

---

### Task 2: Overlay « Ce soir » dans `useFilteredFilms`

**Files:**
- Modify: `reeltime-v2/apps/web/src/utils/dates.ts`
- Modify: `reeltime-v2/apps/web/src/hooks/useFilteredFilms.ts`

**Interfaces:**
- Consumes: `useFiltersStore.ceSoirMode` (Task 1), `localISODate()` existant.
- Produces: `nowHHMM(): string` exporté depuis `utils/dates.ts` (réutilisé par SoireeBar en Task 7). Quand `ceSoirMode` est vrai, `useFilteredFilms` ignore `selectedDate`/`timeSlot` et ne garde que les séances d'aujourd'hui dont `time >= max('18:00', maintenant)`. `activeFilterCount` compte « Ce soir » comme 1 filtre et ne compte plus `timeSlot` pendant le mode.

- [ ] **Step 1: Ajouter `nowHHMM` à `utils/dates.ts`**

À la fin du fichier :

```ts
/** Current time "HH:MM" (zero-padded) in the user's local timezone. */
export function nowHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Brancher l'overlay dans `useFilteredFilms.ts`**

Ajouter l'import en haut :

```ts
import { localISODate, nowHHMM } from '../utils/dates';
```

Dans le hook, après `const timeSlot = useFiltersStore((s) => s.timeSlot);` :

```ts
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
```

Remplacer les deux blocs `// Filter by specific date (day strip)` et `// Filter by time slot` par :

```ts
    if (ceSoirMode) {
      // "Ce soir" overlay: today only, from max(18:00, now). Replaces selectedDate/timeSlot.
      const today = localISODate();
      const now = nowHHMM();
      const minStart = now > '18:00' ? now : '18:00';
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter(
            (st) => st.datetime.slice(0, 10) === today && st.time >= minStart,
          ),
        }))
        .filter((film) => film.showtimes.length > 0);
    } else {
      // Filter by specific date (day strip)
      if (selectedDate) {
        result = result
          .map((film) => ({
            ...film,
            showtimes: film.showtimes.filter((st) => st.datetime.slice(0, 10) === selectedDate),
          }))
          .filter((film) => film.showtimes.length > 0);
      }

      // Filter by time slot
      if (timeSlot !== 'all') {
        result = result
          .map((film) => ({
            ...film,
            showtimes: film.showtimes.filter((st) => matchesTimeSlot(st.time, timeSlot)),
          }))
          .filter((film) => film.showtimes.length > 0);
      }
    }
```

Mettre à jour les dépendances du `useMemo` (ajouter `ceSoirMode`) :

```ts
  }, [films, searchQuery, selectedCinemas, version, minTime, minRating, sort, selectedDate, timeSlot, minAge, ceSoirMode]);
```

Mettre à jour `activeFilterCount` (le tag créneau est masqué pendant le mode, cf. spec) :

```ts
  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCinemas.length > 0 ? 1 : 0) +
    (version ? 1 : 0) +
    (ceSoirMode ? 1 : 0) +
    (!ceSoirMode && timeSlot !== 'all' ? 1 : 0) +
    (minAge > 0 ? 1 : 0) +
    (minTime ? 1 : 0) +
    (minRating !== null ? 1 : 0);
```

- [ ] **Step 3: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/dates.ts reeltime-v2/apps/web/src/hooks/useFilteredFilms.ts
git commit -m "feat(web): overlay Ce soir dans useFilteredFilms"
```

---

### Task 3: Bouton « Ce soir » sur la home + DayStrip + désactivation au changement de semaine

**Files:**
- Modify: `reeltime-v2/apps/web/src/pages/HomePage.tsx`

**Interfaces:**
- Consumes: `ceSoirMode`/`setCeSoirMode` (Task 1), `goToToday` de `useWeekNavigation`, `localISODate` de `utils/dates`.
- Produces: comportement UI complet du mode (activation, re-tap, retour semaine courante, DayStrip « Aujourd'hui » sélectionné visuellement).

**⚠ Piège d'ordre (spec §1)** : l'activation depuis une autre semaine fait `goToToday()` **puis** `setCeSoirMode(true)`. L'effet de désactivation ne doit se déclencher **que** quand `weekOffset` devient ≠ 0, sinon il annulerait cette activation.

- [ ] **Step 1: Imports et sélecteurs**

Ajouter à l'import existant de `utils/dates` :

```ts
import { weekDatesFrom, localISODate } from '../utils/dates';
```

Dans le corps de `HomePage`, après `const setViewMode = useFiltersStore((s) => s.setViewMode);` :

```ts
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
  const today = localISODate();
```

- [ ] **Step 2: Désactivation au changement de semaine (uniquement vers ≠ courante)**

Remplacer l'effet existant :

```ts
  // A specific day only makes sense within the week it was picked in
  useEffect(() => {
    setSelectedDate(null);
  }, [weekOffset, setSelectedDate]);
```

par :

```ts
  // A specific day only makes sense within the week it was picked in.
  // "Ce soir" only turns off when leaving the current week: activating it from
  // another week sets weekOffset back to 0, which must NOT deactivate it.
  useEffect(() => {
    setSelectedDate(null);
    if (weekOffset !== 0) setCeSoirMode(false);
  }, [weekOffset, setSelectedDate, setCeSoirMode]);
```

- [ ] **Step 3: Bouton « Ce soir » + DayStrip**

Remplacer tout le bloc `{/* Day strip + view mode toggle */}` par :

```tsx
      {/* Day strip + Ce soir + view mode toggle */}
      {!isLoading && !isError && hasFilms && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
          <div className="flex-1 min-w-0">
            <DayStrip
              dates={weekDates}
              value={ceSoirMode ? today : selectedDate}
              onChange={(d) => {
                setCeSoirMode(false);
                setSelectedDate(d);
              }}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => {
                if (ceSoirMode) {
                  setCeSoirMode(false);
                } else {
                  goToToday();
                  setCeSoirMode(true);
                }
              }}
              aria-pressed={ceSoirMode}
              className={`font-bebas px-3 py-1.5 rounded-lg border-2 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
                ceSoirMode
                  ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
                  : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
              }`}
            >
              🌙 Ce soir
            </button>
            <div className="flex rounded-lg border-2 border-sepia-chaud overflow-hidden">
              {([
                ['grid', 'Affiche'],
                ['planning', 'Planning'],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  aria-pressed={viewMode === mode}
                  className={`font-bebas px-3 py-1.5 text-xs sm:text-sm uppercase tracking-wide transition-colors ${
                    viewMode === mode
                      ? 'bg-rouge-cinema text-creme-ecran'
                      : 'bg-creme-ecran text-noir-velours hover:bg-or-antique/20'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
```

(Le toggle Affiche/Planning est inchangé ; seul le wrapper extérieur perd `shrink-0 ... self-start` au profit du conteneur commun.)

- [ ] **Step 4: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): bouton Ce soir sur la home"
```

---

### Task 4: Tag « Ce soir » dans la barre de filtres

**Files:**
- Modify: `reeltime-v2/apps/web/src/components/filters/FilterBar.tsx`

**Interfaces:**
- Consumes: `ceSoirMode`/`setCeSoirMode` (Task 1).
- Produces: tag supprimable « Ce soir » en **première position** des tags actifs ; le tag créneau (`timeSlot`) est masqué pendant le mode (spec : « prioritaire sur les tags jour/créneau »).

- [ ] **Step 1: Sélecteurs**

Après `const resetAll = useFiltersStore((s) => s.resetAll);` :

```ts
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
  const setCeSoirMode = useFiltersStore((s) => s.setCeSoirMode);
```

- [ ] **Step 2: Tags**

Remplacer :

```ts
  // Build active filter tags
  const activeTags: { label: string; onRemove: () => void }[] = [];

  if (version !== null) {
```

par :

```ts
  // Build active filter tags — « Ce soir » first, and it hides the timeSlot tag
  const activeTags: { label: string; onRemove: () => void }[] = [];

  if (ceSoirMode) {
    activeTags.push({ label: 'Ce soir', onRemove: () => setCeSoirMode(false) });
  }
  if (version !== null) {
```

Et remplacer :

```ts
  if (timeSlot !== 'all') {
    activeTags.push({ label: TIME_LABELS[timeSlot] ?? timeSlot, onRemove: () => setTimeSlot('all') });
  }
```

par :

```ts
  if (!ceSoirMode && timeSlot !== 'all') {
    activeTags.push({ label: TIME_LABELS[timeSlot] ?? timeSlot, onRemove: () => setTimeSlot('all') });
  }
```

(`resetAll` — le bouton « Tout effacer » des tags — désactive déjà le mode grâce à la Task 1.)

- [ ] **Step 3: Vérifier compilation + build (jalon fin de « Ce soir »)**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit` puis `npx vite build`
Expected: aucune erreur, build OK.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/components/filters/FilterBar.tsx
git commit -m "feat(web): tag Ce soir dans la barre de filtres"
```

---

### Task 5: Store persisté `soireeStore`

**Files:**
- Create: `reeltime-v2/apps/web/src/stores/soireeStore.ts`
- Modify: `reeltime-v2/apps/web/src/stores/index.ts`

**Interfaces:**
- Consumes: `formatDayShort` de `utils/dates`, types `FilmListItem`/`ShowtimeEntry` de `types/components`.
- Produces (utilisés par les Tasks 6-12) :
  - `interface SoireeItem` (snapshot, champs exacts ci-dessous).
  - `useSoireeStore` : état `{ date: string | null; items: SoireeItem[] }` + actions `add(item)`, `remove(showtimeId: string)`, `clear()`, `replaceAll(items: SoireeItem[])`, `purgeExpired(today: string)`.
  - `makeSoireeItem(film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>, st: ShowtimeEntry, city: string | undefined): SoireeItem`
  - `addToSoiree(item: SoireeItem): void` — dédup par `showtimeId`, confirmation `window.confirm` si date différente (accepter = vider et repartir sur la nouvelle date), tri chrono auto.
  - `replaceSoiree(items: SoireeItem[]): void` — remplace le plan courant (combos) ; confirmation seulement si un plan d'une **autre** date existe.

- [ ] **Step 1: Créer `soireeStore.ts`**

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { formatDayShort } from '../utils/dates';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** Snapshot d'une séance : le plan reste affichable même si les données de la semaine changent. */
export interface SoireeItem {
  showtimeId: string;
  filmId: string;
  title: string;
  posterUrl: string | null;
  runtime: number | null;
  time: string;
  date: string;
  cinemaId: string;
  cinemaName: string;
  city: string;
  version: string | null;
  bookingUrl: string | null;
}

interface SoireeState {
  /** Un seul plan, une seule date (null = plan vide). */
  date: string | null;
  items: SoireeItem[];
  add: (item: SoireeItem) => void;
  remove: (showtimeId: string) => void;
  clear: () => void;
  replaceAll: (items: SoireeItem[]) => void;
  purgeExpired: (today: string) => void;
}

function sortChrono(items: SoireeItem[]): SoireeItem[] {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

export const useSoireeStore = create<SoireeState>()(
  persist(
    (set) => ({
      date: null,
      items: [],
      add: (item) =>
        set((state) => {
          if (state.items.some((i) => i.showtimeId === item.showtimeId)) return state;
          return { date: item.date, items: sortChrono([...state.items, item]) };
        }),
      remove: (showtimeId) =>
        set((state) => {
          const items = state.items.filter((i) => i.showtimeId !== showtimeId);
          return { items, date: items.length > 0 ? state.date : null };
        }),
      clear: () => set({ date: null, items: [] }),
      replaceAll: (items) => set({ date: items[0]?.date ?? null, items: sortChrono(items) }),
      purgeExpired: (today) =>
        set((state) => (state.date && state.date < today ? { date: null, items: [] } : state)),
    }),
    {
      name: 'reeltime-soiree',
      partialize: (state) => ({ date: state.date, items: state.items }),
    },
  ),
);

export function makeSoireeItem(
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>,
  st: ShowtimeEntry,
  city: string | undefined,
): SoireeItem {
  return {
    showtimeId: st.id,
    filmId: film.id,
    title: film.title,
    posterUrl: film.posterUrl,
    runtime: film.runtime,
    time: st.time,
    date: st.datetime.slice(0, 10),
    cinemaId: st.cinemaId,
    cinemaName: st.cinemaName,
    city: city ?? '',
    version: st.version ?? null,
    bookingUrl: st.bookingUrl,
  };
}

/** Ajout avec règles : dédup, confirmation si le plan est sur une autre date. */
export function addToSoiree(item: SoireeItem): void {
  const { date, items, add, replaceAll } = useSoireeStore.getState();
  if (items.some((i) => i.showtimeId === item.showtimeId)) return;
  if (date && date !== item.date) {
    if (!window.confirm(`Remplacer la soirée du ${formatDayShort(date)} ?`)) return;
    replaceAll([item]);
    return;
  }
  add(item);
}

/** « Utiliser ce combo » : remplace le plan courant ; confirmation seulement si autre date. */
export function replaceSoiree(items: SoireeItem[]): void {
  const { date, replaceAll } = useSoireeStore.getState();
  const newDate = items[0]?.date;
  if (date && newDate && date !== newDate) {
    if (!window.confirm(`Remplacer la soirée du ${formatDayShort(date)} ?`)) return;
  }
  replaceAll(items);
}
```

- [ ] **Step 2: Barrel `stores/index.ts`**

```ts
export { useFiltersStore } from './filtersStore';
export { useSoireeStore, addToSoiree, replaceSoiree, makeSoireeItem } from './soireeStore';
export type { SoireeItem } from './soireeStore';
```

- [ ] **Step 3: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/stores/soireeStore.ts reeltime-v2/apps/web/src/stores/index.ts
git commit -m "feat(web): store persiste Ma soiree"
```

---

### Task 6: Composant `AddToSoireeButton`

**Files:**
- Create: `reeltime-v2/apps/web/src/components/soiree/AddToSoireeButton.tsx`
- Modify: `reeltime-v2/apps/web/src/components/index.ts`

**Interfaces:**
- Consumes: `useSoireeStore`, `addToSoiree`, `makeSoireeItem` (Task 5).
- Produces: `<AddToSoireeButton film showtime city className? label? />` — bouton « + » (ou « + label ») qui passe en état ✓ désactivé quand la séance est déjà dans le plan. Props :
  - `film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>`
  - `showtime: ShowtimeEntry`
  - `city: string | undefined`
  - `className?: string` (padding/typo selon le contexte)
  - `label?: string` (variante texte, ex. « Ajouter cette séance »)

- [ ] **Step 1: Créer le composant**

```tsx
import { useSoireeStore, addToSoiree, makeSoireeItem } from '../../stores/soireeStore';
import type { FilmListItem, ShowtimeEntry } from '../../types/components';

interface AddToSoireeButtonProps {
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  showtime: ShowtimeEntry;
  city: string | undefined;
  /** Contexte : padding / typo additionnels. */
  className?: string;
  /** Variante avec texte (ex. « Ajouter cette séance »). Sans label : icône seule. */
  label?: string;
}

export function AddToSoireeButton({ film, showtime, city, className = '', label }: AddToSoireeButtonProps) {
  const added = useSoireeStore((s) => s.items.some((i) => i.showtimeId === showtime.id));

  return (
    <button
      type="button"
      disabled={added}
      onClick={() => addToSoiree(makeSoireeItem(film, showtime, city))}
      title={added ? 'Déjà dans ma soirée' : 'Ajouter à ma soirée'}
      aria-label={
        added
          ? `${film.title} à ${showtime.time} est déjà dans ma soirée`
          : `Ajouter ${film.title} à ${showtime.time} à ma soirée`
      }
      className={`flex items-center justify-center gap-1.5 rounded-md border-2 transition-colors ${
        added
          ? 'border-or-antique bg-or-antique/20 text-sepia-chaud cursor-default'
          : 'border-sepia-chaud bg-beige-papier text-sepia-chaud hover:text-rouge-cinema hover:border-rouge-cinema'
      } ${className}`}
    >
      {added ? (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
        </svg>
      )}
      {label && <span>{label}</span>}
    </button>
  );
}
```

- [ ] **Step 2: Barrel `components/index.ts`**

Ajouter à la fin :

```ts
export { AddToSoireeButton } from './soiree/AddToSoireeButton';
```

- [ ] **Step 3: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur (le composant n'est pas encore utilisé — c'est normal).

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/components/soiree/AddToSoireeButton.tsx reeltime-v2/apps/web/src/components/index.ts
git commit -m "feat(web): bouton d'ajout a Ma soiree"
```

---

### Task 7: Barre « Ma soirée » + montage dans `Layout`

**Files:**
- Create: `reeltime-v2/apps/web/src/components/soiree/SoireeBar.tsx`
- Modify: `reeltime-v2/apps/web/src/components/layout/Layout.tsx`
- Modify: `reeltime-v2/apps/web/src/components/index.ts`
- Modify: `reeltime-v2/apps/web/src/pages/HomePage.tsx` (offset du ScrollToTopButton)

**Interfaces:**
- Consumes: `useSoireeStore` (Task 5), `estimatedEnd`/`toMinutes`/`formatClock`/`formatGap`/`OVERLAP_TOLERANCE_MIN` de `utils/chaining`, `formatDayShort`/`localISODate`/`nowHHMM` de `utils/dates`, `getCinemaShortName`.
- Produces: `<SoireeBar />` auto-suffisante (aucune prop), masquée si plan vide. Purge du plan expiré au montage. Les suggestions avant/après arrivent en Task 8 (la structure prévoit leur emplacement).

**Comportement (spec §2)** :
- Repliée (défaut) : `🎟 Ma soirée · mar. 8 · 2 films · 18h10 → ~22h35` (début de la 1ʳᵉ séance → fin estimée de la dernière, « ~ » si durée inconnue) + chevron.
- Dépliée : timeline (mini-affiche, titre, `18h10 → 20h25`, cinéma court, version si ≠ VF, lien « Réserver » si dispo, ✕) ; entre deux séances le battement via `formatGap`, **en rouge si chevauchement > `OVERLAP_TOLERANCE_MIN`** ; « ⚠ villes différentes » si villes multiples ; séance passée (aujourd'hui, heure < maintenant) grisée ; bouton « Tout effacer ».
- Mobile : pleine largeur en bas, `pb-[env(safe-area-inset-bottom)]` (le viewport a déjà `viewport-fit=cover`). Desktop (`sm:`) : panneau flottant bas-droite, largeur ~28rem.

- [ ] **Step 1: Créer `SoireeBar.tsx`**

```tsx
import { useEffect, useState } from 'react';
import { useSoireeStore, type SoireeItem } from '../../stores/soireeStore';
import {
  estimatedEnd,
  toMinutes,
  formatClock,
  formatGap,
  OVERLAP_TOLERANCE_MIN,
} from '../../utils/chaining';
import { formatDayShort, localISODate, nowHHMM } from '../../utils/dates';
import { getCinemaShortName } from '../../utils/cinemaNames';

const NO_POSTER = '/images/no-poster.svg';

/** "18:10" -> "18h10" */
function timeLabel(time: string): string {
  return time.replace(':', 'h');
}

/** Fin estimée "~20h25" (préfixe ~ si durée inconnue). */
function endLabel(item: SoireeItem): string {
  const end = estimatedEnd(toMinutes(item.time), item.runtime);
  return `${item.runtime == null ? '~' : ''}${formatClock(end)}`;
}

function GapRow({ prev, next }: { prev: SoireeItem; next: SoireeItem }) {
  const gap = toMinutes(next.time) - estimatedEnd(toMinutes(prev.time), prev.runtime);
  const overlap = gap < -OVERLAP_TOLERANCE_MIN;
  return (
    <p
      className={`font-crimson text-xs italic pl-12 py-0.5 ${
        overlap ? 'text-rouge-cinema font-semibold' : 'text-sepia-chaud'
      }`}
    >
      ↓ {formatGap(gap)}
      {prev.runtime == null ? ' (durée estimée)' : ''}
    </p>
  );
}

function ItemRow({ item, past, onRemove }: { item: SoireeItem; past: boolean; onRemove: () => void }) {
  return (
    <div
      className={`flex items-center gap-2.5 bg-creme-ecran border border-sepia-chaud/50 rounded-lg p-2 ${
        past ? 'opacity-50' : ''
      }`}
    >
      <img
        src={item.posterUrl ?? NO_POSTER}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-9 h-[54px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
        onError={(e) => { e.currentTarget.src = NO_POSTER; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-playfair font-bold text-noir-velours text-sm leading-tight truncate">
          {item.title}
        </p>
        <p className="font-bebas text-xs text-noir-velours tracking-wide">
          {timeLabel(item.time)} <span className="text-sepia-chaud">→ {endLabel(item)}</span>
          <span className="text-sepia-chaud"> · {getCinemaShortName(item.cinemaName)}</span>
          {item.version && item.version !== 'VF' && (
            <span className="text-sepia-chaud"> · {item.version}</span>
          )}
        </p>
        {item.bookingUrl && (
          <a
            href={item.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-crimson text-xs text-rouge-cinema underline hover:text-bordeaux-profond"
          >
            Réserver
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Retirer ${item.title} de ma soirée`}
        className="w-7 h-7 flex items-center justify-center text-sepia-chaud hover:text-rouge-cinema rounded-full hover:bg-beige-papier transition-colors shrink-0"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function SoireeBar() {
  const date = useSoireeStore((s) => s.date);
  const items = useSoireeStore((s) => s.items);
  const remove = useSoireeStore((s) => s.remove);
  const clear = useSoireeStore((s) => s.clear);
  const purgeExpired = useSoireeStore((s) => s.purgeExpired);
  const [expanded, setExpanded] = useState(false);

  // Auto-expiration : purge au montage de l'app si le plan date d'hier ou avant.
  useEffect(() => {
    purgeExpired(localISODate());
  }, [purgeExpired]);

  if (items.length === 0 || !date) return null;

  const today = localISODate();
  const now = nowHHMM();
  const multiCity = new Set(items.map((i) => i.city).filter((c) => c !== '')).size > 1;
  const first = items[0];
  const last = items[items.length - 1];

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[28rem] sm:max-w-[calc(100vw-2rem)]">
      <div className="bg-beige-papier border-t-2 sm:border-2 border-sepia-chaud sm:rounded-xl shadow-2xl pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left"
        >
          <span className="font-bebas text-noir-velours text-sm uppercase tracking-wide truncate">
            🎟 Ma soirée · {formatDayShort(date)} · {items.length} film{items.length > 1 ? 's' : ''} ·{' '}
            {timeLabel(first.time)} → {endLabel(last)}
            {multiCity && <span className="text-rouge-cinema"> ⚠</span>}
          </span>
          <svg
            className={`w-5 h-5 text-sepia-chaud shrink-0 transform transition-transform ${
              expanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>

        {expanded && (
          <div className="px-3 pb-3 max-h-[55vh] overflow-y-auto border-t border-sepia-chaud/30 pt-2 space-y-1.5">
            {multiCity && (
              <p className="font-crimson text-xs italic text-rouge-cinema">⚠ villes différentes</p>
            )}

            {/* Task 8 : section « + un film avant » ici */}

            {items.map((item, idx) => (
              <div key={item.showtimeId}>
                {idx > 0 && <GapRow prev={items[idx - 1]} next={item} />}
                <ItemRow
                  item={item}
                  past={item.date === today && item.time < now}
                  onRemove={() => remove(item.showtimeId)}
                />
              </div>
            ))}

            {/* Task 8 : section « + un film après » ici */}

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={clear}
                className="font-bebas text-xs text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
              >
                Tout effacer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Monter dans `Layout.tsx` + padding conditionnel**

Remplacer le fichier entier :

```tsx
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastProvider } from '../ui/Toast';
import { SoireeBar } from '../soiree/SoireeBar';
import { useSoireeStore } from '../../stores/soireeStore';

export function Layout() {
  const hasPlan = useSoireeStore((s) => s.items.length > 0);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* padding-bottom quand la barre Ma soirée est visible : aucun contenu masqué */}
        <main className={`flex-1${hasPlan ? ' pb-24' : ''}`}>
          <Outlet />
        </main>
        <Footer />
        <SoireeBar />
      </div>
    </ToastProvider>
  );
}
```

- [ ] **Step 3: Barrel `components/index.ts`**

Ajouter :

```ts
export { SoireeBar } from './soiree/SoireeBar';
```

- [ ] **Step 4: Remonter le ScrollToTopButton quand la barre est visible**

Dans `HomePage.tsx`, ajouter l'import :

```ts
import { useSoireeStore } from '../stores/soireeStore';
```

Dans le composant interne `ScrollToTopButton`, après `const [showScrollTop, setShowScrollTop] = useState(false);` :

```ts
  const hasPlan = useSoireeStore((s) => s.items.length > 0);
```

Et remplacer dans son `className` le fragment `fixed bottom-4 right-4 md:bottom-8 md:right-8` par :

```tsx
className={`fixed ${hasPlan ? 'bottom-20 md:bottom-24' : 'bottom-4 md:bottom-8'} right-4 md:right-8 bg-rouge-cinema hover:bg-bordeaux-profond text-creme-ecran p-3 md:p-4 rounded-full shadow-lg transition-opacity duration-300 z-50 border-2 border-or-antique ${
  showScrollTop ? 'opacity-100' : 'opacity-0 pointer-events-none'
}`}
```

- [ ] **Step 5: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add reeltime-v2/apps/web/src/components/soiree/SoireeBar.tsx reeltime-v2/apps/web/src/components/layout/Layout.tsx reeltime-v2/apps/web/src/components/index.ts reeltime-v2/apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): barre Ma soiree montee dans le layout"
```

---

### Task 8: Suggestions « + un film avant / après » dans la barre

**Files:**
- Modify: `reeltime-v2/apps/web/src/utils/chaining.ts:39-45`
- Modify: `reeltime-v2/apps/web/src/components/soiree/SoireeBar.tsx`

**Interfaces:**
- Consumes: `findChainable` (assoupli ci-dessous), `useFilms(0)`, `useCinemas`, `weekDatesFrom`, `addToSoiree`/`makeSoireeItem` (Task 5).
- Produces: sections « + un film avant » (au-dessus de la timeline, ancrée sur la 1ʳᵉ séance) et « + un film après » (en dessous, ancrée sur la dernière), 5 meilleurs candidats, tap = ajout direct. Sections absentes si les données de la semaine courante ne couvrent pas la date du plan, ou si aucun candidat.

- [ ] **Step 1: Assouplir le type d'ancre de `findChainable`**

Dans `utils/chaining.ts`, remplacer :

```ts
interface FindChainableOptions {
  films: FilmListItem[];
  anchorFilm: FilmListItem;
  anchor: ShowtimeEntry;
  direction: 'before' | 'after';
  cityOf: (cinemaId: string) => string | undefined;
}
```

par :

```ts
interface FindChainableOptions {
  films: FilmListItem[];
  /** Seuls id et runtime sont lus — permet d'ancrer sur un snapshot « Ma soirée ». */
  anchorFilm: Pick<FilmListItem, 'id' | 'runtime'>;
  anchor: ShowtimeEntry;
  direction: 'before' | 'after';
  cityOf: (cinemaId: string) => string | undefined;
}
```

(Aucun autre changement : `findChainable` ne lit que `anchorFilm.id` et `anchorFilm.runtime` ; `SequencePanel` qui passe un `FilmListItem` complet reste compatible.)

- [ ] **Step 2: Ajouter les suggestions dans `SoireeBar.tsx`**

Remplacer les imports du haut du fichier par :

```tsx
import { useEffect, useMemo, useState } from 'react';
import { useSoireeStore, addToSoiree, makeSoireeItem, type SoireeItem } from '../../stores/soireeStore';
import { useFilms } from '../../hooks/useFilms';
import { useCinemas } from '../../hooks/useCinemas';
import {
  estimatedEnd,
  toMinutes,
  formatClock,
  formatGap,
  findChainable,
  OVERLAP_TOLERANCE_MIN,
  type ChainCandidate,
} from '../../utils/chaining';
import { formatDayShort, localISODate, nowHHMM, weekDatesFrom } from '../../utils/dates';
import { getCinemaShortName } from '../../utils/cinemaNames';
import type { ShowtimeEntry } from '../../types/components';
```

Ajouter après la fonction `endLabel` :

```tsx
/** Reconstruit une ShowtimeEntry depuis un snapshot pour ancrer findChainable. */
function toShowtimeEntry(item: SoireeItem): ShowtimeEntry {
  return {
    id: item.showtimeId,
    filmId: item.filmId,
    cinemaId: item.cinemaId,
    cinemaName: item.cinemaName,
    datetime: `${item.date}T${item.time}:00`,
    time: item.time,
    version: (item.version ?? 'VF') as ShowtimeEntry['version'],
    bookingUrl: item.bookingUrl,
  };
}

function SuggestionRow({ candidate, city }: { candidate: ChainCandidate; city: string | undefined }) {
  const { film, showtime, gapMin, sameCinema } = candidate;
  return (
    <button
      type="button"
      onClick={() => addToSoiree(makeSoireeItem(film, showtime, city))}
      className="w-full text-left flex items-center gap-2.5 bg-creme-ecran border border-sepia-chaud/50 rounded-lg p-1.5 hover:border-rouge-cinema transition-colors"
    >
      <img
        src={film.posterUrl ?? NO_POSTER}
        alt=""
        loading="lazy"
        decoding="async"
        className="w-7 h-[42px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
        onError={(e) => { e.currentTarget.src = NO_POSTER; }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-playfair font-bold text-noir-velours text-xs leading-tight truncate">
          {film.title}
        </p>
        <p className="font-crimson text-[11px] italic text-sepia-chaud truncate">
          {timeLabel(showtime.time)} · {getCinemaShortName(showtime.cinemaName)} · {formatGap(gapMin)}
          {sameCinema ? ' · même ciné' : ''}
        </p>
      </div>
      <svg className="w-4 h-4 text-sepia-chaud shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>
  );
}
```

Dans le composant `SoireeBar`, après `const [expanded, setExpanded] = useState(false);` :

```tsx
  // La barre lit useFilms(0) + useCinemas elle-même (React Query déduplique avec les pages).
  const { data } = useFilms(0);
  const { data: cinemas = [] } = useCinemas();

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);

  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );

  const inPlan = useMemo(() => new Set(items.map((i) => i.showtimeId)), [items]);

  const cityOf = (cinemaId: string) => cityByCinemaId.get(cinemaId);

  // Sections absentes si les données de la semaine ne couvrent pas la date du plan
  // (gardes en tête de memo pour que TypeScript rétrécisse `data` et `date`).
  const before = useMemo(() => {
    if (!data || !date || !weekDates.includes(date) || items.length === 0) return [];
    const anchor = items[0];
    return findChainable({
      films: data.films,
      anchorFilm: { id: anchor.filmId, runtime: anchor.runtime },
      anchor: toShowtimeEntry(anchor),
      direction: 'before',
      cityOf: (id) => cityByCinemaId.get(id),
    })
      .filter((c) => !inPlan.has(c.showtime.id))
      .slice(0, 5);
  }, [data, date, weekDates, items, cityByCinemaId, inPlan]);

  const after = useMemo(() => {
    if (!data || !date || !weekDates.includes(date) || items.length === 0) return [];
    const anchor = items[items.length - 1];
    return findChainable({
      films: data.films,
      anchorFilm: { id: anchor.filmId, runtime: anchor.runtime },
      anchor: toShowtimeEntry(anchor),
      direction: 'after',
      cityOf: (id) => cityByCinemaId.get(id),
    })
      .filter((c) => !inPlan.has(c.showtime.id))
      .slice(0, 5);
  }, [data, date, weekDates, items, cityByCinemaId, inPlan]);
```

**Attention aux règles des hooks** : ces `useMemo` doivent être placés **avant** le `if (items.length === 0 || !date) return null;` (tous les hooks avant tout return conditionnel).

Puis remplacer le commentaire `{/* Task 8 : section « + un film avant » ici */}` par :

```tsx
            {before.length > 0 && (
              <div>
                <h6 className="font-bebas text-noir-velours text-xs uppercase tracking-wider mb-1">
                  + un film avant
                </h6>
                <div className="space-y-1.5">
                  {before.map((c) => (
                    <SuggestionRow key={c.showtime.id} candidate={c} city={cityOf(c.showtime.cinemaId)} />
                  ))}
                </div>
              </div>
            )}
```

Et `{/* Task 8 : section « + un film après » ici */}` par :

```tsx
            {after.length > 0 && (
              <div>
                <h6 className="font-bebas text-noir-velours text-xs uppercase tracking-wider mb-1">
                  + un film après
                </h6>
                <div className="space-y-1.5">
                  {after.map((c) => (
                    <SuggestionRow key={c.showtime.id} candidate={c} city={cityOf(c.showtime.cinemaId)} />
                  ))}
                </div>
              </div>
            )}
```

- [ ] **Step 3: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/chaining.ts reeltime-v2/apps/web/src/components/soiree/SoireeBar.tsx
git commit -m "feat(web): suggestions avant/apres dans la barre Ma soiree"
```

---

### Task 9: Point d'entrée « + » — `FilmShowtimes` (drawer film)

**Files:**
- Modify: `reeltime-v2/apps/web/src/components/FilmShowtimes.tsx`
- Modify: `reeltime-v2/apps/web/src/components/FilmDrawer.tsx`

**Interfaces:**
- Consumes: `AddToSoireeButton` (Task 6).
- Produces: `FilmShowtimesProps` gagne `film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>` (requis) et `cityOf?: (cinemaId: string) => string | undefined`. Un « + » à côté de chaque pastille horaire, au même niveau que le bouton chaîne, affiché seulement si `cityOf` est fourni.

- [ ] **Step 1: `FilmShowtimes.tsx` — props et bouton**

Ajouter les imports :

```ts
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { AddToSoireeButton } from './soiree/AddToSoireeButton';
```

(remplace l'import type existant de `ShowtimeEntry`.)

Remplacer l'interface :

```ts
interface FilmShowtimesProps {
  showtimes: ShowtimeEntry[];
  /** Le film parent (snapshot pour « Ma soirée »). */
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  /** When provided, each showtime gets a "chain with another film" button. */
  onChain?: (st: ShowtimeEntry) => void;
  /** When provided, each showtime gets a "+ Ma soirée" button. */
  cityOf?: (cinemaId: string) => string | undefined;
}
```

Et la signature :

```ts
export function FilmShowtimes({ showtimes, film, onChain, cityOf }: FilmShowtimesProps) {
```

Dans le rendu des pastilles, après le bloc `{onChain && (...)}` (à l'intérieur du `<span key={st.id} className="inline-flex items-stretch gap-1">`) :

```tsx
                              {cityOf && (
                                <AddToSoireeButton
                                  film={film}
                                  showtime={st}
                                  city={cityOf(st.cinemaId)}
                                  className="px-1.5"
                                />
                              )}
```

- [ ] **Step 2: `FilmDrawer.tsx` — passer les nouvelles props**

Dans `BottomSheet`, remplacer :

```tsx
              <FilmShowtimes
                showtimes={film.showtimes}
                onChain={chainEnabled ? setChainAnchor : undefined}
              />
```

par :

```tsx
              <FilmShowtimes
                showtimes={film.showtimes}
                film={film}
                onChain={chainEnabled ? setChainAnchor : undefined}
                cityOf={cityOf}
              />
```

- [ ] **Step 3: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/components/FilmShowtimes.tsx reeltime-v2/apps/web/src/components/FilmDrawer.tsx
git commit -m "feat(web): ajout a Ma soiree depuis le drawer film"
```

---

### Task 10: Point d'entrée « + » — `SequencePanel`

**Files:**
- Modify: `reeltime-v2/apps/web/src/components/SequencePanel.tsx`

**Interfaces:**
- Consumes: `AddToSoireeButton` (Task 6).
- Produces: « + » sur chaque candidat avant/après, bouton « Ajouter cette séance » pour la séance d'ancrage.

**⚠ Restructuration** : `CandidateRow` est actuellement un `<button>` racine — on ne peut pas y imbriquer le « + ». La racine devient un `<div>` avec deux boutons frères.

- [ ] **Step 1: Import**

```ts
import { AddToSoireeButton } from './soiree/AddToSoireeButton';
```

- [ ] **Step 2: Restructurer `CandidateRow`**

Remplacer la fonction `CandidateRow` entière par :

```tsx
function CandidateRow({
  candidate,
  city,
  onClick,
}: {
  candidate: ChainCandidate;
  city: string | undefined;
  onClick: () => void;
}) {
  const { film, showtime, gapMin, sameCinema, approx } = candidate;
  return (
    <div className="flex items-stretch gap-1.5">
      <button
        type="button"
        onClick={onClick}
        className="flex-1 min-w-0 text-left bg-creme-ecran border-2 border-sepia-chaud rounded-lg p-2 flex gap-3 items-center hover:border-rouge-cinema transition-colors"
      >
        <img
          src={film.posterUrl ?? NO_POSTER}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-10 h-[60px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
          onError={(e) => { e.currentTarget.src = NO_POSTER; }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-playfair font-bold text-noir-velours text-sm leading-tight truncate">
            {film.title}
          </p>
          <p className="font-bebas text-xs text-noir-velours mt-0.5 tracking-wide">
            {showtime.time}
            <span className="text-sepia-chaud"> · {getCinemaShortName(showtime.cinemaName)}</span>
            {showtime.version && showtime.version !== 'VF' && (
              <span className="text-sepia-chaud"> · {showtime.version}</span>
            )}
          </p>
          <p className="font-crimson text-xs italic text-sepia-chaud">
            {formatGap(gapMin)}
            {approx ? ' (durée estimée)' : ''}
            {sameCinema ? ' · même cinéma' : ''}
          </p>
        </div>
      </button>
      <AddToSoireeButton film={film} showtime={showtime} city={city} className="px-2" />
    </div>
  );
}
```

- [ ] **Step 3: Bouton d'ancrage + passage de `city` aux candidats**

Dans `SequencePanel`, après le paragraphe `<p className="font-crimson text-sm text-sepia-chaud italic mb-4">...fin estimée {endStr}</p>`, ajouter :

```tsx
      <AddToSoireeButton
        film={anchorFilm}
        showtime={anchor}
        city={cityOf(anchor.cinemaId)}
        label="Ajouter cette séance"
        className="px-3 py-1.5 mb-5 font-bebas text-xs uppercase tracking-wide"
      />
```

Et remplacer les deux rendus de candidats :

```tsx
          {after.map((c) => (
            <CandidateRow key={c.showtime.id} candidate={c} onClick={() => onFilmClick(c.film)} />
          ))}
```

par :

```tsx
          {after.map((c) => (
            <CandidateRow
              key={c.showtime.id}
              candidate={c}
              city={cityOf(c.showtime.cinemaId)}
              onClick={() => onFilmClick(c.film)}
            />
          ))}
```

(idem pour le bloc `before.map`).

- [ ] **Step 4: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/src/components/SequencePanel.tsx
git commit -m "feat(web): ajout a Ma soiree depuis le panneau enchainement"
```

---

### Task 11: Point d'entrée « + » — `PlanningView`

**Files:**
- Modify: `reeltime-v2/apps/web/src/components/PlanningView.tsx`
- Modify: `reeltime-v2/apps/web/src/pages/HomePage.tsx` (passer `cityOf`)

**Interfaces:**
- Consumes: `AddToSoireeButton` (Task 6), `cityOf` déjà calculé dans `HomePage`.
- Produces: `PlanningViewProps` gagne `cityOf: (cinemaId: string) => string | undefined`. Un « + » sur chaque chip de séance.

**⚠ Restructuration** : les chips sont actuellement DANS un `<button>` pleine ligne (boutons imbriqués interdits). La ligne devient un `<div>` : la zone affiche + titre devient le bouton d'ouverture du drawer, les chips (avec leur « + ») deviennent des frères.

- [ ] **Step 1: Import et prop**

```ts
import { AddToSoireeButton } from './soiree/AddToSoireeButton';
```

Interface :

```ts
interface PlanningViewProps {
  films: FilmListItem[];
  /** The 7 dates (YYYY-MM-DD) of the displayed week. */
  dates: string[];
  cityOf: (cinemaId: string) => string | undefined;
  onFilmClick: (film: FilmListItem) => void;
}
```

Signature :

```ts
export function PlanningView({ films, dates, cityOf, onFilmClick }: PlanningViewProps) {
```

- [ ] **Step 2: Restructurer la ligne**

Remplacer le bloc `{entries.map(({ film, showtimes }) => ( <button ...>...</button> ))}` par :

```tsx
              {entries.map(({ film, showtimes }) => (
                <div
                  key={`${date}-${film.id}`}
                  className="bg-creme-ecran border-2 border-sepia-chaud rounded-lg p-2 sm:p-3 hover:border-rouge-cinema transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onFilmClick(film)}
                    className="w-full text-left flex gap-3"
                  >
                    <img
                      src={film.posterUrl ?? NO_POSTER}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-[72px] sm:w-14 sm:h-[84px] object-cover rounded shadow flex-shrink-0 border border-sepia-chaud/50 bg-beige-papier"
                      onError={(e) => { e.currentTarget.src = NO_POSTER; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="font-playfair font-bold text-noir-velours text-sm sm:text-base leading-tight">
                          {film.title}
                        </h3>
                        <span className="font-crimson text-xs text-sepia-chaud italic">
                          {formatRuntime(film.runtime)}
                          {film.letterboxdRating != null && (
                            <span className="text-or-antique not-italic"> ★ {film.letterboxdRating.toFixed(1)}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                  <div className="mt-1.5 flex flex-wrap gap-1 pl-[60px] sm:pl-[68px]">
                    {showtimes.map((st) => (
                      <span key={st.id} className="inline-flex items-stretch gap-1">
                        <span className="font-bebas inline-flex items-baseline gap-1 bg-beige-papier border border-sepia-chaud/60 rounded px-1.5 py-0.5 text-[11px] text-noir-velours tracking-wide">
                          <span className="font-bold">{st.time}</span>
                          <span className="text-sepia-chaud text-[9px] uppercase">
                            {getCinemaShortName(st.cinemaName)}
                            {st.version && st.version !== 'VF' ? ` · ${st.version}` : ''}
                          </span>
                        </span>
                        <AddToSoireeButton film={film} showtime={st} city={cityOf(st.cinemaId)} className="px-1" />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
```

(Le `pl-[60px]`/`sm:pl-[68px]` aligne les chips sous le titre : largeur d'affiche 48/56px + `gap-3` 12px. Le poster restant plus haut que le titre seul, la hauteur de ligne diminue légèrement — c'est attendu.)

- [ ] **Step 3: `HomePage.tsx` — passer `cityOf`**

Remplacer :

```tsx
            <PlanningView films={filteredFilms} dates={weekDates} onFilmClick={openDrawer} />
```

par :

```tsx
            <PlanningView films={filteredFilms} dates={weekDates} cityOf={cityOf} onFilmClick={openDrawer} />
```

(`cityOf` existe déjà dans `HomePage`.)

- [ ] **Step 4: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/src/components/PlanningView.tsx reeltime-v2/apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): ajout a Ma soiree depuis la vue planning"
```

---

### Task 12: Point d'entrée — « Utiliser ce combo » sur `SoireePage`

**Files:**
- Modify: `reeltime-v2/apps/web/src/pages/SoireePage.tsx`

**Interfaces:**
- Consumes: `replaceSoiree`, `makeSoireeItem` (Task 5).
- Produces: bouton « Utiliser ce combo » sous chaque paire → remplit le plan avec les 2 séances d'un coup (remplace le plan courant ; confirmation gérée par `replaceSoiree` si un plan d'une autre date existe).

- [ ] **Step 1: Import**

```ts
import { replaceSoiree, makeSoireeItem } from '../stores/soireeStore';
```

- [ ] **Step 2: Bouton par combo**

Dans le rendu des combos, juste après le `</div>` qui ferme la grille `grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] ...` (toujours à l'intérieur de la carte du combo), ajouter :

```tsx
                    <button
                      type="button"
                      onClick={() =>
                        replaceSoiree([
                          makeSoireeItem(combo.first.film, combo.first.showtime, cityOf(combo.first.showtime.cinemaId)),
                          makeSoireeItem(combo.second.film, combo.second.showtime, cityOf(combo.second.showtime.cinemaId)),
                        ])
                      }
                      className="font-bebas mt-2 w-full sm:w-auto px-3 py-1.5 rounded-md border-2 border-sepia-chaud bg-beige-papier text-noir-velours text-xs uppercase tracking-wide hover:border-rouge-cinema hover:text-rouge-cinema transition-colors"
                    >
                      🎟 Utiliser ce combo
                    </button>
```

- [ ] **Step 3: Vérifier la compilation**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add reeltime-v2/apps/web/src/pages/SoireePage.tsx
git commit -m "feat(web): bouton Utiliser ce combo sur la page soiree"
```

---

### Task 13: Vérification finale + QA manuelle

**Files:** aucun (vérification). Corrections éventuelles committées en `fix(web): ...`.

- [ ] **Step 1: Build complet**

Run (depuis `reeltime-v2/apps/web`) : `npx tsc --noEmit` puis `npx vite build`
Expected: build OK sans erreur ni warning TypeScript.

- [ ] **Step 2: Lancer l'app en dev**

Run (depuis `reeltime-v2/`) : `pnpm dev` (API + web). Ouvrir l'URL Vite affichée.

- [ ] **Step 3: QA manuelle « Ce soir » (checklist spec §4)**

- Tap « Ce soir » → uniquement les séances d'aujourd'hui ≥ max(18h, maintenant) ; filtres persistés (cinémas, version, tri) toujours appliqués.
- Le bouton passe en fond `rouge-cinema` ; la DayStrip montre « Aujourd'hui » sélectionné ; le tag « Ce soir » apparaît en premier dans les tags.
- Re-tap et ✕ sur le tag → retour à la vue normale, `selectedDate`/`timeSlot` persistés intacts.
- Depuis la semaine suivante, tap « Ce soir » → retour semaine courante ET mode actif (le piège d'ordre).
- Changer de semaine pendant le mode → mode désactivé.
- Refresh navigateur → mode désactivé (non persisté), filtres persistés intacts. Vérifier dans devtools que `localStorage['reeltime-filters']` ne contient pas `ceSoirMode`.

- [ ] **Step 4: QA manuelle « Ma soirée » (checklist spec §4)**

- Ajout depuis les 4 points d'entrée : pastille du drawer film, candidat + ancre du SequencePanel, chip de la vue Planning, « Utiliser ce combo » de la page Soirée.
- « + » passe en ✓ après ajout ; re-clic impossible ; même séance jamais dupliquée.
- Barre visible sur toutes les pages, repliée par défaut : `🎟 Ma soirée · <jour> · N films · début → ~fin`.
- Dépliée : tri chrono, battements corrects, chevauchement > 10 min en rouge, « ~ » si durée inconnue, version affichée si ≠ VF, lien « Réserver » cliquable, ✕ retire, « Tout effacer » vide et masque la barre.
- Suggestions « + un film avant / après » cohérentes (même ville, battement ≤ 1h) ; tap = ajout direct.
- Ajout d'une séance d'une autre date → `window.confirm` « Remplacer la soirée du ... ? » ; annuler ne change rien ; accepter repart sur la nouvelle date.
- Deux villes différentes → « ⚠ villes différentes » (l'ajout reste permis).
- Persistance après refresh (`localStorage['reeltime-soiree']`).
- Purge au lendemain : éditer `reeltime-soiree` dans devtools pour mettre une date passée, refresh → plan vidé.
- Séance passée le jour même grisée (modifier l'heure d'un item dans le localStorage pour simuler).
- Mobile (devtools responsive) : barre pleine largeur en bas, safe-area OK, aucun contenu masqué (padding-bottom), ScrollToTopButton au-dessus de la barre. Desktop : panneau flottant bas-droite ~28rem.

- [ ] **Step 5: Notifier la fin**

```bash
powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()"
```

Puis suivre la skill superpowers:verification-before-completion avant toute annonce de complétion. Le déploiement (push, rebuild ghcr, Portainer) est **hors plan** — voir la mémoire `deploiement-portainer`.
