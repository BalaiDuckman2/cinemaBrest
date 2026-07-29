# Design : retour du sélecteur de dates par semaine

Date : 2026-07-29
Source : brainstorming avec l'utilisateur. Cible : `reeltime-v2/apps/web`, pages
`HomePage` (`/`) et `SoireePage` (`/soiree`).

## 0. Contexte

La refonte ergonomique mobile du 2026-07-25
(`2026-07-25-refonte-ergonomie-mobile-design.md`) a remplacé la navigation par
semaine calendaire par une **fenêtre glissante de 14 jours démarrant
aujourd'hui** : commit `0885914` a supprimé `WeekNavigator`, `DayStrip` et
`useWeekNavigation` au profit de `DateStrip` + `useFilmsRange` + `useSelectedDate`.

À l'usage, l'utilisateur ne s'y retrouve pas : il veut raisonner en semaines
(« la semaine prochaine »), pas en jours à partir d'aujourd'hui. **On revient à
la navigation par semaine calendaire.**

### Compromis assumé

Le spec du 2026-07-25 reprochait à la semaine calendaire qu'**un dimanche, la
bande affiche six puces mortes et une seule vivante**. Ce défaut revient et il
est accepté : la lisibilité du découpage en semaines prime. Il est atténué par
trois choses — les jours passés restent grisés et non cliquables (on ne clique
pas dans le vide), le bouton « Cette semaine » ramène en un geste à la semaine
courante, et les puces gardent le format compact issu de la refonte mobile.

Les autres acquis de la refonte mobile (barre collée, cibles tactiles de 48 px,
onglets bas, feuilles de filtres, mesure de `--sticky-top`) sont **conservés
intégralement**. Seul le mécanisme de sélection de date change.

## 1. Flux de données

Retour au chargement **semaine par semaine**.

- `hooks/useWeekNavigation.ts` — restauré. Expose `weekOffset`,
  `goToNextWeek`, `goToPrevWeek`, `goToToday`. Synchronise `?week=N` dans l'URL
  (paramètre absent quand `N === 0`) et gère le retour arrière navigateur via
  `popstate`.
- `hooks/useFilms.ts` — inchangé, déjà présent (utilisé par `SoireeBar`). Une
  requête React Query par semaine, `placeholderData: keepPreviousData` : pas de
  flash de squelette au changement de semaine.
- Les 7 dates lun→dim viennent de `weekDatesFrom(data.meta.weekStart)`, la
  `meta` étant renvoyée par l'API.

**Pas de borne basse sur `weekOffset`** : comme avant la refonte, « Précédent »
permet de remonter indéfiniment dans le passé. Décision explicite de
l'utilisateur.

### Supprimés

| Fichier | Raison |
|---|---|
| `hooks/useFilmsRange.ts` | remplacé par `useFilms(weekOffset)` |
| `hooks/useSelectedDate.ts` | l'URL porte `?week=`, plus `?date=` |
| `utils/mergeFilms.ts` | ne servait qu'à fusionner les pages de la fenêtre |
| `__tests__/mergeFilms.test.ts` | idem |

Dans `utils/dates.ts`, ces fonctions n'ont plus aucun consommateur et sont
retirées : `rangeDates`, `rangeEnd`, `weeksNeededFor`, `mondayOf`, `addDays`.
Vérifié par recherche sur `src/` : leurs seuls appelants étaient `useFilmsRange`
et les autres fonctions de cette même liste.

Le paramètre `?date=` n'était produit que par `useSelectedDate` ; aucun lien
interne ne le génère. Sa disparition ne casse donc aucun lien de l'app. Les URL
`?date=` déjà partagées ouvriront la semaine courante.

## 2. Composants

### `WeekNavigator` (restauré)

Restauré tel quel depuis `0885914^` : bandeau `beige-papier` bordé
`sepia-chaud`, avec `← Précédent`, le libellé de semaine (`27 juil - 2 août`) sur
fond `rouge-cinema`, `Suivant →`, et un bouton `🎬 Cette semaine` qui n'apparaît
que si `weekOffset !== 0`. Le libellé est calculé par un `formatWeekLabel` local
à partir de `meta.weekStart` / `meta.weekEnd`.

Props : `weekOffset`, `weekLabel`, `onPrevWeek`, `onNextWeek`, `onToday`.

### `DayStrip` (issu de `DateStrip`, renommé)

On **ne ressuscite pas** l'ancien fichier `DayStrip.tsx` : le `DateStrip` actuel
est meilleur (centrage automatique sur la puce active au montage, `snap-x`,
`overscroll-x-contain`, puces sur deux lignes de 52 × 48 px). On le renomme
`DayStrip` — le nom que documente déjà `CLAUDE.md` — et on l'adapte :

1. Suppression de la puce « +7 jours » et des props `onLoadMore` /
   `isLoadingMore` : la profondeur est désormais gouvernée par `WeekNavigator`.
2. Jours passés `disabled`, grisés (`border-sepia-chaud/30`,
   `text-sepia-chaud/40`, `cursor-not-allowed`) — comportement de l'ancien
   `DayStrip`, indispensable dès qu'une semaine peut contenir des jours révolus.
3. Le sous-titre de la puce « Tous » passe de `{dates.length} j` à `semaine`.

Props finales : `dates`, `value`, `onChange`, `hideAllChip`.

### `PlanningView`, `FilmDrawer`, `FilterBar`, feuilles de filtres

Inchangés. `PlanningView` reçoit simplement les 7 dates de la semaine au lieu
des 14 de la fenêtre.

## 3. Page d'accueil

Structure verticale :

```
┌─ défile avec la page ──────────────┐
│  ← Précédent   27 juil - 2 août   Suivant →  │
│            🎬 Cette semaine                   │
└──────────────────────────────────────────────┘
╔═ collé en haut (mobile) ═════════════════════╗
║ [Tous][lun.27][mar.28]…[dim.2]        🔍  ⚙  ║
║ (+ recherche dépliée, étiquettes de filtres) ║
╚══════════════════════════════════════════════╝
   grille Affiche / vue Planning
```

- `WeekNavigator` est **au-dessus** de la barre collée et n'est pas épinglé : il
  disparaît au défilement. Choix explicite de l'utilisateur — il occupe trop de
  hauteur pour rester visible sur mobile.
- La barre collée conserve exactement son contenu actuel : bande de jours,
  boutons recherche/filtres sur mobile, bascule Affiche/Planning sur desktop,
  `ActiveFilterTags`.
- La mesure de `--sticky-top` continue d'observer la barre collée. Comme
  `WeekNavigator` n'est pas `sticky`, la logique existante (qui compare
  `getComputedStyle(bar).position` à `sticky`) reste valable sans modification.
- `WeekNavigator` est affiché même pendant le chargement et en cas d'erreur, pour
  qu'on puisse toujours changer de semaine ; le libellé est vide tant que la
  `meta` n'est pas là.

### Effet de changement de semaine (restauré)

```ts
useEffect(() => {
  setSelectedDate(null);
  if (weekOffset !== 0) setCeSoirMode(false);
}, [weekOffset, setSelectedDate, setCeSoirMode]);
```

Un jour sélectionné n'a de sens que dans la semaine où on l'a choisi. « Ce soir »
ne se désactive qu'en **quittant** la semaine courante : l'activer depuis une
autre semaine ramène `weekOffset` à 0, ce qui ne doit pas le désactiver aussitôt.

### États vides

- Aucun film sur la semaine : message « Aucun film cette semaine », action
  « Semaine suivante » (`goToNextWeek`) au lieu de l'actuel « Charger une semaine
  de plus », qui n'a plus d'objet.
- Jour sélectionné sans séance : inchangé, « Voir tous les jours »
  (`setSelectedDate(null)`).

## 4. Page /soiree

Même système, décision explicite de l'utilisateur : les deux pages doivent se
comporter pareil.

- `WeekNavigator` placé dans la carte d'en-tête, juste au-dessus de la bande de
  jours.
- `useFilms(weekOffset)` remplace `useFilmsRange()`.
- La page impose un jour (`hideAllChip`, `selectedDate: string` non nullable).
  Au changement de semaine, on recale sur le premier jour sélectionnable et on
  réinitialise `filmId` / `anchorId`, exactement comme le fait déjà le clic sur
  une puce de jour.

Nouveau helper dans `utils/dates.ts` :

```ts
/** Premier jour non révolu de la semaine ; le lundi si elle est à venir,
 *  aujourd'hui si elle est en cours, le dernier jour si elle est passée. */
export function firstSelectableDate(weekDates: string[], today: string): string
```

Le cas « semaine passée » retourne le dernier jour plutôt que rien : la page ne
peut pas exister sans date sélectionnée, et l'utilisateur qui remonte dans le
passé y verra une liste vide, ce qui est le comportement attendu.

## 5. Tests

`__tests__/dates.test.ts` :

- retrait des cas couvrant `addDays`, `mondayOf`, `rangeDates`, `rangeEnd`,
  `weeksNeededFor` (fonctions supprimées) ;
- ajout de `weekDatesFrom` — non couvert aujourd'hui : 7 dates consécutives,
  départ inclus, passage de mois et passage d'année ;
- ajout de `firstSelectableDate` : semaine à venir → lundi ; semaine en cours →
  aujourd'hui ; semaine passée → dernier jour ; jour de bord (le dimanche de la
  semaine courante).

`__tests__/mergeFilms.test.ts` supprimé avec l'utilitaire qu'il couvre.
`gestures.test.ts` n'est pas touché.

Vérification finale, depuis `reeltime-v2/apps/web` :

```
pnpm vitest run
npx tsc --noEmit
npx vite build
```

et `pnpm lint` depuis `reeltime-v2/`.

## 6. Documentation

`reeltime-v2/CLAUDE.md` n'a jamais été mis à jour après la refonte du
2026-07-25 : sa section web décrit toujours `WeekNavigator`, `DayStrip` et
`useWeekNavigation`, et ne mentionne ni `DateStrip` ni `useFilmsRange`. Elle
redevient donc exacte sans modification. Relecture de contrôle en fin de
chantier, sans changement attendu.

## 7. Hors périmètre

- `SoireeBar` : lit déjà `useFilms(0)` et n'est pas concernée.
- Les onglets bas, les feuilles de filtres, le `BottomSheet`, le mode « Ce soir »
  en réglage : inchangés.
- Aucune modification côté API : `GET /api/v1/films?weekOffset=` existe déjà et
  reste le seul point d'entrée.
