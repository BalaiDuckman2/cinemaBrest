# Design : ergonomie quotidienne — mode « Ce soir » et plan « Ma soirée »

Date : 2026-07-06
Source : brainstorming avec l'utilisateur. Usage quotidien réel : (a) trouver un
film pour ce soir, (b) enchaîner 2-3 séances autour d'un film déjà choisi pour
limiter les trajets. Appareils : mobile (PWA) + desktop. Les séances rétro et le
panneau de filtres actuels ne changent pas.

## 1. Mode « Ce soir »

**Besoin** : arriver en un tap sur « aujourd'hui, en soirée, dans mes cinémas
habituels », sans reconfigurer les filtres à chaque visite.

**UI** :
- Bouton « Ce soir » sur la home, dans la zone barre de jours (à côté du toggle
  Affiche/Planning). Fond `rouge-cinema` quand actif.
- Actif → un tag « Ce soir » apparaît dans les tags de filtres actifs, supprimable.
- La DayStrip affiche « Aujourd'hui » comme sélectionné visuellement quand le mode
  est actif.

**Comportement** :
- Un tap → affiche les séances d'**aujourd'hui** dont l'heure de début ≥
  **max(18h00, maintenant)**. Les filtres persistés (cinémas, version, tri…)
  restent appliqués par-dessus.
- Mode **transitoire** : booléen `ceSoirMode` dans `filtersStore`, **exclu du
  `partialize`** (non persisté). Il n'écrase ni `selectedDate` ni `timeSlot` ;
  l'overlay s'applique *à la place* de ces deux filtres tant que le mode est actif.
- Re-tap ou ✕ sur le tag → retour à la vue normale (les filtres persistés
  réapparaissent tels quels).
- Si `weekOffset ≠ 0`, taper « Ce soir » ramène d'abord à la semaine courante.
- Changer de semaine désactive le mode (même logique que `selectedDate`).
  Attention à l'ordre : l'activation depuis une autre semaine remet
  `weekOffset = 0` *puis* active le mode — la désactivation automatique ne doit
  se déclencher que sur un passage vers une semaine **≠ courante**, sinon elle
  annulerait l'activation.

**Implémentation** : overlay dans `useFilteredFilms` — si `ceSoirMode`, filtrer
`datetime` sur la date du jour et `time ≥ max('18:00', heure courante)`, et
ignorer `selectedDate`/`timeSlot`. Le tag « Ce soir » est prioritaire sur les tags
jour/créneau (qui ne s'affichent pas pendant le mode).

## 2. Plan « Ma soirée » (constructeur d'enchaînements)

**Besoin** : construire pas à pas un enchaînement de 2-3 séances (ex. 20h → un
film avant et/ou après), garder le plan sous les yeux et le retrouver le soir même.

### Points d'entrée « + »

Un bouton « + Ma soirée » sur chaque séance, partout où une séance s'affiche :
1. **`FilmShowtimes`** (drawer film) : à côté de chaque pastille horaire, au même
   niveau que le bouton chaîne existant.
2. **`SequencePanel`** : un « + » sur chaque candidat avant/après, et un bouton
   « Ajouter cette séance » pour la séance d'ancrage.
3. **`PlanningView`** : un « + » sur chaque ligne de séance.
4. **`SoireePage`** : bouton « Utiliser ce combo » sur chaque paire → remplit le
   plan avec les 2 séances d'un coup (remplace le plan courant, même règle de
   confirmation que ci-dessous si un plan d'une autre date existe).

### Barre « Ma soirée »

- Montée dans `Layout` → visible sur toutes les pages ; masquée si plan vide.
- **Repliée** (défaut) : une ligne `🎟 Ma soirée · mar. 8 · 2 films · 18h10 → 22h35`
  + chevron pour déplier.
- **Dépliée** : timeline chronologique — par séance : mini-affiche, titre,
  `18h10 → 20h25` (fin estimée via `estimatedEnd`, « ~ » si durée inconnue),
  cinéma court, version si ≠ VF, lien réservation si dispo, ✕ de retrait. Entre
  deux séances : battement via `formatGap`, **en rouge si chevauchement
  > `OVERLAP_TOLERANCE_MIN`**. Bouton « Tout effacer ».
- **Compléter** : sections « + un film avant » / « + un film après » listant les
  4-5 meilleurs candidats de `findChainable` autour des bords du plan (première /
  dernière séance). Tap → ajout direct. Sections absentes si les données de la
  semaine ne couvrent pas la date du plan. La barre lit `useFilms(0)` et
  `useCinemas` elle-même (React Query déduplique avec les pages).
- Mobile : barre pleine largeur en bas, safe-area PWA respectée. Desktop :
  panneau flottant bas-droite, largeur max ~28rem.
- Le contenu des pages reçoit un `padding-bottom` quand la barre est visible
  (aucun contenu masqué).

### Store `soireeStore` (Zustand + persist, clé `reeltime-soiree`)

```ts
interface SoireeItem {
  showtimeId: string;      // déduplication
  filmId: string;
  title: string;
  posterUrl: string | null;
  runtime: number | null;
  time: string;            // "18:10"
  date: string;            // "2026-07-08"
  cinemaId: string;
  cinemaName: string;
  city: string;
  version: string | null;
  bookingUrl: string | null;
}
interface SoireeState { date: string | null; items: SoireeItem[]; }
```

Les items sont des **snapshots** : le plan reste affichable même si les données
de la semaine changent (rollover, refresh API).

**Règles** :
- Un seul plan, une seule date. Ajout d'une séance d'une autre date → confirmation
  « Remplacer la soirée du mar. 8 ? » (`window.confirm` suffit, pas de composant
  dédié) ; accepter vide le plan et démarre sur la nouvelle date.
- Tri chronologique automatique à chaque ajout.
- Même `showtimeId` ajouté deux fois → ignoré (le « + » de cette séance passe en
  état « ajouté » ✓).
- Villes différentes dans le plan → avertissement « ⚠ villes différentes » dans
  la barre (l'ajout reste permis).
- **Auto-expiration** : au montage de l'app, si `date < aujourd'hui` → purge.
- Le soir même, une séance dont l'heure de début est passée s'affiche grisée
  (pas supprimée).
- Pas de limite dure du nombre de séances (usage réel : 2-3).

## 3. Hors périmètre

- Aucun changement API/backend : tout est côté client.
- Pas de partage du plan, pas de multi-plans, pas de notifications.
- Filtres, page Soirée (à part le bouton combo) et fonctionnalité rétro inchangés.

## 4. Vérification

Pas de framework de test côté web : `npx tsc --noEmit` + `npx vite build`, puis
tests manuels :
- « Ce soir » : tap avant/après 18h, re-tap, ✕ tag, changement de semaine,
  filtres persistés intacts après désactivation et après refresh.
- « Ma soirée » : ajout depuis les 4 points d'entrée, tri, battements et alerte
  chevauchement, remplacement inter-dates avec confirmation, persistance après
  refresh, purge au lendemain (simuler en modifiant la date du localStorage),
  liens de réservation, mobile (safe-area, rien de masqué) + desktop.
