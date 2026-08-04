# Sliders de filtres et refonte du filtre cinémas — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le select de créneaux horaires par un double slider à bornes calculées, le select d'âge par un slider à 7 paliers, et faire de la ville une vraie dimension de filtre au lieu d'une liste de cinémas dépliée.

**Architecture:** Toute la logique filtrable vit dans `src/utils/` en fonctions pures testées (`timeRange.ts`, `ageFilter.ts`). Les composants Radix (`Slider.tsx` et ses deux usages) ne portent que le rendu. Les bornes du slider horaire sont calculées dans `useFilteredFilms` — après les filtres ville/cinémas/version/âge, avant le filtre horaire — puis remontées à `HomePage` qui les fait redescendre vers `FilterBar` et `FilterSheet`.

**Tech Stack:** React 19, Vite 6, Tailwind 3, Zustand 5, Radix UI Slider, Vitest 4.

## Global Constraints

- Spec de référence : `docs/superpowers/specs/2026-08-04-sliders-filtres-design.md`.
- Toutes les commandes se lancent depuis `reeltime-v2/apps/web`.
- React 19 : `useRef` exige une valeur initiale — `useRef<T>(undefined)`, jamais `useRef<T>()`.
- Les barrels `components/filters/index.ts` et `hooks/index.ts` doivent être mis à jour pour chaque nouveau fichier.
- Vitest web tourne en environnement `node` sur `src/__tests__/**/*.test.ts` uniquement : **pas de test de composant**, pas de `.test.tsx`. Installer testing-library est hors périmètre.
- Cibles tactiles ≥ 44 px.
- Couleurs du thème vintage uniquement : `rouge-cinema`, `noir-velours`, `creme-ecran`, `or-antique`, `sepia-chaud`, `beige-papier`, `bordeaux-profond`. Polices `font-bebas` pour les libellés d'interface.
- Textes d'interface en français.
- Zustand `persist` : `partialize` liste explicitement ce qui est persisté.
- Le paramètre `minTime` de l'API (`apps/api`) n'est **pas** touché.

---

### Task 1 : Primitive Slider Radix

**Files:**
- Modify: `reeltime-v2/apps/web/package.json`
- Create: `reeltime-v2/apps/web/src/components/filters/Slider.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/index.ts`

**Interfaces:**
- Consomme : rien.
- Produit : `Slider` — `({ value: number[], onValueChange: (v: number[]) => void, min: number, max: number, step?: number, disabled?: boolean, ariaLabels: string[] }) => JSX.Element`. Un pouce par entrée de `value`.

Aucun test automatisé n'est possible sur ce composant (pas de testing-library). Sa porte de validation est le typecheck, le build et un contrôle visuel.

- [ ] **Step 1: Installer la dépendance**

```bash
cd reeltime-v2/apps/web
pnpm add @radix-ui/react-slider
```

- [ ] **Step 2: Créer le composant**

Créer `src/components/filters/Slider.tsx` :

```tsx
import * as RadixSlider from '@radix-ui/react-slider';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Un libellé par pouce, dans l'ordre. */
  ariaLabels: string[];
}

/**
 * Habillage vintage de Radix Slider. Un pouce par entrée de `value` :
 * un tableau à une valeur donne un slider simple, à deux un double.
 */
export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled = false,
  ariaLabels,
}: SliderProps) {
  return (
    <RadixSlider.Root
      className={`relative flex items-center select-none touch-none w-full h-11 ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={value.length > 1 ? 1 : 0}
      disabled={disabled}
    >
      <RadixSlider.Track className="relative grow h-1.5 rounded-full bg-sepia-chaud/40">
        <RadixSlider.Range className="absolute h-full rounded-full bg-rouge-cinema" />
      </RadixSlider.Track>
      {value.map((_, index) => (
        <RadixSlider.Thumb
          key={index}
          aria-label={ariaLabels[index]}
          className="block w-6 h-6 rounded-full bg-creme-ecran border-2 border-bordeaux-profond shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rouge-cinema focus-visible:ring-offset-2"
        />
      ))}
    </RadixSlider.Root>
  );
}
```

- [ ] **Step 3: Mettre à jour le barrel**

Dans `src/components/filters/index.ts`, ajouter après la ligne `export { FilterSelect } from './FilterSelect';` :

```ts
export { Slider } from './Slider';
```

- [ ] **Step 4: Vérifier**

```bash
cd reeltime-v2/apps/web
npx tsc --noEmit
npx vite build
```

Attendu : aucune erreur, build réussi.

- [ ] **Step 5: Commit**

```bash
git add reeltime-v2/apps/web/package.json reeltime-v2/pnpm-lock.yaml reeltime-v2/apps/web/src/components/filters/Slider.tsx reeltime-v2/apps/web/src/components/filters/index.ts
git commit -m "feat(web): primitive Slider habillee sur Radix"
```

---

### Task 2 : Slider d'âge du film

**Files:**
- Create: `reeltime-v2/apps/web/src/utils/ageFilter.ts`
- Create: `reeltime-v2/apps/web/src/__tests__/ageFilter.test.ts`
- Create: `reeltime-v2/apps/web/src/components/filters/AgeSlider.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/FilterControls.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/filterOptions.ts`
- Modify: `reeltime-v2/apps/web/src/components/filters/index.ts`

**Interfaces:**
- Consomme : `Slider` (Task 1), `MinAgeFilter` depuis `stores/filtersStore`.
- Produit : `MIN_AGE_VALUES: MinAgeFilter[]`, `ageIndexOf(value: MinAgeFilter): number`, `ageValueAt(index: number): MinAgeFilter`, `ageLabel(value: MinAgeFilter): string`, composant `AgeSlider` sans props.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/__tests__/ageFilter.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { MIN_AGE_VALUES, ageIndexOf, ageValueAt, ageLabel } from '../utils/ageFilter';
import type { MinAgeFilter } from '../stores/filtersStore';

describe('MIN_AGE_VALUES', () => {
  it('liste les 7 paliers dans l ordre croissant', () => {
    expect(MIN_AGE_VALUES).toEqual([0, 1, 5, 10, 20, 30, 50]);
  });
});

describe('ageIndexOf', () => {
  it('rend l index du palier', () => {
    expect(ageIndexOf(0)).toBe(0);
    expect(ageIndexOf(10)).toBe(3);
    expect(ageIndexOf(50)).toBe(6);
  });

  it('retombe sur 0 pour une valeur hors paliers', () => {
    expect(ageIndexOf(7 as MinAgeFilter)).toBe(0);
  });
});

describe('ageValueAt', () => {
  it('rend la valeur du palier', () => {
    expect(ageValueAt(0)).toBe(0);
    expect(ageValueAt(3)).toBe(10);
    expect(ageValueAt(6)).toBe(50);
  });

  it('retombe sur 0 hors bornes', () => {
    expect(ageValueAt(99)).toBe(0);
    expect(ageValueAt(-1)).toBe(0);
  });
});

describe('ageLabel', () => {
  it('emploie un libelle special pour le palier 0', () => {
    expect(ageLabel(0)).toBe('Tous les films');
  });

  it('emploie le nombre d annees pour les autres paliers', () => {
    expect(ageLabel(1)).toBe('Films de +1 an');
    expect(ageLabel(10)).toBe('Films de +10 ans');
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

```bash
cd reeltime-v2/apps/web
npx vitest run src/__tests__/ageFilter.test.ts
```

Attendu : ÉCHEC — `Cannot find module '../utils/ageFilter'`.

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `src/utils/ageFilter.ts` :

```ts
import type { MinAgeFilter } from '../stores/filtersStore';

/** Paliers du filtre d'âge, dans l'ordre du slider. L'index sert de valeur au curseur. */
export const MIN_AGE_VALUES: MinAgeFilter[] = [0, 1, 5, 10, 20, 30, 50];

export function ageIndexOf(value: MinAgeFilter): number {
  const index = MIN_AGE_VALUES.indexOf(value);
  return index === -1 ? 0 : index;
}

export function ageValueAt(index: number): MinAgeFilter {
  return MIN_AGE_VALUES[index] ?? 0;
}

export function ageLabel(value: MinAgeFilter): string {
  if (value === 0) return 'Tous les films';
  return `Films de +${value} an${value > 1 ? 's' : ''}`;
}
```

- [ ] **Step 4: Lancer le test pour le voir passer**

```bash
cd reeltime-v2/apps/web
npx vitest run src/__tests__/ageFilter.test.ts
```

Attendu : SUCCÈS, 8 tests.

- [ ] **Step 5: Créer le composant AgeSlider**

Créer `src/components/filters/AgeSlider.tsx` :

```tsx
import { useFiltersStore } from '../../stores/filtersStore';
import { MIN_AGE_VALUES, ageIndexOf, ageValueAt, ageLabel } from '../../utils/ageFilter';
import { Slider } from './Slider';

export function AgeSlider() {
  const minAge = useFiltersStore((s) => s.minAge);
  const setMinAge = useFiltersStore((s) => s.setMinAge);

  return (
    <div className="space-y-1">
      <span className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide">
        Âge du film
      </span>
      <Slider
        value={[ageIndexOf(minAge)]}
        onValueChange={([index]) => setMinAge(ageValueAt(index))}
        min={0}
        max={MIN_AGE_VALUES.length - 1}
        ariaLabels={['Âge minimum du film']}
      />
      <p className="font-bebas text-sm text-noir-velours">{ageLabel(minAge)}</p>
    </div>
  );
}
```

- [ ] **Step 6: Brancher dans FilterControls et retirer le select**

Dans `src/components/filters/FilterControls.tsx` :

1. Ajouter l'import `import { AgeSlider } from './AgeSlider';`
2. Retirer `MIN_AGE_OPTIONS` de l'import depuis `./filterOptions`
3. Retirer `MinAgeFilter` de l'import de types (plus utilisé ici)
4. Supprimer les lignes `const minAge = useFiltersStore((s) => s.minAge);` et `const setMinAge = useFiltersStore((s) => s.setMinAge);`
5. Supprimer de la grille la ligne :

```tsx
<FilterSelect label="Âge du film" value={String(minAge)} options={MIN_AGE_OPTIONS} onChange={(v) => setMinAge(Number(v) as MinAgeFilter)} />
```

6. Passer la grille de `md:grid-cols-4` à `md:grid-cols-3` :

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
```

7. Insérer `<AgeSlider />` juste après la fermeture `</div>` de cette grille.

Dans `src/components/filters/filterOptions.ts`, supprimer intégralement le bloc `MIN_AGE_OPTIONS`.

Dans `src/components/filters/index.ts`, ajouter :

```ts
export { AgeSlider } from './AgeSlider';
```

- [ ] **Step 7: Vérifier**

```bash
cd reeltime-v2/apps/web
npx vitest run
npx tsc --noEmit
npx vite build
```

Attendu : tous les tests passent, aucune erreur de type, build réussi.

- [ ] **Step 8: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/ageFilter.ts reeltime-v2/apps/web/src/__tests__/ageFilter.test.ts reeltime-v2/apps/web/src/components/filters/
git commit -m "feat(web): slider a 7 paliers pour l age du film"
```

---

### Task 3 : Logique pure — plage horaire et résolution ville → cinémas

**Files:**
- Create: `reeltime-v2/apps/web/src/utils/timeRange.ts`
- Create: `reeltime-v2/apps/web/src/__tests__/timeRange.test.ts`
- Create: `reeltime-v2/apps/web/src/utils/cinemaFilter.ts`
- Create: `reeltime-v2/apps/web/src/__tests__/cinemaFilter.test.ts`

**Interfaces:**
- Consomme : `FilmListItem` depuis `types/components`.
- Produit : `interface TimeRange { start: string; end: string }`, `toMinutes(time: string): number`, `toHHMM(minutes: number): string`, `computeTimeBounds(films: FilmListItem[]): TimeRange | null`, `isInTimeRange(time: string, range: TimeRange): boolean`, `formatTimeLabel(time: string): string`, `cinemaIdsForCity(cinemas: { id: string; city: string }[], city: string | null): string[] | null`.

Les heures circulent partout en `HH:MM` zéro-paddé, ce qui rend la comparaison lexicographique (`>=`, `<=`) équivalente à la comparaison chronologique.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/__tests__/timeRange.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import {
  toMinutes,
  toHHMM,
  computeTimeBounds,
  isInTimeRange,
  formatTimeLabel,
} from '../utils/timeRange';
import type { FilmListItem } from '../types/components';

function filmAt(...times: string[]): FilmListItem {
  return {
    id: 1,
    title: 'Film',
    year: 2026,
    posterUrl: null,
    director: null,
    genres: [],
    filmAge: 0,
    rating: null,
    letterboxdRating: null,
    runtime: null,
    totalShowtimes: times.length,
    letterboxdUrl: '',
    showtimes: times.map((time) => ({
      date: '2026-08-04',
      time,
      version: 'VF',
      cinemaId: 'P0153',
      cinemaName: 'Les Studios',
      datetime: `2026-08-04T${time}:00`,
      bookingUrl: null,
    })),
  } as unknown as FilmListItem;
}

describe('toMinutes / toHHMM', () => {
  it('convertit dans les deux sens', () => {
    expect(toMinutes('20:40')).toBe(1240);
    expect(toHHMM(1240)).toBe('20:40');
  });

  it('zero-padde les heures du matin', () => {
    expect(toHHMM(545)).toBe('09:05');
  });
});

describe('computeTimeBounds', () => {
  it('arrondit les bornes vers l exterieur au quart d heure', () => {
    expect(computeTimeBounds([filmAt('13:50', '22:40')])).toEqual({
      start: '13:45',
      end: '22:45',
    });
  });

  it('balaie tous les films et toutes les seances', () => {
    expect(computeTimeBounds([filmAt('18:00'), filmAt('11:10', '20:00')])).toEqual({
      start: '11:00',
      end: '20:00',
    });
  });

  it('rend null quand aucune seance n existe', () => {
    expect(computeTimeBounds([])).toBeNull();
    expect(computeTimeBounds([filmAt()])).toBeNull();
  });

  it('ecarte les bornes d un quart d heure quand elles se confondent', () => {
    // Une seule séance pile sur un quart d'heure : sans écart, le slider aurait
    // min === max et Radix ne pourrait plus être manipulé.
    expect(computeTimeBounds([filmAt('20:45')])).toEqual({
      start: '20:45',
      end: '21:00',
    });
  });

  it('gere une seance de fin de soiree', () => {
    expect(computeTimeBounds([filmAt('23:50')])).toEqual({
      start: '23:45',
      end: '24:00',
    });
  });
});

describe('isInTimeRange', () => {
  const range = { start: '18:00', end: '22:45' };

  it('inclut les deux bornes', () => {
    expect(isInTimeRange('18:00', range)).toBe(true);
    expect(isInTimeRange('22:45', range)).toBe(true);
  });

  it('exclut ce qui deborde', () => {
    expect(isInTimeRange('17:59', range)).toBe(false);
    expect(isInTimeRange('22:46', range)).toBe(false);
  });

  it('ne retire rien quand la plage egale les bornes calculees', () => {
    const films = [filmAt('13:50', '18:30', '22:40')];
    const bounds = computeTimeBounds(films)!;
    const kept = films[0].showtimes.filter((st) => isInTimeRange(st.time, bounds));
    expect(kept).toHaveLength(3);
  });
});

describe('formatTimeLabel', () => {
  it('formate a la francaise', () => {
    expect(formatTimeLabel('18:00')).toBe('18h00');
    expect(formatTimeLabel('09:05')).toBe('9h05');
  });

  it('nomme minuit plutot que 24h00', () => {
    expect(formatTimeLabel('24:00')).toBe('minuit');
  });
});
```

- [ ] **Step 2: Lancer le test pour le voir échouer**

```bash
cd reeltime-v2/apps/web
npx vitest run src/__tests__/timeRange.test.ts
```

Attendu : ÉCHEC — `Cannot find module '../utils/timeRange'`.

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `src/utils/timeRange.ts` :

```ts
import type { FilmListItem } from '../types/components';

/** Plage horaire en heures murales `HH:MM`, bornes incluses. */
export interface TimeRange {
  start: string;
  end: string;
}

const QUARTER = 15;
const DAY_END_MINUTES = 24 * 60;

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function toHHMM(minutes: number): string {
  const clamped = Math.max(0, Math.min(DAY_END_MINUTES, minutes));
  const hours = Math.floor(clamped / 60);
  const rest = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/**
 * Bornes du slider horaire : minimum et maximum des séances fournies, arrondis
 * vers l'extérieur au quart d'heure pour que les crans tombent juste. Rend
 * `null` quand il n'y a aucune séance — il n'y a alors rien à filtrer.
 */
export function computeTimeBounds(films: FilmListItem[]): TimeRange | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const film of films) {
    for (const showtime of film.showtimes) {
      const minutes = toMinutes(showtime.time);
      if (minutes < min) min = minutes;
      if (minutes > max) max = minutes;
    }
  }

  if (min === Number.POSITIVE_INFINITY) return null;

  const start = Math.floor(min / QUARTER) * QUARTER;
  let end = Math.ceil(max / QUARTER) * QUARTER;
  // Séance unique tombant pile sur un quart d'heure : sans cet écart le slider
  // aurait min === max et deviendrait impossible à manipuler.
  if (end === start) end += QUARTER;

  return { start: toHHMM(start), end: toHHMM(end) };
}

export function isInTimeRange(time: string, range: TimeRange): boolean {
  return time >= range.start && time <= range.end;
}

/** `18:00` → `18h00`, `24:00` → `minuit`. */
export function formatTimeLabel(time: string): string {
  if (time === '24:00') return 'minuit';
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}h${minutes}`;
}
```

- [ ] **Step 4: Lancer le test pour le voir passer**

```bash
cd reeltime-v2/apps/web
npx vitest run src/__tests__/timeRange.test.ts
```

Attendu : SUCCÈS, 12 tests.

- [ ] **Step 5: Écrire le test qui échoue pour la résolution ville → cinémas**

Créer `src/__tests__/cinemaFilter.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import { cinemaIdsForCity } from '../utils/cinemaFilter';

const CINEMAS = [
  { id: 'P0153', city: 'Brest' },
  { id: 'P0151', city: 'Brest' },
  { id: 'G02PD', city: 'Landerneau' },
  { id: 'P0633', city: 'Quimper' },
];

describe('cinemaIdsForCity', () => {
  it('rend les identifiants des cinemas de la ville', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Brest')).toEqual(['P0153', 'P0151']);
  });

  it('rend null quand aucune ville n est choisie', () => {
    expect(cinemaIdsForCity(CINEMAS, null)).toBeNull();
  });

  it('rend un tableau vide pour une ville sans cinema', () => {
    expect(cinemaIdsForCity(CINEMAS, 'Rennes')).toEqual([]);
  });
});
```

- [ ] **Step 6: Lancer le test pour le voir échouer**

```bash
cd reeltime-v2/apps/web
npx vitest run src/__tests__/cinemaFilter.test.ts
```

Attendu : ÉCHEC — `Cannot find module '../utils/cinemaFilter'`.

- [ ] **Step 7: Écrire l'implémentation minimale**

Créer `src/utils/cinemaFilter.ts` :

```ts
/**
 * Identifiants des cinémas d'une ville. Rend `null` — et non un tableau vide —
 * quand aucune ville n'est choisie : l'absence de filtre et « aucun cinéma ne
 * correspond » ne doivent pas se confondre côté appelant.
 */
export function cinemaIdsForCity(
  cinemas: { id: string; city: string }[],
  city: string | null,
): string[] | null {
  if (!city) return null;
  return cinemas.filter((cinema) => cinema.city === city).map((cinema) => cinema.id);
}
```

- [ ] **Step 8: Lancer le test pour le voir passer**

```bash
cd reeltime-v2/apps/web
npx vitest run src/__tests__/cinemaFilter.test.ts
```

Attendu : SUCCÈS, 3 tests.

- [ ] **Step 9: Commit**

```bash
git add reeltime-v2/apps/web/src/utils/timeRange.ts reeltime-v2/apps/web/src/__tests__/timeRange.test.ts reeltime-v2/apps/web/src/utils/cinemaFilter.ts reeltime-v2/apps/web/src/__tests__/cinemaFilter.test.ts
git commit -m "feat(web): bornes de plage horaire et resolution ville vers cinemas"
```

---

### Task 4 : Store — `timeRange` remplace `timeSlot`, suppression de `minTime` et `selectedDepartment`

**Files:**
- Modify: `reeltime-v2/apps/web/src/stores/filtersStore.ts`

**Interfaces:**
- Consomme : `TimeRange` depuis `utils/timeRange` (Task 3).
- Produit : champ `timeRange: TimeRange | null` et action `setTimeRange: (r: TimeRange | null) => void`. Disparaissent : `timeSlot`, `setTimeSlot`, `TimeSlotFilter`, `minTime`, `setMinTime`, `selectedDepartment`, `setDepartment`.

Cette tâche casse volontairement la compilation : `useFilteredFilms`, `FilterControls` et `ActiveFilterTags` référencent encore les champs supprimés. Les tâches 5 et 6 réparent. Le typecheck n'est donc **pas** une porte de validation ici — la porte est que les tests unitaires existants restent verts.

- [ ] **Step 1: Modifier le store**

Dans `src/stores/filtersStore.ts` :

1. Ajouter en tête `import type { TimeRange } from '../utils/timeRange';`
2. Supprimer la ligne `export type TimeSlotFilter = 'all' | 'morning' | 'afternoon' | 'evening' | 'night';`
3. Dans `interface FiltersState`, supprimer `selectedDepartment: string | null;`, `minTime: string | null;`, `timeSlot: TimeSlotFilter;` et ajouter à la place de `timeSlot` :

```ts
  /** Plage horaire choisie au slider ; null = plage complète, aucun filtre. Transitoire. */
  timeRange: TimeRange | null;
```

4. Dans la liste des actions, supprimer `setDepartment`, `setMinTime`, `setTimeSlot` et ajouter :

```ts
  setTimeRange: (r: TimeRange | null) => void;
```

5. Dans l'état initial, supprimer `selectedDepartment: null,`, `minTime: null,`, `timeSlot: 'all',` et ajouter `timeRange: null,`
6. Supprimer les implémentations `setDepartment`, `setMinTime`, `setTimeSlot` et ajouter :

```ts
      setTimeRange: (timeRange) => set({ timeRange }),
```

7. Remplacer `resetAll` par :

```ts
      resetAll: () =>
        set({ searchQuery: '', selectedCinemas: [], selectedCity: null, version: null, minRating: null, sort: 'popularity', selectedDate: null, timeRange: null, minAge: 0, ceSoirMode: false }),
```

8. Remplacer `partialize` par — `timeRange` en est volontairement absent, les bornes se recalculant à chaque jour :

```ts
      partialize: (state) => ({
        selectedCinemas: state.selectedCinemas,
        selectedCity: state.selectedCity,
        version: state.version,
        minRating: state.minRating,
        sort: state.sort,
        minAge: state.minAge,
        viewMode: state.viewMode,
      }),
```

- [ ] **Step 2: Vérifier que les tests unitaires restent verts**

```bash
cd reeltime-v2/apps/web
npx vitest run
```

Attendu : SUCCÈS. `npx tsc --noEmit` échouerait à ce stade — c'est attendu, les consommateurs sont réparés aux tâches 5 et 6.

- [ ] **Step 3: Commit**

```bash
git add reeltime-v2/apps/web/src/stores/filtersStore.ts
git commit -m "refactor(web): timeRange remplace timeSlot, retrait de minTime et selectedDepartment"
```

---

### Task 5 : Filtrage horaire et remontée des bornes

**Files:**
- Modify: `reeltime-v2/apps/web/src/hooks/useFilteredFilms.ts`
- Create: `reeltime-v2/apps/web/src/hooks/useTimeRangeReset.ts`
- Modify: `reeltime-v2/apps/web/src/hooks/index.ts`
- Create: `reeltime-v2/apps/web/src/components/filters/TimeRangeSlider.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/FilterControls.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/FilterBar.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/FilterSheet.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/filterOptions.ts`
- Modify: `reeltime-v2/apps/web/src/components/filters/index.ts`
- Modify: `reeltime-v2/apps/web/src/pages/HomePage.tsx`

**Interfaces:**
- Consomme : `computeTimeBounds`, `isInTimeRange`, `toMinutes`, `toHHMM`, `formatTimeLabel`, `TimeRange` (Task 3) ; `timeRange`/`setTimeRange` (Task 4) ; `Slider` (Task 1).
- Produit : `useFilteredFilms(films, cinemas)` renvoie désormais `{ filteredFilms, activeFilterCount, hasActiveFilters, timeBounds: TimeRange | null }` ; `useTimeRangeReset(bounds: TimeRange | null): void` ; `TimeRangeSlider` avec la prop `bounds: TimeRange | null`. `FilterControls`, `FilterBar` et `FilterSheet` gagnent la prop `timeBounds: TimeRange | null`.

Le second paramètre `cinemas` de `useFilteredFilms` sert au filtre ville de la tâche 6 ; il est introduit ici pour que la signature ne change qu'une fois.

- [ ] **Step 1: Réécrire le filtrage dans useFilteredFilms**

Dans `src/hooks/useFilteredFilms.ts` :

1. Remplacer les imports de tête par :

```ts
import { useDeferredValue, useMemo } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import { localISODate, nowHHMM } from '../utils/dates';
import { computeTimeBounds, isInTimeRange, type TimeRange } from '../utils/timeRange';
import { cinemaIdsForCity } from '../utils/cinemaFilter';
import type { FilmListItem } from '../types/components';

interface Cinema {
  id: string;
  name: string;
  city: string;
}
```

2. Supprimer intégralement la fonction `matchesTimeSlot` et son commentaire.
3. Remplacer la signature et les sélecteurs :

```ts
export function useFilteredFilms(films: FilmListItem[], cinemas: Cinema[]) {
  const searchQuery = useFiltersStore((s) => s.searchQuery);
  const selectedCinemas = useFiltersStore((s) => s.selectedCinemas);
  const selectedCity = useFiltersStore((s) => s.selectedCity);
  const version = useFiltersStore((s) => s.version);
  const minRating = useFiltersStore((s) => s.minRating);
  const sort = useFiltersStore((s) => s.sort);
  const selectedDate = useFiltersStore((s) => s.selectedDate);
  const timeRange = useFiltersStore((s) => s.timeRange);
  const minAge = useFiltersStore((s) => s.minAge);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);
```

4. Remplacer le bloc « Filter by cinema » par la résolution ville → cinémas :

```ts
    // Ville et puces sont deux niveaux du même filtre : les puces cochées
    // priment, sinon la ville sélectionnée fournit la liste des cinémas.
    const effectiveCinemaIds =
      selectedCinemas.length > 0 ? selectedCinemas : cinemaIdsForCity(cinemas, selectedCity);

    if (effectiveCinemaIds) {
      result = result
        .map((film) => ({
          ...film,
          showtimes: film.showtimes.filter((st) => effectiveCinemaIds.includes(st.cinemaId)),
        }))
        .filter((film) => film.showtimes.length > 0);
    }
```

5. Déplacer les filtres `minAge` et `minRating` **avant** le bloc `if (ceSoirMode)`. Les deux portent sur le film entier et non sur ses séances : les remonter ne change pas le résultat, mais garantit que les bornes horaires sont calculées sur les films réellement affichés.

6. Remplacer le bloc `if (ceSoirMode) { … } else { … }` par :

```ts
    let bounds: TimeRange | null = null;

    if (ceSoirMode) {
      // "Ce soir" overlay: today only, from max(18:00, now). Remplace selectedDate
      // et le filtre horaire, qui est alors ignoré.
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
      if (selectedDate) {
        result = result
          .map((film) => ({
            ...film,
            showtimes: film.showtimes.filter((st) => st.datetime.slice(0, 10) === selectedDate),
          }))
          .filter((film) => film.showtimes.length > 0);
      }

      // Bornes calculées avant d'appliquer la plage : sinon le filtre
      // rétrécirait ses propres bornes à chaque rendu.
      bounds = computeTimeBounds(result);

      if (timeRange) {
        result = result
          .map((film) => ({
            ...film,
            showtimes: film.showtimes.filter((st) => isInTimeRange(st.time, timeRange)),
          }))
          .filter((film) => film.showtimes.length > 0);
      }
    }
```

7. Supprimer intégralement le bloc `// Filter by minimum time (kept for backward compatibility)`.
8. Le `useMemo` doit désormais rendre deux valeurs. Renommer sa variable
   d'accueil — `const filteredFilms = useMemo(…)` devient `const memo = useMemo(…)` —
   et changer sa fin :

```ts
    return { films: result, timeBounds: bounds };
  }, [films, cinemas, deferredQuery, selectedCinemas, selectedCity, version, minRating, sort, selectedDate, timeRange, minAge, ceSoirMode]);
```

9. Adapter la destructuration et le décompte, juste après le `useMemo` :

```ts
  const { films: filteredFilms, timeBounds } = memo;

  const activeFilterCount =
    (searchQuery ? 1 : 0) +
    (selectedCinemas.length > 0 ? 1 : 0) +
    (selectedCity !== null ? 1 : 0) +
    (version ? 1 : 0) +
    (ceSoirMode ? 1 : 0) +
    (!ceSoirMode && timeRange !== null ? 1 : 0) +
    (minAge > 0 ? 1 : 0) +
    (minRating !== null ? 1 : 0);

  return { filteredFilms, activeFilterCount, hasActiveFilters: activeFilterCount > 0, timeBounds };
```

- [ ] **Step 2: Créer le hook de réinitialisation**

Créer `src/hooks/useTimeRangeReset.ts` :

```ts
import { useEffect, useRef } from 'react';
import { useFiltersStore } from '../stores/filtersStore';
import type { TimeRange } from '../utils/timeRange';

/**
 * Remet la plage horaire à zéro dès que les bornes calculées changent — jour,
 * ville ou cinémas différents. Sans cela, une plage réglée hier survivrait sur
 * un jour dont les séances ne la recoupent pas, et la liste paraîtrait vide
 * sans raison visible.
 *
 * La comparaison porte sur une clé texte et non sur l'objet : `computeTimeBounds`
 * rend un objet neuf à chaque rendu, qui déclencherait l'effet en boucle.
 */
export function useTimeRangeReset(bounds: TimeRange | null): void {
  const setTimeRange = useFiltersStore((s) => s.setTimeRange);
  const previousKey = useRef<string | null>(null);
  const key = bounds ? `${bounds.start}-${bounds.end}` : '';

  useEffect(() => {
    if (previousKey.current !== null && previousKey.current !== key) {
      setTimeRange(null);
    }
    previousKey.current = key;
  }, [key, setTimeRange]);
}
```

Dans `src/hooks/index.ts`, ajouter :

```ts
export { useTimeRangeReset } from './useTimeRangeReset';
```

- [ ] **Step 3: Créer TimeRangeSlider**

Créer `src/components/filters/TimeRangeSlider.tsx` :

```tsx
import { useFiltersStore } from '../../stores/filtersStore';
import {
  formatTimeLabel,
  toHHMM,
  toMinutes,
  type TimeRange,
} from '../../utils/timeRange';
import { Slider } from './Slider';

const STEP_MINUTES = 15;

export function TimeRangeSlider({ bounds }: { bounds: TimeRange | null }) {
  const timeRange = useFiltersStore((s) => s.timeRange);
  const setTimeRange = useFiltersStore((s) => s.setTimeRange);
  const ceSoirMode = useFiltersStore((s) => s.ceSoirMode);

  // Aucune séance ce jour-là : il n'y a pas de bornes, donc rien à régler.
  if (!bounds) return null;

  const minMinutes = toMinutes(bounds.start);
  const maxMinutes = toMinutes(bounds.end);
  const current = timeRange ?? bounds;

  const handleChange = ([start, end]: number[]) => {
    // Revenir aux bornes complètes équivaut à retirer le filtre : on repasse à
    // null pour que l'étiquette de filtre actif disparaisse aussi.
    if (start === minMinutes && end === maxMinutes) {
      setTimeRange(null);
      return;
    }
    setTimeRange({ start: toHHMM(start), end: toHHMM(end) });
  };

  return (
    <div className="space-y-1">
      <span className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide">
        Horaires
      </span>
      <Slider
        value={[toMinutes(current.start), toMinutes(current.end)]}
        onValueChange={handleChange}
        min={minMinutes}
        max={maxMinutes}
        step={STEP_MINUTES}
        disabled={ceSoirMode}
        ariaLabels={['Heure de début', 'Heure de fin']}
      />
      <p className="font-bebas text-sm text-noir-velours">
        {ceSoirMode
          ? 'Désactivé par le mode « Ce soir »'
          : `De ${formatTimeLabel(current.start)} à ${formatTimeLabel(current.end)}`}
      </p>
    </div>
  );
}
```

Dans `src/components/filters/index.ts`, ajouter :

```ts
export { TimeRangeSlider } from './TimeRangeSlider';
```

- [ ] **Step 4: Brancher dans FilterControls**

Dans `src/components/filters/FilterControls.tsx` :

1. Ajouter `import { TimeRangeSlider } from './TimeRangeSlider';` et `import type { TimeRange } from '../../utils/timeRange';`
2. Retirer `TIME_SLOT_OPTIONS` de l'import depuis `./filterOptions` et `TimeSlotFilter` de l'import de types.
3. Changer la signature :

```tsx
export function FilterControls({ cinemas, timeBounds }: { cinemas: Cinema[]; timeBounds: TimeRange | null }) {
```

4. Supprimer `const timeSlot = useFiltersStore((s) => s.timeSlot);` et `const setTimeSlot = useFiltersStore((s) => s.setTimeSlot);`
5. Supprimer de la grille la ligne du `FilterSelect` « Horaires » et passer la grille de `md:grid-cols-3` à `md:grid-cols-2`.
6. Insérer `<TimeRangeSlider bounds={timeBounds} />` juste avant `<AgeSlider />`.

Dans `src/components/filters/filterOptions.ts`, supprimer les blocs `TIME_SLOT_OPTIONS` et `TIME_LABELS`.

- [ ] **Step 5: Faire descendre la prop**

Dans `src/components/filters/FilterBar.tsx` : ajouter `timeBounds: TimeRange | null;` à `FilterBarProps`, l'importer (`import type { TimeRange } from '../../utils/timeRange';`), l'accepter dans la signature et le passer : `<FilterControls cinemas={cinemas} timeBounds={timeBounds} />`.

Dans `src/components/filters/FilterSheet.tsx` : même chose sur `FilterSheetProps`, puis `<FilterControls cinemas={cinemas} timeBounds={timeBounds} />`.

Dans `src/pages/HomePage.tsx` :

1. Ligne 116, récupérer les bornes et passer les cinémas :

```tsx
  const { filteredFilms, activeFilterCount, hasActiveFilters, timeBounds } = useFilteredFilms(films, cinemas);
  useTimeRangeReset(timeBounds);
```

2. Ajouter l'import `import { useTimeRangeReset } from '../hooks/useTimeRangeReset';`
3. Ligne 249 : `<FilterBar cinemas={cinemas} activeFilterCount={activeFilterCount} timeBounds={timeBounds} />`
4. Ligne 253 : `<FilterSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} cinemas={cinemas} timeBounds={timeBounds} />`

- [ ] **Step 6: Vérifier**

```bash
cd reeltime-v2/apps/web
npx vitest run
npx tsc --noEmit
npx vite build
```

Attendu : tests verts. Le typecheck échoue **uniquement** sur les références à `selectedDepartment` / `setDepartment` restées dans `FilterControls.tsx` et `ActiveFilterTags.tsx`, ainsi que sur `timeSlot` dans `ActiveFilterTags.tsx` : la tâche 6 les supprime. Toute autre erreur doit être corrigée avant de commiter.

- [ ] **Step 7: Commit**

```bash
git add reeltime-v2/apps/web/src/hooks/ reeltime-v2/apps/web/src/components/filters/ reeltime-v2/apps/web/src/pages/HomePage.tsx
git commit -m "feat(web): double slider horaires a bornes calculees sur le jour affiche"
```

---

### Task 6 : Filtre cinémas par ville et étiquettes de filtres actifs

**Files:**
- Modify: `reeltime-v2/apps/web/src/components/filters/FilterControls.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/ActiveFilterTags.tsx`
- Modify: `reeltime-v2/apps/web/src/components/filters/filterOptions.ts`

**Interfaces:**
- Consomme : `selectedCity`/`setCity`/`setSelectedCinemas` (store), `timeRange`/`setTimeRange` (Task 4), `formatTimeLabel` (Task 3).
- Produit : rien de nouveau. Fin de la migration : plus aucune référence à `DEPARTMENTS`, `selectedDepartment` ni `TIME_LABELS`.

- [ ] **Step 1: Simplifier le filtre cinémas dans FilterControls**

Dans `src/components/filters/FilterControls.tsx` :

1. Retirer `DEPARTMENTS` de l'import depuis `./filterOptions`.
2. Supprimer `const selectedDepartment = useFiltersStore((s) => s.selectedDepartment);` et `const setDepartment = useFiltersStore((s) => s.setDepartment);`
3. Remplacer les blocs `availableCities`, `visibleCinemas`, `cityOptions`, `departmentOptions`, `handleDepartmentChange` et `handleCityChange` par :

```tsx
  // Les villes viennent des cinémas eux-mêmes : plus de liste à maintenir à la main.
  const cities = Array.from(new Set(cinemas.map((c) => c.city))).sort();
  const cityOptions = [
    { value: 'all', label: 'Toutes les villes' },
    ...cities.map((c) => ({ value: c, label: c })),
  ];

  const visibleCinemas = selectedCity
    ? cinemas.filter((cinema) => cinema.city === selectedCity)
    : cinemas;

  // Changer de ville vide les puces : sinon des cinémas d'une autre ville
  // resteraient cochés, invisibles à l'écran, et filtreraient en douce.
  const handleCityChange = (value: string) => {
    setCity(value === 'all' ? null : value);
    setSelectedCinemas([]);
  };
```

4. Remplacer la grille à deux colonnes Département/Ville par le seul select Ville :

```tsx
      <FilterSelect label="Ville" value={selectedCity ?? 'all'} options={cityOptions} onChange={handleCityChange} />
```

Dans `src/components/filters/filterOptions.ts`, supprimer le bloc `DEPARTMENTS`.

- [ ] **Step 2: Mettre à jour ActiveFilterTags**

Dans `src/components/filters/ActiveFilterTags.tsx` :

1. Remplacer l'import `import { DEPARTMENTS, TIME_LABELS } from './filterOptions';` par `import { formatTimeLabel } from '../../utils/timeRange';`
2. Supprimer les sélecteurs `selectedDepartment`, `setDepartment`, `timeSlot`, `setTimeSlot` ; ajouter `const timeRange = useFiltersStore((s) => s.timeRange);` et `const setTimeRange = useFiltersStore((s) => s.setTimeRange);`
3. Supprimer `clearDepartment` et remplacer `clearCity` par :

```tsx
  // Retirer la ville vide aussi les puces, comme le fait le sélecteur.
  const clearCity = () => {
    setCity(null);
    setSelectedCinemas([]);
  };
```

4. Remplacer l'étiquette de créneau par l'étiquette de plage :

```tsx
  if (!ceSoirMode && timeRange !== null) {
    tags.push({
      label: `${formatTimeLabel(timeRange.start)} – ${formatTimeLabel(timeRange.end)}`,
      onRemove: () => setTimeRange(null),
    });
  }
```

5. Supprimer le bloc `if (selectedDepartment !== null) { … }`
6. Remplacer la condition de l'étiquette « N cinémas », qui n'a plus de département à ménager :

```tsx
  if (selectedCinemas.length > 0) {
```

- [ ] **Step 3: Vérifier**

```bash
cd reeltime-v2/apps/web
npx vitest run
npx tsc --noEmit
npx vite build
```

Attendu : tests verts, **aucune** erreur de type, build réussi.

- [ ] **Step 4: Vérifier qu'aucune référence morte ne subsiste**

```bash
cd reeltime-v2/apps/web
grep -rn "timeSlot\|TIME_SLOT_OPTIONS\|TIME_LABELS\|selectedDepartment\|setDepartment\|DEPARTMENTS\|MIN_AGE_OPTIONS\|minTime\|setMinTime" src/
```

Attendu : aucun résultat.

- [ ] **Step 5: Contrôle visuel**

```bash
cd reeltime-v2/apps/web
pnpm dev
```

Ouvrir le navigateur et vérifier, sur la page d'accueil, panneau de filtres ouvert :

1. Le double slider horaire s'étend de la première à la dernière séance du jour affiché.
2. Le tirer met à jour le libellé « De 18h00 à 22h45 » et réduit la liste des films.
3. Changer de jour dans la bande remet la plage à la largeur complète.
4. Activer « Ce soir » grise le slider et affiche « Désactivé par le mode "Ce soir" ».
5. Le slider d'âge cranne sur les 7 paliers et affiche « Tous les films » puis « Films de +N ans ».
6. Choisir une ville ne montre plus que ses cinémas et filtre bien les films ; décocher une puce affine encore.
7. Les étiquettes de filtres actifs apparaissent pour la plage horaire, la ville et l'âge, et leur croix les retire.
8. Tester au doigt (ou en mode appareil mobile) que les deux pouces du slider horaire restent attrapables quand ils sont proches.

- [ ] **Step 6: Commit**

```bash
git add reeltime-v2/apps/web/src/components/filters/
git commit -m "feat(web): ville comme dimension de filtre, retrait du select departement"
```

---

## Notes d'exécution

- Les tâches 4, 5 et 6 forment une migration : la 4 casse le typecheck et la 6 le rétablit. Ne pas s'arrêter entre elles sur un dépôt qu'on veut voir compiler.
- Aucun changement côté `apps/api`. Le paramètre `minTime` de l'API et son schéma Zod restent en place.
- `SoireePage` importe `normalizeText` depuis `useFilteredFilms` mais pas le hook lui-même : le changement de signature ne l'affecte pas.
