# Refonte de « Planifier ma soirée » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer `/soiree` en un écran unique où choisir une séance l'ajoute immédiatement à la soirée, où version et cinéma se filtrent, et où le temps de trajet entre salles est déduit du battement.

**Architecture:** La soirée persistée devient l'ancre des suggestions — « avant » depuis son premier film, « après » depuis son dernier — au lieu d'un état d'ancre local. La logique nouvelle (trajet, filtres, tris) sort dans des modules purs testables (`utils/travel.ts`, `utils/soireeFilters.ts`), `findChainable` les consomme via injection, et `SoireePage` éclate en quatre composants de présentation.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind 3, Zustand (persist), React Query 5, Vitest.

## Global Constraints

- Tous les commentaires et libellés d'interface sont en **français**.
- Les tests tournent avec `pnpm --filter @reeltime/web test` depuis `reeltime-v2/`. Un seul fichier : `pnpm --filter @reeltime/web test -- src/__tests__/travel.test.ts`.
- Aucune nouvelle dépendance npm.
- Les commentaires expliquent **pourquoi**, jamais **quoi** — c'est la convention du dépôt, voir `chaining.ts` et `soireeStore.ts`.
- `VO` en filtre retient les séances `VO` **et** `VOST`, exactement comme `useFilteredFilms.ts:70`.
- Une liste de cinémas sélectionnés vide signifie « tous les cinémas », jamais « aucun ».
- `filtersStore` n'est jamais écrit depuis `/soiree` : lecture au montage uniquement.
- Classes Tailwind du thème existant : `bg-creme-ecran`, `bg-beige-papier`, `border-sepia-chaud`, `text-noir-velours`, `text-rouge-cinema`, `text-or-antique`, `border-bordeaux-profond`. Polices : `font-bebas` (titres/labels), `font-playfair` (titres de film), `font-crimson` (texte courant).

---

## Structure des fichiers

| Fichier | Responsabilité | Tâche |
|---------|----------------|-------|
| `apps/web/src/utils/travel.ts` | Haversine + conversion en minutes de marche. Pur. | 1 |
| `apps/web/src/api/cinemasApi.ts` | Conserver `latitude`/`longitude` dans `CinemaItem`. | 1 |
| `apps/web/src/utils/chaining.ts` | `travelMin` / `slackMin` sur `ChainCandidate`, injection du trajet. | 2 |
| `apps/web/src/hooks/useTravelMinutes.ts` | `(fromCinemaId, toCinemaId) => number` depuis `useCinemas`. | 3 |
| `apps/web/src/components/soiree/SoireeTimeline.tsx` | `travelMin` optionnel sur `SoireeGapRow`, VF affichée. | 3 |
| `apps/web/src/utils/soireeFilters.ts` | Filtres version/cinéma/même-cinéma et tris. Pur. | 4 |
| `apps/web/src/components/soiree/SoireeFilters.tsx` | Bloc de filtres d'en-tête. | 5 |
| `apps/web/src/components/soiree/SoireePlan.tsx` | « Ma soirée du … » : timeline, état vide, tout effacer. | 6 |
| `apps/web/src/components/soiree/CandidateList.tsx` | Un bloc de suggestions : titre, lignes, états vides. | 7 |
| `apps/web/src/components/soiree/CandidateRow.tsx` | VF affichée, trajet affiché, `onChain` supprimé. | 7 |
| `apps/web/src/components/soiree/FilmPicker.tsx` | Recherche + liste de films + puces de séances. | 8 |
| `apps/web/src/pages/SoireePage.tsx` | Orchestration. | 9 |

---

### Task 1: Estimation du temps de trajet

**Files:**
- Create: `apps/web/src/utils/travel.ts`
- Test: `apps/web/src/__tests__/travel.test.ts`
- Modify: `apps/web/src/api/cinemasApi.ts`

**Interfaces:**
- Consumes: rien.
- Produces: `haversineMeters(a: GeoPoint, b: GeoPoint): number | null`, `travelMinutes(from: TravelCinema, to: TravelCinema): number`, `interface GeoPoint { latitude: number | null; longitude: number | null }`, `interface TravelCinema extends GeoPoint { id: string }`. `CinemaItem` gagne `latitude: number | null` et `longitude: number | null`.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `apps/web/src/__tests__/travel.test.ts`. Les coordonnées viennent de `apps/api/src/config/cinemas.ts`.

```ts
import { describe, it, expect } from 'vitest';
import { haversineMeters, travelMinutes } from '../utils/travel';

const STUDIOS = { id: 'P0153', latitude: 48.3886, longitude: -4.4942 };
const CELTIC = { id: 'P0151', latitude: 48.3897, longitude: -4.4864 };
const LIBERTE = { id: 'P0417', latitude: 48.3904, longitude: -4.4861 };
const CAPUCINS = { id: 'W2920', latitude: 48.3838, longitude: -4.4977 };
const SANS_COORDS = { id: 'X0000', latitude: null, longitude: null };

describe('haversineMeters', () => {
  it('mesure environ 590 m entre Les Studios et Le Celtic', () => {
    const d = haversineMeters(STUDIOS, CELTIC);
    expect(d).not.toBeNull();
    expect(d as number).toBeGreaterThan(500);
    expect(d as number).toBeLessThan(700);
  });

  it('est symétrique', () => {
    expect(haversineMeters(STUDIOS, CELTIC)).toBeCloseTo(
      haversineMeters(CELTIC, STUDIOS) as number,
      6,
    );
  });

  it('vaut 0 entre un point et lui-même', () => {
    expect(haversineMeters(STUDIOS, STUDIOS)).toBeCloseTo(0, 6);
  });

  it('retourne null si une coordonnée manque', () => {
    expect(haversineMeters(STUDIOS, SANS_COORDS)).toBeNull();
    expect(haversineMeters(SANS_COORDS, STUDIOS)).toBeNull();
  });
});

describe('travelMinutes', () => {
  it('ne compte aucun trajet dans la même salle', () => {
    expect(travelMinutes(STUDIOS, { ...STUDIOS })).toBe(0);
  });

  it('compte 10 min entre Les Studios et Le Celtic', () => {
    expect(travelMinutes(STUDIOS, CELTIC)).toBe(10);
  });

  it('compte 20 min entre Pathé Capucins et le Multiplexe Liberté', () => {
    expect(travelMinutes(CAPUCINS, LIBERTE)).toBe(20);
  });

  // Le Celtic et Liberté sont à 80 m : l'arrondi au multiple de 5 donnerait 0,
  // or deux salles distinctes ne sont jamais à zéro minute l'une de l'autre.
  it('applique un plancher de 5 min entre deux salles distinctes très proches', () => {
    expect(travelMinutes(CELTIC, LIBERTE)).toBe(5);
  });

  it('est symétrique', () => {
    expect(travelMinutes(STUDIOS, CAPUCINS)).toBe(travelMinutes(CAPUCINS, STUDIOS));
  });

  // Mieux vaut ne rien déduire que déduire n'importe quoi : un cinéma sans
  // coordonnées ne doit pas faire disparaître ses séances des suggestions.
  it('ne compte aucun trajet si une coordonnée manque', () => {
    expect(travelMinutes(STUDIOS, SANS_COORDS)).toBe(0);
    expect(travelMinutes(SANS_COORDS, STUDIOS)).toBe(0);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
pnpm --filter @reeltime/web test -- src/__tests__/travel.test.ts
```

Attendu : ÉCHEC, `Failed to resolve import "../utils/travel"`.

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `apps/web/src/utils/travel.ts` :

```ts
/** Rayon moyen de la Terre, en mètres. */
const EARTH_RADIUS_M = 6_371_000;

/** Vitesse de marche retenue, en mètres par minute (~4,8 km/h). */
export const WALK_SPEED_M_PER_MIN = 80;

/** Les rues ne sont pas des lignes droites : majoration du vol d'oiseau. */
export const DETOUR_FACTOR = 1.3;

/** Annoncer « 7 min de trajet » serait une précision que ce calcul n'a pas. */
const ROUNDING_MIN = 5;

export interface GeoPoint {
  latitude: number | null;
  longitude: number | null;
}

export interface TravelCinema extends GeoPoint {
  id: string;
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Distance à vol d'oiseau. `null` dès qu'une coordonnée manque. */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number | null {
  if (a.latitude == null || a.longitude == null || b.latitude == null || b.longitude == null) {
    return null;
  }
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

/**
 * Trajet à pied estimé entre deux salles, arrondi au multiple de 5 minutes.
 * `0` pour la même salle ou pour un cinéma sans coordonnées : sans données, ne
 * rien déduire vaut mieux que retrancher un forfait arbitraire.
 */
export function travelMinutes(from: TravelCinema, to: TravelCinema): number {
  if (from.id === to.id) return 0;
  const meters = haversineMeters(from, to);
  if (meters == null) return 0;
  const minutes = (meters * DETOUR_FACTOR) / WALK_SPEED_M_PER_MIN;
  const rounded = Math.round(minutes / ROUNDING_MIN) * ROUNDING_MIN;
  return Math.max(rounded, ROUNDING_MIN);
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

```bash
pnpm --filter @reeltime/web test -- src/__tests__/travel.test.ts
```

Attendu : PASS, 10 tests.

- [ ] **Step 5: Conserver les coordonnées côté web**

Dans `apps/web/src/api/cinemasApi.ts`, l'API les renvoie déjà mais le mapper les jette. Remplacer l'interface `CinemaItem` et le corps de `fetchCinemas` :

```ts
export interface CinemaItem {
  id: string;
  name: string;
  allocineId: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
}
```

```ts
export async function fetchCinemas(): Promise<CinemaItem[]> {
  const response = await apiFetch<CinemasApiResponse>('/api/v1/cinemas');
  return response.data.map((c) => ({
    id: c.allocineId,
    name: c.name,
    allocineId: c.allocineId,
    city: c.city,
    latitude: c.latitude,
    longitude: c.longitude,
  }));
}
```

- [ ] **Step 6: Vérifier la compilation et l'ensemble des tests**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : aucune erreur.

```bash
pnpm --filter @reeltime/web test
```

Attendu : PASS sur tous les fichiers.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/utils/travel.ts apps/web/src/__tests__/travel.test.ts apps/web/src/api/cinemasApi.ts
git commit -m "feat(web): estimation du temps de trajet entre salles"
```

---

### Task 2: `findChainable` déduit le trajet

**Files:**
- Modify: `apps/web/src/utils/chaining.ts`
- Test: `apps/web/src/__tests__/chaining.test.ts`

**Interfaces:**
- Consumes: rien de la tâche 1 (l'injection découple les deux modules).
- Produces: `ChainCandidate` gagne `travelMin: number` et `slackMin: number`. `FindChainableOptions` gagne `travelMinutesBetween?: (fromCinemaId: string, toCinemaId: string) => number`.

**Sémantique à respecter :** `gapMin` reste `début(suivant) − fin(précédent)`, inchangé. `slackMin = gapMin − travelMin` est le temps réellement libre, et c'est **lui** qui décide de la faisabilité (`>= -OVERLAP_TOLERANCE_MIN`) et de la tolérance d'attente (`<= maxGapMin`). Conséquence voulue : un battement brut de 1h05 dont 30 min de marche reste acceptable sous un plafond d'1h, parce qu'on n'y poireaute que 35 min.

- [ ] **Step 1: Écrire les tests qui échouent**

Ajouter à la fin de `apps/web/src/__tests__/chaining.test.ts`. Le fichier définit déjà `showtime`, `film`, `cityOf`, `ANCHOR` (18:00) et `ANCHOR_FILM` (100 min → fin estimée 19:55) ; les réutiliser.

```ts
describe('findChainable — temps de trajet', () => {
  /** Salles éloignées : une demi-heure de marche entre deux cinémas distincts. */
  const travelOf = (a: string, b: string) => (a === b ? 0 : 30);

  it('laisse gapMin brut et met slackMin à sa valeur quand aucun trajet n est injecté', () => {
    const next = showtime('n1', '20:15');
    const [candidate] = findChainable({
      films: [ANCHOR_FILM, film('f1', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
    });
    expect(candidate.gapMin).toBe(20);
    expect(candidate.travelMin).toBe(0);
    expect(candidate.slackMin).toBe(20);
  });

  it('ne compte aucun trajet entre deux séances du même cinéma', () => {
    const next = showtime('n2', '20:15', 'celtic');
    const [candidate] = findChainable({
      films: [ANCHOR_FILM, film('f2', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
      travelMinutesBetween: travelOf,
    });
    expect(candidate.travelMin).toBe(0);
    expect(candidate.slackMin).toBe(20);
  });

  // 20:05 laisse 10 min brutes : jouable dans la même salle, infaisable après
  // une demi-heure de marche.
  it('écarte un candidat que le trajet rend infaisable', () => {
    const next = showtime('n3', '20:05', 'studios');
    const options = {
      films: [ANCHOR_FILM, film('f3', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after' as const,
      cityOf,
    };
    expect(findChainable(options)).toHaveLength(1);
    expect(findChainable({ ...options, travelMinutesBetween: travelOf })).toHaveLength(0);
  });

  // Le plafond de battement borne le temps mort, pas le temps total : 1h10
  // brutes dont 30 min de marche, c'est 40 min d'attente, donc acceptable.
  it('accepte un battement brut supérieur au plafond quand le trajet en absorbe une part', () => {
    const next = showtime('n4', '21:05', 'studios');
    const options = {
      films: [ANCHOR_FILM, film('f4', 90, [next])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after' as const,
      cityOf,
      maxGapMin: 60,
    };
    expect(findChainable(options)).toHaveLength(0);
    const [candidate] = findChainable({ ...options, travelMinutesBetween: travelOf });
    expect(candidate.gapMin).toBe(70);
    expect(candidate.travelMin).toBe(30);
    expect(candidate.slackMin).toBe(40);
  });

  it('déduit aussi le trajet dans la direction « avant »', () => {
    // Film de 90 min commençant à 16:00 → fin estimée 17:45, soit 15 min avant
    // l'ancre de 18:00 ; la marche de 30 min rend l'enchaînement impossible.
    const prev = showtime('p1', '16:00', 'studios');
    const options = {
      films: [ANCHOR_FILM, film('f5', 90, [prev])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'before' as const,
      cityOf,
    };
    expect(findChainable(options)).toHaveLength(1);
    expect(findChainable({ ...options, travelMinutesBetween: travelOf })).toHaveLength(0);
  });

  it('ordonne à cinéma égal sur le temps libre, pas sur le battement brut', () => {
    // Même cinéma, 20 min libres. Autre cinéma, 35 min brutes → 5 min libres.
    const proche = showtime('s1', '20:15', 'celtic');
    const loin = showtime('s2', '20:30', 'studios');
    const candidates = findChainable({
      films: [ANCHOR_FILM, film('f6', 90, [proche]), film('f7', 90, [loin])],
      anchorFilm: ANCHOR_FILM,
      anchor: ANCHOR,
      direction: 'after',
      cityOf,
      travelMinutesBetween: travelOf,
    });
    // Le même cinéma passe devant quoi qu'il arrive, mais les deux valeurs
    // doivent être calculées sur le temps libre.
    expect(candidates.map((c) => c.slackMin)).toEqual([20, 5]);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
pnpm --filter @reeltime/web test -- src/__tests__/chaining.test.ts
```

Attendu : ÉCHEC, `travelMin` et `slackMin` valent `undefined`, et les tests d'exclusion trouvent 1 candidat au lieu de 0.

- [ ] **Step 3: Étendre `ChainCandidate` et les options**

Dans `apps/web/src/utils/chaining.ts`, remplacer l'interface `ChainCandidate` :

```ts
export interface ChainCandidate {
  film: FilmListItem;
  showtime: ShowtimeEntry;
  /** Minutes entre la fin du premier film et le début du suivant (négatif = chevauchement). */
  gapMin: number;
  /** Trajet estimé entre les deux salles. 0 pour la même salle ou sans coordonnées. */
  travelMin: number;
  /** `gapMin - travelMin` : le temps réellement libre. C'est lui qui décide de la faisabilité. */
  slackMin: number;
  sameCinema: boolean;
  /** True when at least one runtime was unknown and estimated. */
  approx: boolean;
}
```

Ajouter le champ à `FindChainableOptions` :

```ts
  /** Trajet entre deux salles, en minutes. Absent = aucun trajet compté. */
  travelMinutesBetween?: (fromCinemaId: string, toCinemaId: string) => number;
```

- [ ] **Step 4: Câbler le calcul dans `findChainable`**

Ajouter `travelMinutesBetween` à la déstructuration des paramètres, puis, dans la boucle interne, remplacer le bloc allant du calcul de `gapMin` jusqu'au `candidates.push` :

```ts
      const start = toMinutes(st.time);
      let gapMin: number;
      let approx: boolean;

      if (direction === 'after') {
        gapMin = start - anchorEnd;
        approx = anchorFilm.runtime == null;
      } else {
        gapMin = anchorStart - estimatedEnd(start, film.runtime);
        approx = film.runtime == null;
      }

      // Symétrique : l'ordre des salles n'influe pas sur la distance, la
      // direction n'a donc pas à être répercutée ici.
      const travelMin = travelMinutesBetween
        ? travelMinutesBetween(anchor.cinemaId, st.cinemaId)
        : 0;
      const slackMin = gapMin - travelMin;

      if (slackMin < -OVERLAP_TOLERANCE_MIN || slackMin > maxGapMin) continue;

      candidates.push({
        film,
        showtime: st,
        gapMin,
        travelMin,
        slackMin,
        sameCinema: st.cinemaId === anchor.cinemaId,
        approx,
      });
```

Puis, dans le tri final, remplacer `Math.abs(a.gapMin) - Math.abs(b.gapMin)` par :

```ts
    return Math.abs(a.slackMin) - Math.abs(b.slackMin);
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm --filter @reeltime/web test -- src/__tests__/chaining.test.ts
```

Attendu : PASS, y compris les tests préexistants — ils n'injectent pas de trajet, donc `slackMin === gapMin` et le comportement est inchangé.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/utils/chaining.ts apps/web/src/__tests__/chaining.test.ts
git commit -m "feat(web): findChainable deduit le temps de trajet du battement"
```

---

### Task 3: Trajet affiché dans les timelines, VF affichée

**Files:**
- Create: `apps/web/src/hooks/useTravelMinutes.ts`
- Modify: `apps/web/src/components/soiree/SoireeTimeline.tsx`
- Modify: `apps/web/src/components/soiree/SoireeBar.tsx`
- Modify: `apps/web/src/pages/MesSoireesPage.tsx`

**Interfaces:**
- Consumes: `travelMinutes` et `TravelCinema` (tâche 1), `travelMinutesBetween` sur `findChainable` et `slackMin` sur `ChainCandidate` (tâche 2).
- Produces: `useTravelMinutes(): (fromCinemaId: string, toCinemaId: string) => number`. `SoireeGapRow` accepte une prop optionnelle `travelMin?: number`.

- [ ] **Step 1: Créer le hook**

Créer `apps/web/src/hooks/useTravelMinutes.ts` :

```ts
import { useCallback, useMemo } from 'react';
import { useCinemas } from './useCinemas';
import { travelMinutes, type TravelCinema } from '../utils/travel';

/**
 * Trajet entre deux salles depuis leurs identifiants. `0` pour un identifiant
 * inconnu : une salle absente du référentiel ne doit pas faire disparaître ses
 * séances des suggestions.
 */
export function useTravelMinutes(): (fromCinemaId: string, toCinemaId: string) => number {
  const { data: cinemas = [] } = useCinemas();

  const byId = useMemo(() => {
    const map = new Map<string, TravelCinema>();
    for (const c of cinemas) {
      map.set(c.id, { id: c.id, latitude: c.latitude, longitude: c.longitude });
    }
    return map;
  }, [cinemas]);

  return useCallback(
    (fromCinemaId: string, toCinemaId: string) => {
      const from = byId.get(fromCinemaId);
      const to = byId.get(toCinemaId);
      if (!from || !to) return 0;
      return travelMinutes(from, to);
    },
    [byId],
  );
}
```

- [ ] **Step 2: Afficher le trajet et la VF dans la timeline**

Dans `apps/web/src/components/soiree/SoireeTimeline.tsx`, remplacer `SoireeGapRow` :

```tsx
export function SoireeGapRow({
  prev,
  next,
  travelMin = 0,
}: {
  prev: SoireeItem;
  next: SoireeItem;
  /** Trajet estimé entre les deux salles. Absent = aucun trajet compté. */
  travelMin?: number;
}) {
  const gap = toMinutes(next.time) - estimatedEnd(toMinutes(prev.time), prev.runtime);
  // Le libellé qualifie le temps LIBRE : annoncer « enchaînement direct » pour
  // cinq minutes de battement et un quart d'heure de marche serait faux.
  const slack = gap - travelMin;
  const overlap = slack < -OVERLAP_TOLERANCE_MIN;
  return (
    <p
      className={`font-crimson text-xs italic pl-12 py-0.5 ${
        overlap ? 'text-rouge-cinema font-semibold' : 'text-sepia-chaud'
      }`}
    >
      ↓ {formatGap(slack)}
      {travelMin > 0 ? ` · ~${travelMin} min de trajet` : ''}
      {prev.runtime == null ? ' (durée estimée)' : ''}
    </p>
  );
}
```

Dans `SoireeItemRow` du même fichier, remplacer la ligne de version pour que la VF cesse d'être muette :

```tsx
          {item.version && <span className="text-sepia-chaud"> · {item.version}</span>}
```

- [ ] **Step 3: Câbler `SoireeBar`**

Dans `apps/web/src/components/soiree/SoireeBar.tsx` :

Ajouter l'import `import { useTravelMinutes } from '../../hooks/useTravelMinutes';` et, dans le composant, `const travelOf = useTravelMinutes();` juste après les `useSoireeStore`.

Ajouter `travelMinutesBetween: travelOf,` dans les deux appels à `findChainable` (celui de `before` et celui de `after`), et ajouter `travelOf` aux tableaux de dépendances des deux `useMemo`.

Remplacer la ligne `<SoireeGapRow prev={items[idx - 1]} next={item} />` par :

```tsx
                {idx > 0 && (
                  <SoireeGapRow
                    prev={items[idx - 1]}
                    next={item}
                    travelMin={travelOf(items[idx - 1].cinemaId, item.cinemaId)}
                  />
                )}
```

Dans `SuggestionRow`, remplacer la déstructuration et la ligne de description pour parler du temps libre et du trajet :

```tsx
function SuggestionRow({ candidate, city }: { candidate: ChainCandidate; city: string | undefined }) {
  const { film, showtime, slackMin, travelMin, sameCinema } = candidate;
```

```tsx
        <p className="font-crimson text-[11px] italic text-sepia-chaud truncate">
          {timeLabel(showtime.time)} · {getCinemaShortName(showtime.cinemaName)} · {formatGap(slackMin)}
          {travelMin > 0 ? ` · ~${travelMin} min de trajet` : ''}
          {sameCinema ? ' · même ciné' : ''}
        </p>
```

- [ ] **Step 4: Câbler `MesSoireesPage`**

Dans `apps/web/src/pages/MesSoireesPage.tsx`, ajouter l'import `import { useTravelMinutes } from '../hooks/useTravelMinutes';`, puis `const travelOf = useTravelMinutes();` dans le composant, et remplacer le `SoireeGapRow` :

```tsx
                      {idx > 0 && (
                        <SoireeGapRow
                          prev={items[idx - 1]}
                          next={item}
                          travelMin={travelOf(items[idx - 1].cinemaId, item.cinemaId)}
                        />
                      )}
```

- [ ] **Step 5: Vérifier la compilation et les tests**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : aucune erreur.

```bash
pnpm --filter @reeltime/web test
```

Attendu : PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/hooks/useTravelMinutes.ts apps/web/src/components/soiree/SoireeTimeline.tsx apps/web/src/components/soiree/SoireeBar.tsx apps/web/src/pages/MesSoireesPage.tsx
git commit -m "feat(web): trajet affiche dans les timelines, version toujours visible"
```

---

### Task 4: Filtres et tris des candidats

**Files:**
- Create: `apps/web/src/utils/soireeFilters.ts`
- Test: `apps/web/src/__tests__/soireeFilters.test.ts`

**Interfaces:**
- Consumes: `ChainCandidate` et `toMinutes` (`utils/chaining`).
- Produces: `type VersionFilter = 'all' | 'VF' | 'VO'`, `type CandidateSort = 'chain' | 'time' | 'rating' | 'cinema'`, `matchesVersion`, `matchesCinemas`, `filterCandidates`, `sortCandidates`, `CANDIDATE_SORT_OPTIONS`, `SOIREE_VERSION_OPTIONS`, `interface CandidateFilters { version: VersionFilter; cinemas: string[]; sameCinemaOnly: boolean }`.

- [ ] **Step 1: Écrire les tests qui échouent**

Créer `apps/web/src/__tests__/soireeFilters.test.ts` :

```ts
import { describe, it, expect } from 'vitest';
import {
  filterCandidates,
  matchesCinemas,
  matchesVersion,
  sortCandidates,
} from '../utils/soireeFilters';
import type { ChainCandidate } from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

function candidate(
  id: string,
  time: string,
  cinemaId: string,
  cinemaName: string,
  version: ShowtimeEntry['version'],
  letterboxdRating: number | null,
  slackMin: number,
  sameCinema: boolean,
): ChainCandidate {
  const showtime: ShowtimeEntry = {
    id,
    filmId: `film-${id}`,
    cinemaId,
    cinemaName,
    datetime: `2026-08-14T${time}:00`,
    time,
    version,
    bookingUrl: null,
  };
  const film = {
    id: `film-${id}`,
    title: `Film ${id}`,
    year: 2026,
    posterUrl: null,
    rating: null,
    letterboxdRating,
    filmAge: null,
    synopsis: null,
    director: null,
    cast: [],
    genres: [],
    runtime: 100,
    letterboxdUrl: null,
    showtimes: [showtime],
  } satisfies FilmListItem;
  return { film, showtime, gapMin: slackMin, travelMin: 0, slackMin, sameCinema, approx: false };
}

const VF_CELTIC = candidate('a', '20:00', 'celtic', 'CGR Le Celtic', 'VF', 3.5, 30, true);
const VOST_STUDIOS = candidate('b', '19:00', 'studios', 'Les Studios', 'VOST', 4.2, 10, false);
const VO_LIBERTE = candidate('c', '21:00', 'liberte', 'Multiplexe Liberté', 'VO', null, 20, false);

const ALL = [VF_CELTIC, VOST_STUDIOS, VO_LIBERTE];
const NO_FILTER = { version: 'all' as const, cinemas: [], sameCinemaOnly: false };

describe('matchesVersion', () => {
  it('laisse tout passer sans filtre', () => {
    expect(matchesVersion('VF', 'all')).toBe(true);
    expect(matchesVersion('VOST', 'all')).toBe(true);
  });

  it('ne retient que la VF', () => {
    expect(matchesVersion('VF', 'VF')).toBe(true);
    expect(matchesVersion('VO', 'VF')).toBe(false);
    expect(matchesVersion('VOST', 'VF')).toBe(false);
  });

  // Même convention que le filtre de l'affiche (useFilteredFilms) : « VO »
  // englobe les séances sous-titrées.
  it('retient VO et VOST sous le filtre VO', () => {
    expect(matchesVersion('VO', 'VO')).toBe(true);
    expect(matchesVersion('VOST', 'VO')).toBe(true);
    expect(matchesVersion('VF', 'VO')).toBe(false);
  });
});

describe('matchesCinemas', () => {
  it('traite la liste vide comme « tous les cinémas »', () => {
    expect(matchesCinemas('celtic', [])).toBe(true);
  });

  it('retient les cinémas listés et écarte les autres', () => {
    expect(matchesCinemas('celtic', ['celtic', 'studios'])).toBe(true);
    expect(matchesCinemas('liberte', ['celtic', 'studios'])).toBe(false);
  });
});

describe('filterCandidates', () => {
  it('ne retire rien sans filtre', () => {
    expect(filterCandidates(ALL, NO_FILTER)).toHaveLength(3);
  });

  it('filtre sur la version', () => {
    expect(filterCandidates(ALL, { ...NO_FILTER, version: 'VO' })).toEqual([
      VOST_STUDIOS,
      VO_LIBERTE,
    ]);
    expect(filterCandidates(ALL, { ...NO_FILTER, version: 'VF' })).toEqual([VF_CELTIC]);
  });

  it('filtre sur les cinémas', () => {
    expect(filterCandidates(ALL, { ...NO_FILTER, cinemas: ['studios'] })).toEqual([VOST_STUDIOS]);
  });

  it('ne retient que le cinéma de l ancre quand « même cinéma » est actif', () => {
    expect(filterCandidates(ALL, { ...NO_FILTER, sameCinemaOnly: true })).toEqual([VF_CELTIC]);
  });

  it('combine les filtres', () => {
    expect(filterCandidates(ALL, { version: 'VO', cinemas: ['liberte'], sameCinemaOnly: false })).toEqual([
      VO_LIBERTE,
    ]);
  });
});

describe('sortCandidates', () => {
  it('préserve l ordre de findChainable pour « meilleur enchaînement »', () => {
    expect(sortCandidates(ALL, 'chain')).toEqual(ALL);
  });

  it('trie par heure de début croissante', () => {
    expect(sortCandidates(ALL, 'time').map((c) => c.showtime.time)).toEqual([
      '19:00',
      '20:00',
      '21:00',
    ]);
  });

  it('trie par note décroissante, les films sans note en dernier', () => {
    expect(sortCandidates(ALL, 'rating').map((c) => c.film.letterboxdRating)).toEqual([
      4.2,
      3.5,
      null,
    ]);
  });

  it('trie par cinéma A→Z puis par heure', () => {
    expect(sortCandidates(ALL, 'cinema').map((c) => c.showtime.cinemaName)).toEqual([
      'CGR Le Celtic',
      'Les Studios',
      'Multiplexe Liberté',
    ]);
  });

  it('ne mute pas le tableau reçu', () => {
    const input = [...ALL];
    sortCandidates(input, 'time');
    expect(input).toEqual(ALL);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

```bash
pnpm --filter @reeltime/web test -- src/__tests__/soireeFilters.test.ts
```

Attendu : ÉCHEC, `Failed to resolve import "../utils/soireeFilters"`.

- [ ] **Step 3: Écrire l'implémentation**

Créer `apps/web/src/utils/soireeFilters.ts` :

```ts
import { toMinutes, type ChainCandidate } from './chaining';
import type { ShowtimeEntry } from '../types/components';

export type VersionFilter = 'all' | 'VF' | 'VO';

export const SOIREE_VERSION_OPTIONS: { value: VersionFilter; label: string }[] = [
  { value: 'all', label: 'Toutes versions' },
  { value: 'VF', label: 'VF' },
  { value: 'VO', label: 'VO/VOST' },
];

export type CandidateSort = 'chain' | 'time' | 'rating' | 'cinema';

export const CANDIDATE_SORT_OPTIONS: { value: CandidateSort; label: string }[] = [
  // Nommé d'après ce qu'il fait : même cinéma d'abord, puis le moins de temps mort.
  { value: 'chain', label: 'Meilleur enchaînement' },
  { value: 'time', label: 'Heure de début' },
  { value: 'rating', label: 'Note Letterboxd' },
  { value: 'cinema', label: 'Cinéma' },
];

/** `VO` englobe les séances sous-titrées, comme le filtre de l'affiche. */
export function matchesVersion(version: ShowtimeEntry['version'], filter: VersionFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'VF') return version === 'VF';
  return version === 'VO' || version === 'VOST';
}

/** Aucune salle cochée signifie « toutes », jamais « aucune ». */
export function matchesCinemas(cinemaId: string, selected: string[]): boolean {
  return selected.length === 0 || selected.includes(cinemaId);
}

export interface CandidateFilters {
  version: VersionFilter;
  cinemas: string[];
  /** Ne garder que les séances jouées dans la salle du film d'ancrage. */
  sameCinemaOnly: boolean;
}

export function filterCandidates(
  candidates: ChainCandidate[],
  filters: CandidateFilters,
): ChainCandidate[] {
  return candidates.filter((c) => {
    if (!matchesVersion(c.showtime.version, filters.version)) return false;
    if (!matchesCinemas(c.showtime.cinemaId, filters.cinemas)) return false;
    if (filters.sameCinemaOnly && !c.sameCinema) return false;
    return true;
  });
}

export function sortCandidates(
  candidates: ChainCandidate[],
  sort: CandidateSort,
): ChainCandidate[] {
  // `findChainable` classe déjà même-cinéma d'abord puis par temps mort.
  if (sort === 'chain') return candidates;
  const sorted = [...candidates];
  if (sort === 'time') {
    sorted.sort((a, b) => toMinutes(a.showtime.time) - toMinutes(b.showtime.time));
  } else if (sort === 'rating') {
    sorted.sort((a, b) => (b.film.letterboxdRating ?? -1) - (a.film.letterboxdRating ?? -1));
  } else {
    sorted.sort((a, b) => {
      const byCinema = a.showtime.cinemaName.localeCompare(b.showtime.cinemaName, 'fr');
      return byCinema !== 0 ? byCinema : toMinutes(a.showtime.time) - toMinutes(b.showtime.time);
    });
  }
  return sorted;
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

```bash
pnpm --filter @reeltime/web test -- src/__tests__/soireeFilters.test.ts
```

Attendu : PASS, 15 tests.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/utils/soireeFilters.ts apps/web/src/__tests__/soireeFilters.test.ts
git commit -m "feat(web): filtres version/cinema et tris des candidats de soiree"
```

---

### Task 5: Bloc de filtres d'en-tête

**Files:**
- Create: `apps/web/src/components/soiree/SoireeFilters.tsx`

**Interfaces:**
- Consumes: `VersionFilter`, `SOIREE_VERSION_OPTIONS` (tâche 4), `CinemaItem` (`api/cinemasApi`).
- Produces: composant `SoireeFilters` avec les props listées ci-dessous, et la constante exportée `SOIREE_SELECT_CLASS` réutilisée par `CandidateList` en tâche 7.

Composant purement présentationnel : aucun état interne, aucun accès au store.

- [ ] **Step 1: Créer le composant**

Créer `apps/web/src/components/soiree/SoireeFilters.tsx` :

```tsx
import { SOIREE_VERSION_OPTIONS, type VersionFilter } from '../../utils/soireeFilters';
import { getCinemaShortName } from '../../utils/cinemaNames';
import type { CinemaItem } from '../../api/cinemasApi';

/** Style partagé par tous les `select` de la page. */
export const SOIREE_SELECT_CLASS =
  'font-crimson px-2 py-2 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-xs focus:outline-none focus:border-rouge-cinema focus:ring-2 focus:ring-rouge-cinema/20';

const START_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Toute la journée' },
  { value: '14:00', label: 'À partir de 14h' },
  { value: '17:00', label: 'À partir de 17h' },
  { value: '18:00', label: 'À partir de 18h' },
  { value: '19:00', label: 'À partir de 19h' },
  { value: '20:00', label: 'À partir de 20h' },
];

interface SoireeFiltersProps {
  cities: string[];
  city: string;
  onCityChange: (city: string) => void;
  minStart: string;
  onMinStartChange: (minStart: string) => void;
  version: VersionFilter;
  onVersionChange: (version: VersionFilter) => void;
  /** Cinémas de la ville courante, dans l'ordre d'affichage. */
  cinemas: CinemaItem[];
  selectedCinemas: string[];
  onToggleCinema: (cinemaId: string) => void;
  sameCinemaOnly: boolean;
  onSameCinemaOnlyChange: (value: boolean) => void;
  /** Masqué tant que la soirée est vide : sans ancre, « même cinéma » n'a pas de sens. */
  showSameCinemaToggle: boolean;
}

export function SoireeFilters({
  cities,
  city,
  onCityChange,
  minStart,
  onMinStartChange,
  version,
  onVersionChange,
  cinemas,
  selectedCinemas,
  onToggleCinema,
  sameCinemaOnly,
  onSameCinemaOnlyChange,
  showSameCinemaToggle,
}: SoireeFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 max-w-2xl">
        <select
          value={city}
          onChange={(e) => onCityChange(e.target.value)}
          className={SOIREE_SELECT_CLASS}
          aria-label="Ville"
        >
          {cities.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={minStart}
          onChange={(e) => onMinStartChange(e.target.value)}
          className={SOIREE_SELECT_CLASS}
          aria-label="Heure de début"
        >
          {START_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={version}
          onChange={(e) => onVersionChange(e.target.value as VersionFilter)}
          className={SOIREE_SELECT_CLASS}
          aria-label="Version"
        >
          {SOIREE_VERSION_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {cinemas.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par cinéma">
          {cinemas.map((c) => {
            const active = selectedCinemas.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onToggleCinema(c.id)}
                aria-pressed={active}
                className={`font-bebas px-3 py-1.5 rounded-full border-2 text-xs uppercase tracking-wide transition-colors ${
                  active
                    ? 'bg-rouge-cinema border-bordeaux-profond text-creme-ecran shadow-md'
                    : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
                }`}
              >
                {getCinemaShortName(c.name)}
              </button>
            );
          })}
          {selectedCinemas.length > 0 && (
            <span className="font-crimson text-xs text-sepia-chaud italic self-center">
              {selectedCinemas.length} salle{selectedCinemas.length > 1 ? 's' : ''} sur {cinemas.length}
            </span>
          )}
        </div>
      )}

      {showSameCinemaToggle && (
        <label className="flex items-center gap-2 font-crimson text-xs text-noir-velours cursor-pointer">
          <input
            type="checkbox"
            checked={sameCinemaOnly}
            onChange={(e) => onSameCinemaOnlyChange(e.target.checked)}
            className="w-4 h-4 accent-rouge-cinema"
          />
          Rester dans le même cinéma
        </label>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : aucune erreur. Le composant n'est encore monté nulle part, c'est normal : la tâche 9 s'en charge.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/soiree/SoireeFilters.tsx
git commit -m "feat(web): bloc de filtres de la page Planifier"
```

---

### Task 6: Bloc « Ma soirée »

**Files:**
- Create: `apps/web/src/components/soiree/SoireePlan.tsx`

**Interfaces:**
- Consumes: `SoireeItem` (`stores/soireeStore`), `SoireeItemRow`, `SoireeGapRow`, `timeLabel`, `endLabel` (`components/soiree/SoireeTimeline`), `formatDayLong` (`utils/dates`).
- Produces: composant `SoireePlan`.

- [ ] **Step 1: Créer le composant**

Créer `apps/web/src/components/soiree/SoireePlan.tsx` :

```tsx
import type { SoireeItem } from '../../stores/soireeStore';
import { SoireeItemRow, SoireeGapRow, timeLabel, endLabel } from './SoireeTimeline';
import { formatDayLong } from '../../utils/dates';

interface SoireePlanProps {
  date: string;
  items: SoireeItem[];
  today: string;
  now: string;
  /** Trajet entre deux salles, injecté pour que le composant reste sans dépendance réseau. */
  travelOf: (fromCinemaId: string, toCinemaId: string) => number;
  onRemove: (showtimeId: string) => void;
  onClear: () => void;
}

export function SoireePlan({
  date,
  items,
  today,
  now,
  travelOf,
  onRemove,
  onClear,
}: SoireePlanProps) {
  if (items.length === 0) {
    return (
      <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-3 sm:p-4 mb-4 text-center">
        <p className="text-2xl mb-1">🍿</p>
        <p className="font-crimson text-sm text-noir-velours">
          Ta soirée du {formatDayLong(date).toLowerCase()} est vide. Choisis une séance ci-dessous
          pour commencer — les films qui s'enchaînent avant et après apparaîtront ensuite.
        </p>
      </div>
    );
  }

  return (
    <section
      aria-label={`Ma soirée du ${formatDayLong(date)}`}
      className="bg-beige-papier border-2 border-sepia-chaud rounded-xl p-3 sm:p-4 mb-4 shadow-md"
    >
      <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2">
        <h2 className="font-bebas text-noir-velours text-lg uppercase tracking-wider">
          🎟 Ma soirée
          <span className="font-crimson text-sm text-sepia-chaud italic normal-case tracking-normal">
            {' '}· {items.length} film{items.length > 1 ? 's' : ''} · {timeLabel(items[0].time)} →{' '}
            {endLabel(items[items.length - 1])}
          </span>
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="font-bebas text-xs text-sepia-chaud hover:text-rouge-cinema uppercase tracking-wide transition-colors"
        >
          Tout effacer
        </button>
      </div>

      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={item.showtimeId}>
            {idx > 0 && (
              <SoireeGapRow
                prev={items[idx - 1]}
                next={item}
                travelMin={travelOf(items[idx - 1].cinemaId, item.cinemaId)}
              />
            )}
            <SoireeItemRow
              item={item}
              past={item.date === today && item.time < now}
              onRemove={() => onRemove(item.showtimeId)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/soiree/SoireePlan.tsx
git commit -m "feat(web): bloc Ma soiree de la page Planifier"
```

---

### Task 7: Liste de suggestions et ligne de candidat

**Files:**
- Create: `apps/web/src/components/soiree/CandidateList.tsx`
- Modify: `apps/web/src/components/soiree/CandidateRow.tsx`

**Interfaces:**
- Consumes: `ChainCandidate`, `formatGap`, `formatDuration` (`utils/chaining`), `SOIREE_SELECT_CLASS` (tâche 5), `CANDIDATE_SORT_OPTIONS`, `CandidateSort` (tâche 4).
- Produces: composant `CandidateList`. `CandidateRow` perd sa prop `onChain`.

- [ ] **Step 1: Réécrire `CandidateRow`**

Remplacer intégralement `apps/web/src/components/soiree/CandidateRow.tsx` :

```tsx
import type { ChainCandidate } from '../../utils/chaining';
import { formatGap } from '../../utils/chaining';
import { getCinemaShortName } from '../../utils/cinemaNames';
import { AddToSoireeButton } from './AddToSoireeButton';

const NO_POSTER = '/images/no-poster.svg';

export function CandidateRow({
  candidate,
  city,
  onClick,
}: {
  candidate: ChainCandidate;
  city: string | undefined;
  onClick: () => void;
}) {
  const { film, showtime, slackMin, travelMin, sameCinema, approx } = candidate;
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
            {/* La VF est une information comme une autre : la taire rendait les
                lignes sans badge ambiguës. */}
            {showtime.version && <span className="text-sepia-chaud"> · {showtime.version}</span>}
          </p>
          <p className="font-crimson text-xs italic text-sepia-chaud">
            {formatGap(slackMin)}
            {travelMin > 0 ? ` · ~${travelMin} min de trajet` : ''}
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

- [ ] **Step 2: Créer `CandidateList`**

Créer `apps/web/src/components/soiree/CandidateList.tsx` :

```tsx
import type { ChainCandidate } from '../../utils/chaining';
import { formatDuration } from '../../utils/chaining';
import { CandidateRow } from './CandidateRow';

interface CandidateListProps {
  title: string;
  candidates: ChainCandidate[];
  /** Nombre de candidats avant application des filtres version/cinéma. */
  unfilteredCount: number;
  cityOf: (cinemaId: string) => string | undefined;
  onOpenFilm: (candidate: ChainCandidate) => void;
  maxGap: number;
  /** Texte de repli quand il n'y a rien à enchaîner, filtres exclus. */
  emptyMessage: string;
  onRelaxFilters: () => void;
}

export function CandidateList({
  title,
  candidates,
  unfilteredCount,
  cityOf,
  onOpenFilm,
  maxGap,
  emptyMessage,
  onRelaxFilters,
}: CandidateListProps) {
  // Deux vides très différents : « rien ne s'enchaîne » se corrige en bougeant
  // l'heure ou le battement, « tes filtres masquent tout » se corrige d'un clic.
  const hiddenByFilters = candidates.length === 0 && unfilteredCount > 0;

  return (
    <section className="mb-5">
      <h3 className="font-bebas text-noir-velours text-base uppercase tracking-wider mb-2 flex items-center gap-2">
        <span className="w-1 h-4 bg-rouge-cinema rounded-full" />
        {title}
        {candidates.length > 0 && (
          <span className="font-crimson text-xs text-sepia-chaud italic normal-case tracking-normal">
            {candidates.length} séance{candidates.length > 1 ? 's' : ''}
          </span>
        )}
      </h3>

      {candidates.length > 0 ? (
        <div className="space-y-2">
          {candidates.map((c) => (
            <CandidateRow
              key={c.showtime.id}
              candidate={c}
              city={cityOf(c.showtime.cinemaId)}
              onClick={() => onOpenFilm(c)}
            />
          ))}
        </div>
      ) : hiddenByFilters ? (
        <div className="font-crimson text-sm text-sepia-chaud italic">
          <p>
            {unfilteredCount} séance{unfilteredCount > 1 ? 's' : ''} s'enchaîne
            {unfilteredCount > 1 ? 'nt' : ''} ici, mais tes filtres de version et de cinéma les
            masquent.
          </p>
          <button
            type="button"
            onClick={onRelaxFilters}
            className="font-bebas mt-1 text-xs text-rouge-cinema uppercase tracking-wide hover:text-bordeaux-profond transition-colors"
          >
            Relâcher les filtres
          </button>
        </div>
      ) : (
        <p className="font-crimson text-sm text-sepia-chaud italic">
          {emptyMessage} (battement max {formatDuration(maxGap)}, même ville)
        </p>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Vérifier la compilation**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : **une erreur attendue** dans `apps/web/src/pages/SoireePage.tsx`, qui passe encore `onChain` à `CandidateRow`. Elle sera résolue en tâche 9. Noter l'erreur et continuer.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/soiree/CandidateList.tsx apps/web/src/components/soiree/CandidateRow.tsx
git commit -m "feat(web): liste de suggestions avec etats vides distincts"
```

---

### Task 8: Sélecteur de film

**Files:**
- Create: `apps/web/src/components/soiree/FilmPicker.tsx`

**Interfaces:**
- Consumes: `FilmListItem`, `ShowtimeEntry` (`types/components`), `getCinemaShortName` (`utils/cinemaNames`).
- Produces: composant `FilmPicker` et le type exporté `PickableFilm = { film: FilmListItem; showtimes: ShowtimeEntry[] }`, consommé par `SoireePage` en tâche 9.

Le parent calcule les séances éligibles ; ce composant ne fait qu'afficher et remonter les clics.

- [ ] **Step 1: Créer le composant**

Créer `apps/web/src/components/soiree/FilmPicker.tsx` :

```tsx
import { useEffect, useState } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../../types/components';
import { getCinemaShortName } from '../../utils/cinemaNames';

const NO_POSTER = '/images/no-poster.svg';

/** Un film et ses seules séances éligibles (jour, ville, heure, version, cinéma). */
export interface PickableFilm {
  film: FilmListItem;
  showtimes: ShowtimeEntry[];
}

interface FilmPickerProps {
  entries: PickableFilm[];
  search: string;
  onSearchChange: (search: string) => void;
  /** Identifiants des séances déjà au plan : leurs puces deviennent inertes. */
  plannedShowtimeIds: Set<string>;
  onPick: (film: FilmListItem, showtime: ShowtimeEntry) => void;
  /** Déplié d'office quand la soirée est vide : c'est alors le sujet de la page. */
  defaultOpen: boolean;
  emptyMessage: string;
}

export function FilmPicker({
  entries,
  search,
  onSearchChange,
  plannedShowtimeIds,
  onPick,
  defaultOpen,
  emptyMessage,
}: FilmPickerProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Le premier ajout fait basculer `defaultOpen` à false : sans cette
  // synchronisation, le bloc resterait déplié et volerait l'écran aux
  // suggestions qui viennent d'apparaître.
  useEffect(() => {
    setOpen(defaultOpen);
  }, [defaultOpen]);
  // Accordéon : une seule ligne dépliée, sinon la liste devient illisible sur mobile.
  const [expandedFilmId, setExpandedFilmId] = useState<string | null>(null);

  return (
    <section className="mb-4">
      {!defaultOpen && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="font-bebas w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-beige-papier border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm uppercase tracking-wide hover:border-rouge-cinema transition-colors"
        >
          <span>🎬 Choisir un autre film</span>
          <svg
            className={`w-5 h-5 text-sepia-chaud shrink-0 transform transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {open && (
        <div className={defaultOpen ? '' : 'mt-3'}>
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher un film..."
            aria-label="Rechercher un film"
            className="font-crimson w-full px-3 py-2 mb-3 bg-creme-ecran border-2 border-sepia-chaud rounded-lg text-noir-velours text-sm placeholder-sepia-chaud/60 focus:outline-none focus:ring-2 focus:ring-rouge-cinema focus:border-rouge-cinema shadow-sm"
          />

          {entries.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🎬</p>
              <p className="font-crimson text-noir-velours">{emptyMessage}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {entries.map(({ film, showtimes }) => {
                const expanded = expandedFilmId === film.id;
                return (
                  <div key={film.id}>
                    <button
                      type="button"
                      onClick={() => setExpandedFilmId(expanded ? null : film.id)}
                      aria-expanded={expanded}
                      className={`w-full text-left bg-creme-ecran border-2 rounded-lg p-2 flex gap-3 items-center transition-colors ${
                        expanded ? 'border-rouge-cinema' : 'border-sepia-chaud hover:border-rouge-cinema'
                      }`}
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
                        <p className="font-bebas text-xs text-sepia-chaud tracking-wide">
                          {film.letterboxdRating != null && (
                            <span className="text-or-antique">★ {film.letterboxdRating.toFixed(1)} · </span>
                          )}
                          {showtimes.length} séance{showtimes.length > 1 ? 's' : ''}
                        </p>
                      </div>
                    </button>

                    {expanded && (
                      <div
                        className="flex flex-wrap gap-1.5 mt-1.5 pl-2"
                        role="group"
                        aria-label={`Séances de ${film.title}`}
                      >
                        {showtimes.map((st) => {
                          const planned = plannedShowtimeIds.has(st.id);
                          return (
                            <button
                              key={st.id}
                              type="button"
                              disabled={planned}
                              onClick={() => {
                                onPick(film, st);
                                setExpandedFilmId(null);
                              }}
                              aria-label={
                                planned
                                  ? `${film.title} à ${st.time} est déjà dans ma soirée`
                                  : `Ajouter ${film.title} à ${st.time} à ma soirée`
                              }
                              className={`font-bebas px-3 py-1.5 rounded-full border-2 text-xs uppercase tracking-wide transition-colors ${
                                planned
                                  ? 'border-or-antique bg-or-antique/20 text-sepia-chaud cursor-default'
                                  : 'bg-creme-ecran border-sepia-chaud text-noir-velours hover:border-rouge-cinema'
                              }`}
                            >
                              {planned ? '✓ ' : '+ '}
                              {st.time} · {getCinemaShortName(st.cinemaName)}
                              {st.version ? ` · ${st.version}` : ''}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : seule l'erreur `onChain` de la tâche 7 subsiste.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/soiree/FilmPicker.tsx
git commit -m "feat(web): selecteur de film avec seances depliables"
```

---

### Task 9: Recomposition de `SoireePage`

**Files:**
- Modify: `apps/web/src/pages/SoireePage.tsx` (réécriture complète)

**Interfaces:**
- Consumes: tout ce qui précède — `SoireeFilters`, `SoireePlan`, `CandidateList`, `FilmPicker`, `PickableFilm`, `useTravelMinutes`, `filterCandidates`, `sortCandidates`, `CANDIDATE_SORT_OPTIONS`, `matchesVersion`, `matchesCinemas`, `SOIREE_SELECT_CLASS`.
- Produces: la page finale. Aucun autre module ne la consomme.

**Ce qui disparaît :** les états `filmId` et `anchorId`, la fonction locale `sortCandidates`, les constantes `START_OPTIONS`, `SORT_OPTIONS`, `CandidateSort`, `selectClass`, le bouton « Changer de film », le bouton « Ajouter cette séance », les puces d'ancre, la fonction `chainFrom`.

- [ ] **Step 1: Réécrire le fichier**

Remplacer intégralement `apps/web/src/pages/SoireePage.tsx` :

```tsx
import { useMemo, useState, useEffect, useCallback } from 'react';
import { WeekNavigator } from '../components/WeekNavigator';
import { DayStrip } from '../components/DayStrip';
import { FilmDrawer } from '../components/FilmDrawer';
import { ErrorState } from '../components/ErrorState';
import { FilmGridSkeleton } from '../components/Skeleton';
import { SoireeFilters, SOIREE_SELECT_CLASS } from '../components/soiree/SoireeFilters';
import { SoireePlan } from '../components/soiree/SoireePlan';
import { CandidateList } from '../components/soiree/CandidateList';
import { FilmPicker, type PickableFilm } from '../components/soiree/FilmPicker';
import { useFilms } from '../hooks/useFilms';
import { useWeekNavigation } from '../hooks/useWeekNavigation';
import { useCinemas } from '../hooks/useCinemas';
import { useFilmDrawer } from '../hooks/useFilmDrawer';
import { useTravelMinutes } from '../hooks/useTravelMinutes';
import { normalizeText } from '../hooks/useFilteredFilms';
import { useFiltersStore } from '../stores/filtersStore';
import { useSoireeStore, addToSoiree, makeSoireeItem } from '../stores/soireeStore';
import { firstSelectableDate, formatWeekLabel, localISODate, nowHHMM, weekDatesFrom } from '../utils/dates';
import { isOptInCity } from '../utils/cinemaFilter';
import {
  CANDIDATE_SORT_OPTIONS,
  filterCandidates,
  matchesCinemas,
  matchesVersion,
  sortCandidates,
  type CandidateSort,
  type VersionFilter,
} from '../utils/soireeFilters';
import { findChainable, formatDuration, MAX_GAP_MIN } from '../utils/chaining';
import type { FilmListItem, ShowtimeEntry } from '../types/components';

/** Référence stable : `?? []` en ligne recréerait un tableau à chaque rendu. */
const NO_FILMS: FilmListItem[] = [];

/** Battements proposés : de « juste le temps de sortir » à « on dîne entre les deux ». */
const GAP_OPTIONS = [30, MAX_GAP_MIN, 90, 120];

export function SoireePage() {
  const { weekOffset, goToNextWeek, goToPrevWeek, goToToday } = useWeekNavigation();
  const { data, isLoading, isError, refetch } = useFilms(weekOffset);
  const weekFilms = data?.films ?? NO_FILMS;
  const weekDates = useMemo(
    () => (data?.meta.weekStart ? weekDatesFrom(data.meta.weekStart) : []),
    [data?.meta.weekStart],
  );
  const weekLabel = formatWeekLabel(data?.meta.weekStart, data?.meta.weekEnd);
  const { data: cinemas = [] } = useCinemas();
  const { isOpen, selectedFilm, openDrawer, closeDrawer } = useFilmDrawer();
  const travelOf = useTravelMinutes();

  const today = localISODate();
  const now = nowHHMM();

  const soirees = useSoireeStore((s) => s.soirees);
  const removeFromSoiree = useSoireeStore((s) => s.remove);
  const clearDate = useSoireeStore((s) => s.clearDate);

  // Les filtres de l'affiche servent de point de départ, jamais de destination :
  // on les recopie au montage et on n'y réécrit rien.
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [city, setCity] = useState(() => useFiltersStore.getState().selectedCity ?? 'Brest');
  const [minStart, setMinStart] = useState('17:00');
  const [version, setVersion] = useState<VersionFilter>(() => {
    const persisted = useFiltersStore.getState().version;
    if (persisted == null) return 'all';
    // `VOST` et `VO` se rangent sous le même filtre, comme sur l'affiche.
    return persisted === 'VF' ? 'VF' : 'VO';
  });
  const [selectedCinemas, setSelectedCinemas] = useState<string[]>(
    () => useFiltersStore.getState().selectedCinemas,
  );
  const [sameCinemaOnly, setSameCinemaOnly] = useState(false);
  const [maxGap, setMaxGap] = useState(MAX_GAP_MIN);
  const [sort, setSort] = useState<CandidateSort>('chain');
  const [search, setSearch] = useState('');

  const isToday = selectedDate === today;
  // Aujourd'hui, une séance déjà commencée n'est plus planifiable : le plancher
  // d'heure suit l'horloge, sinon la page propose encore la séance de 17h à 21h.
  const effectiveMinStart = isToday && now > minStart ? now : minStart;

  // Dès que la date choisie sort de la semaine affichée, on se recale sur son
  // premier jour sélectionnable. Rien à réinitialiser : la soirée vit dans le
  // store, indexée par date.
  useEffect(() => {
    if (weekDates.length === 0) return;
    if (weekDates.includes(selectedDate)) return;
    setSelectedDate(firstSelectableDate(weekDates, today));
  }, [weekDates, today, selectedDate]);

  // Les villes hors zone (Troyes) restent masquées ici comme sur l'affiche, sauf
  // si c'est justement celle qu'on a choisie dans les filtres.
  const cities = useMemo(
    () =>
      [...new Set(cinemas.map((c) => c.city))]
        .filter((c) => !isOptInCity(c) || c === city)
        .sort(),
    [cinemas, city],
  );

  // Ville persistée devenue introuvable (cinéma retiré, filtre exotique) : on se
  // recale plutôt que de laisser un select sur une valeur absente de ses options.
  useEffect(() => {
    if (cities.length > 0 && !cities.includes(city)) setCity(cities[0]);
  }, [cities, city]);

  const cityCinemas = useMemo(
    () => cinemas.filter((c) => c.city === city).sort((a, b) => a.name.localeCompare(b.name, 'fr')),
    [cinemas, city],
  );

  // Une sélection de salles héritée d'une autre ville produirait un filtre
  // invisible qui vide la page : mieux vaut alors ne rien filtrer.
  useEffect(() => {
    setSelectedCinemas((prev) => {
      const kept = prev.filter((id) => cityCinemas.some((c) => c.id === id));
      return kept.length === prev.length ? prev : kept;
    });
  }, [cityCinemas]);

  const toggleCinema = useCallback((cinemaId: string) => {
    setSelectedCinemas((prev) =>
      prev.includes(cinemaId) ? prev.filter((id) => id !== cinemaId) : [...prev, cinemaId],
    );
  }, []);

  const relaxFilters = useCallback(() => {
    setVersion('all');
    setSelectedCinemas([]);
    setSameCinemaOnly(false);
  }, []);

  const cityByCinemaId = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of cinemas) map.set(c.id, c.city);
    return map;
  }, [cinemas]);
  const cityOf = useCallback((cinemaId: string) => cityByCinemaId.get(cinemaId), [cityByCinemaId]);

  const items = useMemo(() => soirees[selectedDate] ?? [], [soirees, selectedDate]);
  const plannedShowtimeIds = useMemo(
    () => new Set(items.map((i) => i.showtimeId)),
    [items],
  );
  const plannedFilmIds = useMemo(() => new Set(items.map((i) => i.filmId)), [items]);

  /** Séances éligibles d'un film : jour, ville, heure, version et cinéma choisis. */
  const eligibleShowtimes = useCallback(
    (film: FilmListItem): ShowtimeEntry[] =>
      film.showtimes
        .filter(
          (st) =>
            st.datetime.slice(0, 10) === selectedDate &&
            cityByCinemaId.get(st.cinemaId) === city &&
            (!effectiveMinStart || st.time >= effectiveMinStart) &&
            matchesVersion(st.version, version) &&
            matchesCinemas(st.cinemaId, selectedCinemas),
        )
        .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, city, effectiveMinStart, cityByCinemaId, version, selectedCinemas],
  );

  const pickableFilms = useMemo<PickableFilm[]>(() => {
    return weekFilms
      .map((film) => ({ film, showtimes: eligibleShowtimes(film) }))
      .filter(({ film, showtimes }) => {
        if (showtimes.length === 0) return false;
        if (search && !normalizeText(film.title).includes(normalizeText(search))) return false;
        return true;
      })
      // La note Letterboxd est celle affichée sur chaque ligne : trier dessus,
      // avec la popularité pour départager les films sans note.
      .sort((a, b) => {
        const byRating = (b.film.letterboxdRating ?? -1) - (a.film.letterboxdRating ?? -1);
        return byRating !== 0 ? byRating : (b.film.rating ?? 0) - (a.film.rating ?? 0);
      });
  }, [weekFilms, eligibleShowtimes, search]);

  const notBefore = isToday ? now : undefined;

  /**
   * La soirée est l'ancre : « avant » part de son premier film, « après » de son
   * dernier. Deux exclusions s'ajoutent à celles de findChainable — les séances
   * déjà au plan, et tout film déjà au plan, qu'on ne veut pas revoir à une
   * autre heure.
   */
  const rawCandidates = useCallback(
    (direction: 'before' | 'after') => {
      if (items.length === 0 || !weekDates.includes(selectedDate)) return [];
      const anchorItem = direction === 'before' ? items[0] : items[items.length - 1];
      const anchor: ShowtimeEntry = {
        id: anchorItem.showtimeId,
        filmId: anchorItem.filmId,
        cinemaId: anchorItem.cinemaId,
        cinemaName: anchorItem.cinemaName,
        datetime: `${anchorItem.date}T${anchorItem.time}:00`,
        time: anchorItem.time,
        version: (anchorItem.version ?? 'VF') as ShowtimeEntry['version'],
        bookingUrl: anchorItem.bookingUrl,
      };
      return findChainable({
        films: weekFilms,
        anchorFilm: { id: anchorItem.filmId, runtime: anchorItem.runtime },
        anchor,
        direction,
        cityOf,
        maxGapMin: maxGap,
        notBefore,
        travelMinutesBetween: travelOf,
      }).filter(
        (c) => !plannedShowtimeIds.has(c.showtime.id) && !plannedFilmIds.has(c.film.id),
      );
    },
    [
      items,
      weekDates,
      selectedDate,
      weekFilms,
      cityOf,
      maxGap,
      notBefore,
      travelOf,
      plannedShowtimeIds,
      plannedFilmIds,
    ],
  );

  const beforeRaw = useMemo(() => rawCandidates('before'), [rawCandidates]);
  const afterRaw = useMemo(() => rawCandidates('after'), [rawCandidates]);

  const candidateFilters = useMemo(
    () => ({ version, cinemas: selectedCinemas, sameCinemaOnly }),
    [version, selectedCinemas, sameCinemaOnly],
  );

  const before = useMemo(
    () => sortCandidates(filterCandidates(beforeRaw, candidateFilters), sort),
    [beforeRaw, candidateFilters, sort],
  );
  const after = useMemo(
    () => sortCandidates(filterCandidates(afterRaw, candidateFilters), sort),
    [afterRaw, candidateFilters, sort],
  );

  const pick = useCallback(
    (film: FilmListItem, showtime: ShowtimeEntry) => {
      addToSoiree(makeSoireeItem(film, showtime, cityOf(showtime.cinemaId)));
    },
    [cityOf],
  );

  const hasPlan = items.length > 0;

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
      <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl md:rounded-2xl p-3 sm:p-5 mb-4 shadow-md">
        <h1 className="font-bebas text-rouge-cinema text-2xl sm:text-3xl uppercase tracking-wider mb-1">
          🍿 Planifier ma soirée
        </h1>
        <p className="font-crimson text-sm text-sepia-chaud italic mb-4">
          Choisis une séance : elle rejoint ta soirée, et ce qui s'enchaîne avant et après apparaît
          aussitôt.
        </p>

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
            onChange={(d) => setSelectedDate(d ?? today)}
            hideAllChip
          />

          <SoireeFilters
            cities={cities}
            city={city}
            onCityChange={setCity}
            minStart={minStart}
            onMinStartChange={setMinStart}
            version={version}
            onVersionChange={setVersion}
            cinemas={cityCinemas}
            selectedCinemas={selectedCinemas}
            onToggleCinema={toggleCinema}
            sameCinemaOnly={sameCinemaOnly}
            onSameCinemaOnlyChange={setSameCinemaOnly}
            showSameCinemaToggle={hasPlan}
          />

          {/* Le plancher effectif diffère alors de l'option affichée : le dire. */}
          {isToday && now > minStart && (
            <p className="font-crimson text-xs text-sepia-chaud italic">
              Séances déjà commencées masquées : aujourd'hui, on part de {now}.
            </p>
          )}
        </div>
      </div>

      {isLoading && <FilmGridSkeleton />}

      {isError && (
        <ErrorState
          message="Impossible de charger les films. Verifiez votre connexion."
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && (
        <>
          <SoireePlan
            date={selectedDate}
            items={items}
            today={today}
            now={now}
            travelOf={travelOf}
            onRemove={(showtimeId) => removeFromSoiree(selectedDate, showtimeId)}
            onClear={() => clearDate(selectedDate)}
          />

          {hasPlan && (
            <>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                <div className="flex items-center gap-2">
                  <label
                    className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide"
                    htmlFor="candidate-sort"
                  >
                    Tri
                  </label>
                  <select
                    id="candidate-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as CandidateSort)}
                    className={SOIREE_SELECT_CLASS}
                  >
                    {CANDIDATE_SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label
                    className="font-bebas text-xs text-sepia-chaud uppercase tracking-wide"
                    htmlFor="candidate-gap"
                  >
                    Battement max
                  </label>
                  <select
                    id="candidate-gap"
                    value={maxGap}
                    onChange={(e) => setMaxGap(Number(e.target.value))}
                    className={SOIREE_SELECT_CLASS}
                  >
                    {GAP_OPTIONS.map((g) => (
                      <option key={g} value={g}>{formatDuration(g)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <CandidateList
                title="Après ta soirée"
                candidates={after}
                unfilteredCount={afterRaw.length}
                cityOf={cityOf}
                onOpenFilm={(c) => openDrawer(c.film)}
                maxGap={maxGap}
                emptyMessage="Aucune séance enchaînable après"
                onRelaxFilters={relaxFilters}
              />

              <CandidateList
                title="Avant ta soirée"
                candidates={before}
                unfilteredCount={beforeRaw.length}
                cityOf={cityOf}
                onOpenFilm={(c) => openDrawer(c.film)}
                maxGap={maxGap}
                emptyMessage={`Aucune séance se terminant juste avant${isToday ? ', séances déjà commencées exclues' : ''}`}
                onRelaxFilters={relaxFilters}
              />
            </>
          )}

          <FilmPicker
            entries={pickableFilms}
            search={search}
            onSearchChange={setSearch}
            plannedShowtimeIds={plannedShowtimeIds}
            onPick={pick}
            defaultOpen={!hasPlan}
            emptyMessage={
              isToday && now > minStart
                ? `Plus aucune séance après ${now} aujourd'hui. Essaie un autre jour, une autre ville ou des filtres plus larges.`
                : 'Aucun film ce jour-là avec ces critères. Essaie un autre jour, une autre ville, une heure plus tôt ou des filtres plus larges.'
            }
          />

          <p className="font-crimson text-[11px] text-sepia-chaud/70 italic mt-4">
            Fins de séances estimées : durée du film + 15 min de publicités. Battement max{' '}
            {formatDuration(maxGap)}, chevauchement toléré 10 min. Les trajets sont estimés à pied
            entre les salles et déduits du battement. « Meilleur enchaînement » remonte d'abord les
            séances du même cinéma, puis celles qui laissent le moins de temps mort.
          </p>
        </>
      )}

      <FilmDrawer
        film={selectedFilm}
        isOpen={isOpen}
        onClose={closeDrawer}
        films={weekFilms}
        cityOf={cityOf}
        onFilmSelect={openDrawer}
      />
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
cd apps/web && npx tsc --noEmit
```

Attendu : aucune erreur. L'erreur `onChain` de la tâche 7 disparaît avec cette réécriture.

- [ ] **Step 3: Vérifier le lint**

```bash
pnpm --filter @reeltime/web lint
```

Attendu : aucune erreur.

- [ ] **Step 4: Lancer toute la suite de tests**

```bash
pnpm --filter @reeltime/web test
```

Attendu : PASS sur `travel.test.ts`, `chaining.test.ts`, `soireeFilters.test.ts`, `ageFilter.test.ts`, `cinemaFilter.test.ts`, `dates.test.ts`, `gestures.test.ts`, `timeRange.test.ts`.

- [ ] **Step 5: Vérification manuelle**

Lancer l'app (`pnpm dev` depuis `reeltime-v2/`, en ayant exporté `DATABASE_URL` au préalable — l'API ne charge pas son `.env`), ouvrir `/soiree` et vérifier, en largeur mobile (375 px) :

1. Soirée vide → pas de blocs Avant/Après, le sélecteur de film est déplié, la case « Rester dans le même cinéma » est absente.
2. Déplier un film, cliquer une séance → elle apparaît immédiatement dans « Ma soirée », les blocs Avant/Après apparaissent, le sélecteur de film se replie derrière « Choisir un autre film ».
3. Toutes les lignes affichent leur version, VF comprise.
4. Filtrer sur VO → la liste de films et les candidats se restreignent ensemble.
5. Cocher une salle → même effet ; décocher toutes les salles rend tous les cinémas.
6. Régler des filtres qui vident un bloc de suggestions → le message compte les séances masquées et « Relâcher les filtres » les fait revenir.
7. Ajouter un candidat → il rejoint la timeline, disparaît des suggestions, et les listes se recalculent autour de la nouvelle borne.
8. Un enchaînement entre deux salles distinctes affiche « ~N min de trajet ».
9. Changer de jour → la soirée affichée change, aucune n'est effacée ; revenir au jour précédent la retrouve intacte.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/SoireePage.tsx
git commit -m "feat(web): page Planifier en ecran unique avec ajout implicite"
```

---

## Vérification finale

- [ ] **Suite complète**

```bash
pnpm --filter @reeltime/web test
```

- [ ] **Build de production**

```bash
pnpm --filter @reeltime/web build
```

Attendu : build réussi, aucun avertissement TypeScript.

- [ ] **Régression sur les pages voisines**

Vérifier que `/mes-soirees` et la barre « Ma soirée » du desktop affichent bien les trajets et les versions VF, et que l'affiche n'a pas vu ses filtres modifiés par un passage sur `/soiree`.
