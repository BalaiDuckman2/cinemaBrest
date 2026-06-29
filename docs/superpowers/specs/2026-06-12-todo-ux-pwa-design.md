# Design : améliorations UX du todo (enchaînement, vue jour, planning, PWA, fluidité)

Date : 2026-06-12
Source : fichier `todo` à la racine du repo (5 demandes), affiné avec l'utilisateur :
enchaînement = bouton par séance **et** mode « planifier ma soirée » ; périmètre
même ville (même cinéma d'abord) ; **semaine réelle lundi→dimanche** (nouvelle
demande) ; vue calendrier = sections par jour ; PWA avec hors-ligne.

## 0. Semaine calendaire lundi → dimanche (API)

`getWeekDates` ne part plus d'aujourd'hui mais du **lundi de la semaine courante**
(+ offset×7). Les dates strictement passées de la semaine sont ignorées lors de la
collecte (pas de séances passées). Le label de semaine devient « lun. 9 – dim. 15 juin ».

## 1. Enchaîner les séances (« que voir avant / après cette séance ? »)

**Besoin** : l'utilisateur voit souvent plusieurs films d'affilée et veut savoir ce
qui est jouable avant ou après une séance donnée.

**Données** : tout est calculable côté client à partir de la liste des films de la
semaine, à condition d'avoir la durée des films. L'API ne renvoie `runtime` que sur
le détail ; on l'ajoute à la liste (`FilmListItem.runtime`) — champ déjà présent
dans `ParsedFilm` et en base.

**Algorithme** (composant `SequencePlanner`) :
- Séance choisie : début `T`, fin estimée `F = T + runtime + 15 min` (pubs/bandes-annonces).
  Si la durée est inconnue on suppose 120 min et on l'affiche avec « ~ ».
- **Après** : séances du même jour, dans la même ville, qui commencent dans
  `[F - 10 min, F + 60 min]` (10 min de chevauchement tolérés = générique de fin).
- **Avant** : séances du même jour, même ville, dont la fin estimée tombe dans
  `[T - 60 min, T + 10 min]`.
- Tri : même cinéma d'abord, puis battement croissant. Le battement est affiché
  (« 20 min de battement », « enchaînement direct »).

**UI — deux portes d'entrée** :
1. Dans le drawer d'un film, chaque pastille horaire garde son lien de
   réservation ; un petit bouton « enchaîner » à côté de chaque groupe de séances
   ouvre une vue listant Avant / Après avec mini-affiche, titre, cinéma, heure et
   battement. Cliquer un film de la liste ouvre son drawer.
2. Page « Planifier ma soirée » (route `/soiree`, lien dans le header) : choix du
   jour (chips), de la ville et d'une heure de début minimum (défaut 17:00) ;
   liste des combos de 2 séances enchaînables (Film A 18:00 → Film B 20:45,
   battement affiché), triés par heure de début, plafonnés à 80 résultats.

## 2. Voir facilement les films d'aujourd'hui / d'un jour précis

Le filtre « lundi/mardi/… » caché dans un dropdown est remplacé par une **barre de
jours** (chips horizontales scrollables) au-dessus de la grille, avec les dates
réelles de la semaine chargée : `Tous · lun. 9 · mar. 10 · Aujourd'hui · …`.
Un tap filtre toutes les séances sur ce jour. Défaut : « Tous » (toute la semaine).
Les jours passés de la semaine courante sont grisés/désactivés.

- Store : `dayFilter` (index de jour) est remplacé par `selectedDate: string | null`
  (date ISO), non persisté (transitoire).
- Le `<select>` jour disparaît de la FilterBar (les options semaine/weekend aussi).
- Changer de semaine remet `selectedDate` à null.

## 3. Vue planning de la semaine

Toggle de vue **Affiche / Planning** (persisté dans le store, `viewMode`).
La vue Planning liste verticalement chaque jour de la semaine : en-tête de jour
(sticky), puis les films du jour triés par première séance — ligne compacte :
mini-affiche, titre, durée/note, pastilles horaires (heure + cinéma court).
Un tap sur la ligne ouvre le drawer du film. Les filtres et la barre de jours
s'appliquent aussi à cette vue (un seul jour sélectionné → une seule section).

## 4. PWA installable

- `vite-plugin-pwa` (registerType `autoUpdate`).
- Manifest : nom « ReelTime — Cinémas Brest », `display: standalone`,
  `theme_color #B71C1C`, `background_color #FFF8E1`, icônes 192/512 + maskable
  + apple-touch-icon, générées par `scripts/generate-icons.mjs` (Node pur,
  zlib intégré — bobine de film crème sur fond rouge).
- Runtime caching : API films en NetworkFirst (consultation hors-ligne du
  dernier programme), affiches AlloCiné et Google Fonts en CacheFirst.
- Meta : `theme-color`, `apple-mobile-web-app-*`, `viewport-fit=cover`.

## 5. Fluidité / suppression de l'effet « pas fluide »

- Supprimer `mix-blend-mode: overlay` (texture vintage) — très coûteux en
  composition mobile.
- Plus de `transition: all` ni d'animation de `box-shadow` sur les cartes :
  transitions limitées à `transform`/`opacity` (halo via pseudo-élément + opacité).
- `content-visibility: auto` + `contain-intrinsic-size` sur les cartes de la
  grille (scroll long).
- Affiches : ratio réservé (plus de layout shift), `decoding="async"`.
- React Query : `placeholderData: keepPreviousData` — plus de flash squelette
  en changeant de semaine ; léger voile pendant le fetch.
- Listener scroll passif + throttle rAF sur le bouton « retour en haut ».
- `-webkit-tap-highlight-color: transparent` + `touch-action: manipulation`
  pour des taps nets sur mobile.

## État d'avancement (2026-06-12 — session interrompue, crédits épuisés)

### Fait (code écrit, PAS ENCORE compilé/testé)

**API** (`apps/api`)
- `runtime` ajouté à `FilmListItem` (types/filmResponses.ts, filmService.ts ×2, mocks de tests films.test.ts ×2)
- `getWeekDates` : semaine calendaire lun→dim ancrée Paris, arithmétique UTC ; jours passés sautés dans `getFilmsForWeek` ; helper `addDays`/`formatDate` supprimés

**Web** (`apps/web`)
- `filmsApi.ts` : mappe `runtime`
- `filtersStore.ts` : `dayFilter` → `selectedDate` (transitoire) + `viewMode` persisté
- `useFilteredFilms.ts` : filtre par date précise
- `FilterBar.tsx` : select jour supprimé, noms courts via util partagé, grille 4 colonnes
- Nouveaux : `utils/cinemaNames.ts`, `utils/dates.ts`, `utils/chaining.ts` (findChainable + buildEveningCombos + constantes 15 min pub / 60 min battement / 10 min chevauchement)
- Nouveaux composants : `DayStrip.tsx`, `PlanningView.tsx`, `SequencePanel.tsx`
- `FilmShowtimes.tsx` : prop `onChain` + bouton chaîne par séance
- `FilmDrawer.tsx` : props `films`/`cityOf`/`onFilmSelect`, état `chainAnchor`, affiche SequencePanel
- `HomePage.tsx` : réécrit (DayStrip + toggle Affiche/Planning + reset selectedDate au changement de semaine + voile pendant fetch + drawer enrichi)
- `useFilms.ts` : `placeholderData: keepPreviousData`
- `SoireePage.tsx` + route `/soiree` + lien header « 🍿 ma soirée »
- `WeekNavigator.tsx` : bouton « Aujourd'hui » → « Cette semaine »
- PWA : `vite-plugin-pwa` installé, `scripts/generate-icons.mjs` exécuté (4 PNG dans public/), `vite.config.ts` (manifest + workbox NetworkFirst API / CacheFirst images+fonts), `index.html` (meta theme-color/apple), `main.tsx` (registerSW), `vite-env.d.ts` (types)
- Perf : globals.css (suppression mix-blend-mode, transitions transform-only, content-visibility sur .ticket-card, tap-highlight transparent, touch-action), FilmCard decoding=async, pills FilmShowtimes sans hover translate/shadow
- Barrels `components/index.ts` mis à jour

### Reste à faire

1. **Vérifier la compil** : `cd apps/web && npx tsc -b && npx vite build` — interrompu ici, rien n'a encore été compilé
2. `cd apps/api && npx tsc --build` + lancer les tests API (vitest)
3. Corriger les erreurs éventuelles (probable : types Version dans SequencePanel/PlanningView, imports inutilisés)
4. Tester manuellement (pnpm dev) : barre de jours, toggle planning, bouton chaîne dans le drawer, /soiree, installation PWA
5. Optionnel : script `icons` dans package.json web ; vérifier que nginx ne met pas sw.js en cache long ; mettre à jour CLAUDE.md (nouveaux composants/route)
6. Commit (rien n'est commité, y compris cette spec)

## Hors périmètre

Pas de refonte serveur (un seul champ ajouté à la réponse liste), pas de
notifications push, pas de compte utilisateur, pas de changement de la logique
de scraping.
