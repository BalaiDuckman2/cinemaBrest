# Design : refonte ergonomique mobile (PWA web)

Date : 2026-07-25
Source : brainstorming avec l'utilisateur. Cible : `apps/web` consulté sur
téléphone (`< 768px`). L'app Expo de la branche `mobile` n'est pas concernée.

Usages prioritaires déclarés : **parcourir ce qui est à l'affiche** et **trouver
les horaires d'un film précis**. La planification de soirée et le mode « Ce soir »
sont secondaires — or ils occupent aujourd'hui le meilleur espace (bouton dans le
bandeau haut, barre fixe en bas, deux boutons dans le header).

## 0. Diagnostic

Mesuré sur un écran de 667 px de haut, page d'accueil :

| Élément | Hauteur |
|---|---|
| Header sticky | 52 |
| `WeekNavigator` (+ marge `mb-4`) | 82 |
| `DayStrip` | 34 |
| « Ce soir » + toggle Affiche/Planning | 34 |
| Recherche + bouton filtres | 40 |
| Étiquettes de filtres actifs | ~28 |

Soit **~270 px avant le premier film**, plus de 40 % de l'écran.

Autres défauts relevés dans le code :

- **Trois contrôles de date qui se recouvrent** : `WeekNavigator`, `DayStrip`,
  « Ce soir ».
- **Semaine calendaire** : `useFilms(weekOffset)` renvoie lundi→dimanche et
  `DayStrip` grise les jours passés. **Un dimanche, la bande affiche six puces
  mortes et une seule vivante**, et « Tous = toute la semaine » ne désigne plus
  qu'un jour.
- **Cibles tactiles sous le minimum** : puces de jours `py-1.5 text-xs` ≈ 28 px ;
  pastilles d'horaires de `PlanningView` `py-0.5 text-[11px]` ≈ 22 px, collées à
  un `AddToSoireeButton` en `px-1` — deux actions différentes à quelques pixels
  l'une de l'autre.
- **Navigation en haut** alors que le pouce est en bas, et le bas est occupé par
  `SoireeBar`, feature secondaire.
- **Le drawer ignore le jour sélectionné** : on filtre sur samedi, le drawer
  rouvre les sept jours avec le premier déplié.
- **Trois cibles par séance** dans `FilmShowtimes` : pastille (réserve),
  🔗 (enchaîner), ⊕ (ma soirée).
- **Ancres sticky en dur** : `PlanningView` code `top-[52px] sm:top-[60px]`.
- **`ScrollToTopButton`** décale sa position selon l'existence d'un plan.

Fluidité :

- Aucun `overscroll-behavior: contain` : le scroll fuit vers la page sous le
  drawer et sous `SoireeBar`.
- Le swipe-pour-fermer du drawer n'est câblé que sur l'en-tête sticky
  (`onTouchStart/Move/End` y sont posés) et uniquement si `scrollTop === 0`.
  Seul un seuil de distance ferme (`> 100px`) — pas de vélocité, donc un coup sec
  vers le bas ne ferme pas.
- Verrou de scroll par `body { overflow: hidden }` : sur iOS la page remonte en
  haut à la fermeture.
- `useFilteredFilms` refiltre, remappe et retrie tout le catalogue à chaque frappe
  de recherche, sans découplage.
- `will-change: transform` posé en permanence sur `#filmDrawer`.
- Aucun `scroll-snap` sur les bandes horizontales.
- `option { background-color: #1f2937 }` en CSS global : options sombres dans des
  `<select>` clairs.

Non concerné, vérifié : les affiches ont toutes des dimensions fixées en classes
(`h-56`, `w-12 h-[72px]`, `w-24 h-36`) — il n'y a pas de décalage de mise en page.

## 1. Modèle de dates : fenêtre glissante

Remplacement de la pagination par semaine calendaire par une **fenêtre qui
commence aujourd'hui**.

### `useFilmsRange(weeks = 2)`

Nouveau hook dans `src/hooks/`. Appelle `useFilms(0..weeks-1)` via `useQueries` et
fusionne. Deux requêtes par défaut ; l'API préchargeant 60 jours, la seconde est
servie depuis son cache.

Fenêtre couverte = `[aujourd'hui, dimanche de la dernière semaine chargée]`, soit
8 à 14 jours selon le jour où l'on ouvre l'app. Toujours ≥ 8 jours.

Fusion :

```ts
function mergeFilmPages(pages: FilmsResponse[], from: string, to: string): FilmListItem[] {
  const byId = new Map<string, FilmListItem>();
  for (const page of pages) {
    for (const film of page.films) {
      const existing = byId.get(film.id);
      if (!existing) {
        byId.set(film.id, { ...film, showtimes: [...film.showtimes] });
        continue;
      }
      const seen = new Set(existing.showtimes.map((s) => s.id));
      for (const st of film.showtimes) if (!seen.has(st.id)) existing.showtimes.push(st);
    }
  }
  // Rogner sur [from, to] puis écarter les films sans séance restante.
}
```

Mémoïsé sur les références de `data` des queries. Les métadonnées film (titre,
affiche, note) proviennent de la première page qui contient le film ; seules les
`showtimes` sont unionnées.

### Extension et suppression du passé

- Puce **`+ 7 jours`** en fin de bande : incrémente `weeks`, ce qui ajoute un
  `useFilms(n)`. Remplace l'ancien bouton « Suivant » sans plafond. `weeks` est un
  `useState` **interne à `useFilmsRange`**, exposé avec un `loadMore()` ; il n'est
  ni persisté ni porté dans l'URL (un lien partagé ouvre sur deux semaines et le
  `?date=` visé reste atteignable puisqu'il est dans la fenêtre au moment du
  partage — au-delà, `loadMore()` est appelé automatiquement jusqu'à couvrir la
  date demandée).
- **La navigation vers les semaines passées est supprimée.** Des séances passées
  n'ont pas d'usage, et c'est la source des puces grisées.
- `WeekNavigator` et `useWeekNavigation` sont supprimés (fichiers et exports des
  barils).

### URL

`?week=<offset>` → **`?date=YYYY-MM-DD`**. Un lien partagé désigne un jour, pas un
décalage relatif à la date d'ouverture. Nouveau hook `useSelectedDate` : même
forme que l'ancien `useWeekNavigation` (lecture initiale, `pushState`,
`popstate`), mais synchronise `selectedDate` du `filtersStore`. Un `?week=`
résiduel est simplement ignoré.

L'effet de `HomePage` qui remet `selectedDate` à `null` et coupe `ceSoirMode` au
changement de semaine disparaît : il n'y a plus de semaines.

### `TOUS`

Première puce, épinglée à gauche, `selectedDate = null`. Signifie désormais
« toute la fenêtre chargée » et non plus « la semaine calendaire ».

### `DateStrip`

Remplace `DayStrip`. Puces de **48 px** minimum, deux lignes (`SAM` / `26`),
`scroll-snap-type: x proximity` + `scroll-snap-align: center`, puce active amenée
dans le viewport au montage. Dégradés de masquage aux deux bords pour signaler le
défilement. Aucune puce désactivée.

## 2. Navigation mobile : barre d'onglets

`components/layout/MobileTabBar.tsx`, monté dans `Layout`, `md:hidden`.

| Onglet | Action | Actif quand |
|---|---|---|
| 🎥 Affiche | `/` + `setViewMode('grid')` | `pathname === '/' && viewMode === 'grid'` |
| ≣ Planning | `/` + `setViewMode('planning')` | `pathname === '/' && viewMode === 'planning'` |
| 🎟 Soirées | `/mes-soirees` | `pathname === '/mes-soirees'` |

- Hauteur 56 px + `padding-bottom: env(safe-area-inset-bottom)`.
- Badge sur `Soirées` = nombre total de séances au plan, toutes dates confondues.
- `/soiree` (planifier autour d'un film) **n'est pas un onglet** : c'est un flux
  atteint depuis un film.

Conséquences :

- Les deux `NavLink` du `Header` passent en `hidden md:flex`.
- Le toggle Affiche│Planning quitte le bandeau haut sur mobile
  (`hidden md:flex`) ; il reste sur desktop.
- `SoireeBar` devient `hidden md:block`. Sur mobile, le plan se consulte dans
  l'onglet Soirées, qui affiche déjà tout (`MesSoireesPage`) — y compris les
  suggestions d'enchaînement.
- **Retour visuel à l'ajout** : sans la barre, l'ajout d'une séance se confirme
  par le passage du ⊕ à ✓ (déjà implémenté dans `AddToSoireeButton`) **et** par
  l'incrément du badge de l'onglet Soirées, qui doit être animé brièvement pour
  être remarqué. C'est le seul retour perdu par la suppression de la barre, et il
  doit être compensé explicitement.
- `main` reçoit `pb-[calc(56px+env(safe-area-inset-bottom))] md:pb-0`. La logique
  `showBar` de `Layout` ne pilote plus que le padding desktop.
- `ScrollToTopButton` : position fixe
  `bottom-[calc(64px+env(safe-area-inset-bottom))] md:bottom-8`. Son branchement
  conditionnel sur `hasPlan` disparaît.

## 3. Chrome haut

**Le header n'est plus sticky sur mobile** : `md:sticky md:top-0`. Il défile et
sort de l'écran normalement, et revient quand on remonte. Aucun JavaScript, aucun
détecteur de direction de scroll.

Les commandes qui doivent rester atteignables **descendent dans la barre de
dates**, qui devient la seule chose collée en haut :

```
┌──────────────────────────────────┐
│ 🎬 ReelTime                      │ 48  defile
├──────────────────────────────────┤
│ ┃TOUS┃ SAM │ DIM │ LUN │…│ 🔍 ⚙︎3│ 52  sticky top-0
├──────────────────────────────────┤
│ ┌────────────┐   ┌────────────┐  │
│ │  affiche   │   │  affiche   │  │
```

- Rangée en flex : bande de puces `flex-1 overflow-x-auto`, groupe 🔍 / ⚙︎
  `shrink-0`, cibles de 44 px.
- 🔍 déplie un champ de recherche sur la ligne suivante (l'input n'occupe plus
  l'écran en permanence). Il reste déplié tant que la requête est non vide.
- ⚙︎ ouvre la feuille de filtres, avec le compteur `activeFilterCount` existant.
- Les étiquettes de filtres actifs restent sous la barre, et seulement s'il y en a.

**Variable CSS `--sticky-top`** posée sur le conteneur de page, valant la hauteur
de la barre collée (52 px mobile, 112 px desktop). `PlanningView` l'utilise pour
ses en-têtes de jour à la place de `top-[52px] sm:top-[60px]`.

**`min-height: 100vh` → `100dvh`** sur `body` et sur le conteneur de `Layout`,
pour que la barre d'onglets ne passe pas sous la barre d'URL mobile.

**Pied de page** : `py-8 mt-16` plus un pavé de texte font ~280 px sous chaque
liste. Sur mobile, réduit à une ligne de liens (`py-4 mt-8`, texte descriptif en
`hidden md:block`).

## 4. Primitive `<BottomSheet>`

`components/ui/BottomSheet.tsx`. Extraite de `FilmDrawer`, qui la ré-implémente
aujourd'hui à la main, puis réutilisée par la feuille de filtres et les feuilles
de sélection.

```ts
interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  label: string;              // aria-label
  maxHeight?: string;         // défaut '85vh'
  children: React.ReactNode;
}
```

### Glissement

- **On attrape n'importe où dans la feuille**, plus seulement la poignée.
- Arbitrage : sur `touchmove`, si le conteneur scrollable est à `scrollTop <= 0`
  **et** que le doigt descend, on passe en mode glissement et on
  `preventDefault()` ; sinon on laisse scroller.
- Écouteur `touchmove` attaché en `{ passive: false }` via `ref` dans un
  `useEffect`. Le `onTouchMove` de React ne permet pas de bloquer le scroll de
  façon fiable.
- La feuille suit le doigt via `element.style.transform` direct, **sans état
  React** — aucun rendu par image.
- Opacité du fond liée à la progression du glissement.
- Au relâcher : fermeture si `deltaY > 100` **ou** vélocité `> 0.5 px/ms`,
  calculée sur les trois derniers échantillons `{ y, t }`. Sinon retour élastique.
  C'est l'absence de ce critère de vélocité qui donne aujourd'hui la sensation que
  la feuille « résiste ».
- `will-change: transform` posé sur `touchstart`, retiré sur `touchend`. Les
  règles `#filmDrawer { will-change }` et `.drawer-open` du CSS global sont
  supprimées.

### Scroll

`overscroll-behavior: contain` sur le conteneur scrollable interne — également
appliqué à `SoireeBar` (desktop) et aux listes de `MesSoireesPage`.

### Verrou de scroll

`hooks/useScrollLock.ts` :

```ts
const y = window.scrollY;
document.body.style.position = 'fixed';
document.body.style.top = `-${y}px`;
document.body.style.width = '100%';
// libération
document.body.style.position = '';
document.body.style.top = '';
window.scrollTo(0, y);
```

**Compteur au niveau module** : une feuille de sélection ouverte par-dessus la
feuille de filtres ne doit pas libérer le verrou en se fermant. Le verrou n'est
relâché que lorsque le compteur retombe à zéro. `body.drawer-active` disparaît.

### Accessibilité

`role="dialog"`, `aria-modal`, focus placé sur la feuille à l'ouverture, `Escape`
ferme, focus rendu au déclencheur à la fermeture.

`FilmDrawer` est réécrit par-dessus cette primitive et perd sa gestion tactile
propre.

## 5. Feuilles de sélection

Les six `<select>` (tri, version, horaires, âge, département, ville) deviennent
des listes en feuille basse sur mobile : options en lignes de 48 px, ✓ sur la
valeur active, scroll inertiel natif, fermables par glissement.

- `components/filters/filterOptions.ts` : les listes d'options et `DEPARTMENTS`
  sont extraites en constantes typées. **Une seule source de données.**
- `components/ui/SelectSheet.tsx` : bouton affichant le libellé courant + ▾,
  ouvrant une `BottomSheet` contenant un `role="listbox"`.
- `components/filters/FilterSelect.tsx` : rend `SelectSheet` en `md:hidden` et
  `<select>` natif en `hidden md:block`, à partir des mêmes constantes. `FilterBar`
  n'appelle plus que ce composant.
- La règle `select option { background-color: #1f2937 }` est supprimée du CSS
  global.

**`FilterBar` est scindé en trois** — il porte aujourd'hui la recherche, les
étiquettes actives et les contrôles dans un seul composant, ce qui n'est plus
tenable une fois les contrôles déplacés dans une feuille :

| Morceau | Mobile | Desktop |
|---|---|---|
| Champ de recherche | dans la barre collée, déplié par 🔍 (§3) | dans `FilterBar`, comme aujourd'hui |
| Étiquettes de filtres actifs | sous la barre collée, hors de la feuille | dans `FilterBar` |
| Les six contrôles + puces cinémas | dans la `BottomSheet` ouverte par ⚙︎ | panneau accordéon `.filter-panel` |

Les étiquettes restent hors de la feuille sur mobile : leur intérêt est de montrer
ce qui est actif **pendant** qu'on regarde les résultats, et de se retirer d'un
tap sans rouvrir la feuille.

**« Ce soir » devient une option de filtre** : ligne à bascule
« 🌙 Ce soir (après 18h) » en tête de la feuille. Le bouton du bandeau haut est
supprimé. `ceSoirMode` reste dans le store, garde sa précédence sur `selectedDate`
et `timeSlot` dans `useFilteredFilms`, et garde son étiquette prioritaire dans
`activeTags` — seule sa liaison à `weekOffset` disparaît.

## 6. Séances en lignes

`FilmShowtimes` passe de la grille de pastilles à des **lignes de 56 px**, sur
mobile **et** desktop — un seul rendu, plus simple que l'actuel.

```
┌──────────────────────────────────┐
│ ▾ SAMEDI 26          3 seances   │ 44
├──────────────────────────────────┤
│  14:10   Liberte  VF     │  ⊕    │ 56
│  17:30   Capucins VOST   │  ⊕    │ 56
│  21:00   Celtic   VF     │  ✓    │ 56
├──────────────────────────────────┤
│ ▸ DIMANCHE 27        5 seances   │ 44
└──────────────────────────────────┘
```

- **Deux cibles par séance au lieu de trois.** Tap sur la ligne → billetterie
  (`<a>` englobant heure / cinéma / version). `AddToSoireeButton` de 48 px à
  droite, **hors** de l'ancre.
- Sans `bookingUrl` : ligne grisée, `aria-disabled`, non tapable, titre
  « Réservation en ligne non disponible » conservé.
- Le bouton 🔗 enchaîner passe en `hidden md:inline-flex` : sur mobile il fait
  doublon avec l'onglet Soirées, qui calcule déjà les suggestions avant/après.
- Les `<details>` deviennent des sections à état contrôlé, pour pouvoir
  **pré-ouvrir le jour sélectionné** (`selectedDate` du store) au lieu du premier
  jour. Sans sélection, le premier jour.
- Le décrochage de coin « ticket » des pastilles est reporté sur le bloc heure en
  début de ligne, pour conserver l'identité visuelle.

`PlanningView` applique le même traitement à ses lignes de séances : bloc heure +
cinéma tapable, ⊕ de 44 px séparé, au lieu des pastilles `text-[11px]` actuelles.
Les tailles de texte sous 11 px (`text-[9px]`, `text-[10px]`) passent à 11 px
minimum.

## 7. Fluidité

- **Recherche non bloquante** : `useDeferredValue(searchQuery)` alimente le `useMemo`
  de `useFilteredFilms`. React 19 garde la frappe fluide et recalcule le tri en
  tâche de fond. Pas de `setTimeout`, pas de dépendance ajoutée.
- **`overscroll-behavior: contain`** sur tous les conteneurs scrollables (§4).
- **`scroll-snap`** sur les bandes horizontales (§1) et sur la bande de dates de
  `SoireeBar`.
- **Texture des cartes** — `.vintage-texture::before` applique un `feTurbulence`
  SVG en data-URI. L'URL étant identique pour toutes les cartes, le navigateur la
  décode en principe une seule fois ; le gain d'un passage à un PNG tuilé de 64 px
  est donc incertain. **À profiler avant de toucher** (onglet Performance, scroll
  d'une grille longue) et à ne changer que si le coût de peinture est visible.
- **`content-visibility: auto`** déjà présent sur `.ticket-card` : conservé.
- `will-change` limité à la durée du geste (§4).

## 8. Hors périmètre

- **Aucun changement API ni base** : tout est côté client.
- Pas de balayage gauche/droite pour changer de jour, pas de tirer-pour-rafraîchir
  (écartés explicitement).
- L'app Expo de la branche `mobile` n'est pas touchée.
- Le design vintage (couleurs, polices, textures) est conservé.
- Changements desktop assumés, en dehors du périmètre mobile strict : suppression
  de `WeekNavigator`, « Ce soir » déplacé dans les filtres, séances en lignes,
  fenêtre de dates glissante. Ils découlent du refus de maintenir deux modèles de
  dates et deux rendus de séances en parallèle.

## 9. Vérification

Pas de framework de test côté web : `npx tsc --noEmit` puis `npx vite build`,
suivis de tests manuels en émulation mobile (375 × 667) **et** sur téléphone réel
pour tout ce qui est tactile.

Dates :

- Ouvrir un lundi et un dimanche (horloge système décalée) : aucune puce grisée,
  fenêtre ≥ 8 jours dans les deux cas.
- `+ 7 jours` ajoute bien une semaine, sans doublon de film ni de séance.
- `?date=` : lien partagé, retour arrière navigateur, `?week=` résiduel ignoré.
- Un film programmé à cheval sur deux semaines chargées apparaît une seule fois,
  avec l'union de ses séances.

Navigation :

- Les trois onglets, leur état actif, le badge Soirées, la safe-area en PWA
  installée sur iOS.
- Rien de masqué en bas de page ; bouton retour-en-haut jamais sous la barre.
- Header qui sort au scroll, barre de dates qui reste collée, en-têtes de jour de
  `PlanningView` alignés dessous.

Gestes :

- Glissement depuis le milieu de la feuille, pas seulement la poignée.
- Coup sec vers le bas sur une courte distance → ferme (vélocité).
- Glissement lent sur 50 px puis relâché → revient en place.
- Contenu scrollé puis glissement vers le bas → scrolle, ne ferme pas ; une fois
  en haut, le geste suivant ferme.
- Scroll en bas du contenu du drawer : la page derrière ne bouge pas.
- Fermeture du drawer : la page est à la position où on l'avait laissée (iOS).
- Feuille de sélection ouverte depuis la feuille de filtres : sa fermeture ne
  débloque pas le scroll de la page.

Séances et filtres :

- Le drawer pré-ouvre le jour sélectionné dans la bande.
- Tap sur une ligne → billetterie ; ⊕ n'ouvre jamais la billetterie et
  inversement, y compris en tapant à la frontière des deux zones.
- Ligne sans billetterie non tapable.
- Les six filtres donnent le même résultat via la feuille (mobile) et via
  `<select>` (desktop).
- « Ce soir » depuis la feuille : avant et après 18h, étiquette supprimable,
  filtres persistés intacts après désactivation et après rechargement.
- Frappe continue dans la recherche sur le catalogue complet : pas de saccade.
