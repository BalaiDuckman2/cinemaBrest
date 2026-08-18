# Refonte de « Planifier ma soirée »

Date : 2026-08-18

## Problème

La page `/soiree` construit une soirée en deux étapes : choisir un film, puis
choisir ce qui s'enchaîne avant ou après. Six défauts la rendent pénible.

1. **La VF est invisible.** `CandidateRow`, `SoireeItemRow` et les puces de
   séances n'affichent la version que si elle diffère de VF. Une ligne sans
   badge est une VF, mais rien ne le dit.
2. **Aucun filtre sur les candidats.** Il existe un tri (Pertinence / Heure /
   Note) et un battement max, mais pas de filtre version, pas de filtre cinéma,
   pas de « même cinéma uniquement ». `sameCinema` n'est qu'une étiquette.
3. **Le premier film n'est pas ajouté.** Deux chemins distincts coexistent :
   « Ajouter cette séance » pour l'ancre, `[+]` pour un candidat. Ajouter un
   deuxième film crée une soirée à un seul film — le mauvais.
4. **Sur mobile, on construit à l'aveugle.** `SoireeBar` est `hidden md:block`.
   Sur la page dédiée à construire une soirée, on ne voit pas ce qu'on
   construit ; seuls un toast et une pastille d'onglet en témoignent.
5. **Le bouton `»` perd le fil.** `chainFrom` remplace l'ancre, donc la liste
   « avant » repropose le film déjà choisi, et les séances déjà au plan ne sont
   pas retirées des listes (contrairement à `SoireeBar`).
6. **L'étape 1 n'a aucun contrôle.** Tri figé sur Letterboxd, ni version ni
   cinéma : impossible de démarrer une soirée en VO.

S'y ajoute un défaut de justesse : deux cinémas différents séparés de cinq
minutes sont annoncés « enchaînement direct ». Le trajet n'est jamais compté.

## Décisions

Six arbitrages, tranchés avec l'utilisateur avant rédaction.

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Modèle d'ajout | Ajout implicite immédiat : choisir un film et une séance l'ajoute à la soirée |
| 2 | Portée des filtres | Un seul bloc en en-tête, valable pour la liste de films et pour les candidats |
| 3 | Lien avec l'affiche | Recopie au montage depuis `filtersStore`, puis état local, comme la ville aujourd'hui |
| 4 | Ancre des suggestions | La soirée elle-même : « avant » depuis le premier film, « après » depuis le dernier. Le bouton `»` disparaît |
| 5 | Trajet entre cinémas | Estimé depuis les coordonnées, déduit du battement |
| 6 | Rôle de la liste de films | Écran unique : la liste reste accessible en permanence, dans un bloc repliable sous les suggestions |

## Architecture de l'écran

Un seul écran, un seul scroll. Il prend deux formes selon que la soirée du jour
sélectionné est vide ou non.

### Soirée vide

```
En-tête     : titre, WeekNavigator, DayStrip, filtres
Choisir un film : déplié, recherche + liste filtrée
```

Pas de sections « Avant » / « Après » : il n'y a rien à enchaîner. La bascule
« Même cinéma uniquement » est masquée, elle n'a pas de sens sans ancre.

### Soirée non vide

```
En-tête          : titre, WeekNavigator, DayStrip, filtres
Ma soirée du ... : timeline + fin estimée + « Tout effacer »
Tri / Battement  : contrôles des deux listes de suggestions
Après            : candidats
Avant            : candidats
Choisir un autre film : replié
```

La soirée passe avant les suggestions : sur mobile, le premier écran doit
montrer ce qu'on est en train de construire. L'alternative « Avant / soirée /
Après », plus juste chronologiquement, a été écartée parce qu'elle repousse la
soirée sous la ligne de flottaison.

La page est indexée sur `selectedDate` : la soirée affichée est
`soirees[selectedDate]`. Changer de jour change la soirée construite, sans
jamais rien effacer — le store est déjà clé par date.

## Composants

`SoireePage.tsx` fait aujourd'hui 516 lignes et grossirait encore. Découpage :

| Fichier | Rôle | Dépendances |
|---------|------|-------------|
| `pages/SoireePage.tsx` | Orchestration : semaine, jour, filtres, calcul des candidats | les composants ci-dessous |
| `components/soiree/SoireeFilters.tsx` | Bloc de filtres d'en-tête | `filterOptions`, liste des cinémas |
| `components/soiree/SoireePlan.tsx` | « Ma soirée du … » : timeline, fin estimée, tout effacer, état vide | `SoireeTimeline`, `soireeStore` |
| `components/soiree/CandidateList.tsx` | Un bloc de suggestions : titre, lignes, états vides | `CandidateRow` |
| `components/soiree/FilmPicker.tsx` | Bloc repliable : recherche, liste de films, puces de séances | `soireeStore` |
| `utils/travel.ts` | Haversine et conversion en minutes de marche | aucune |
| `utils/soireeFilters.ts` | Fonctions pures : filtre version/cinéma, tri des candidats | `chaining` |
| `hooks/useTravelMinutes.ts` | `(fromCinemaId, toCinemaId) => number` construit depuis `useCinemas` | `useCinemas`, `travel` |

Chaque unité est testable isolément : `travel` et `soireeFilters` sont des
fonctions pures, `useTravelMinutes` n'est qu'une table de correspondance, les
composants ne reçoivent que des props.

## Ajout d'un film

`SoireePage` n'a plus d'état `filmId` ni `anchorId`. Ils disparaissent.

Dans `FilmPicker`, cliquer sur une ligne de film déplie ses séances éligibles en
puces (accordéon : une seule ligne dépliée à la fois, pour rester compact sur
mobile). Cliquer sur une puce appelle `addToSoiree` et replie le bloc. Une puce
dont la séance est déjà au plan est marquée d'une coche et inerte.

Dans `CandidateList`, le `[+]` de chaque ligne ajoute directement : la séance est
déjà déterminée. Le bouton `»` et le bouton « Ajouter cette séance » sont
supprimés. Il ne reste qu'un geste d'ajout, identique partout.

## Filtres

Bloc unique en en-tête, appliqué à la liste de films **et** aux candidats.

| Filtre | Valeurs | Origine au montage |
|--------|---------|--------------------|
| Ville | villes des cinémas, hors villes opt-in sauf si déjà choisie | `filtersStore.selectedCity`, défaut `Brest` |
| À partir de | Toute la journée, 14h, 17h, 18h, 19h, 20h | défaut `17:00` |
| Version | Toutes versions, VF, VO/VOST | `filtersStore.version` |
| Cinémas | puces multi-sélection parmi les cinémas de la ville | `filtersStore.selectedCinemas`, intersecté avec la ville |
| Même cinéma uniquement | bascule ; masquée si la soirée est vide | désactivée |

Sémantique de la version identique à `useFilteredFilms` : `VO` retient les
séances `VO` et `VOST`.

Version et cinémas filtrent des **séances**, pas des films. Ils se replient donc
dans `eligibleShowtimes`, aux côtés du jour, de la ville et de l'heure de début.
Conséquences, voulues : un film n'apparaît dans la liste que s'il lui reste au
moins une séance éligible ; le compteur « n séances » ne compte que celles-là ;
et les puces dépliées ne montrent que celles-là. Un film joué en VF et en VOST,
filtré sur VO, s'affiche avec ses seules séances VOST.

Les cinémas sont des puces, pas un `select` : ils sont peu nombreux par ville,
et la puce est le vocabulaire déjà employé par `DayStrip`. Aucune puce
sélectionnée signifie « tous les cinémas », pas « aucun ».

Recopie au montage uniquement : régler ces filtres ici ne modifie jamais
`filtersStore`, donc ne perturbe pas l'affiche. Si l'intersection entre
`selectedCinemas` et les cinémas de la ville est vide, on ne filtre pas — un
filtre invisible qui vide la page serait pire que pas de filtre.

## Tris

Les libellés changent pour dire ce qu'ils font.

| Valeur | Libellé | Ordre |
|--------|---------|-------|
| `chain` | Meilleur enchaînement | même cinéma d'abord, puis plus petit temps mort absolu |
| `time` | Heure de début | heure croissante |
| `rating` | Note Letterboxd | note décroissante |
| `cinema` | Cinéma | nom du cinéma A→Z, puis heure |

« Pertinence » devient « Meilleur enchaînement », et le texte d'aide sous les
listes explique la règle. Le tri `cinema` est ajouté : il répond au besoin de
regrouper les séances par salle sans exclure les autres.

La liste de films garde son tri Letterboxd, qui est le défaut du projet
(`DEFAULT_SORT`). Les filtres d'en-tête s'y appliquent, pas un sélecteur de tri
supplémentaire.

## Version toujours affichée

`CandidateRow`, `SoireeItemRow` et les puces de séances passent de
`version && version !== 'VF'` à l'affichage inconditionnel de `version`. C'est
déjà ce que fait `ShowtimeRow` sur l'affiche : la correction rétablit la
cohérence plutôt qu'elle n'introduit une règle.

## Temps de trajet

L'API expose déjà `latitude` et `longitude` par cinéma ; `fetchCinemas` les
jette. `CinemaItem` gagne `latitude: number | null` et `longitude: number | null`,
et le mapper les conserve.

`utils/travel.ts` :

- `haversineMeters(a, b)` — distance à vol d'oiseau entre deux points
  `{ latitude, longitude }`.
- `travelMinutes(from, to)` — prend deux `CinemaItem`. Retourne `0` si c'est le
  même cinéma, ou si l'un des deux n'a pas ses deux coordonnées. Sinon
  `distance × DETOUR_FACTOR / WALK_SPEED_M_PER_MIN`, arrondi au multiple de 5
  le plus proche, puis ramené à 5 minimum — deux salles distinctes ne sont
  jamais à zéro minute l'une de l'autre.

`useTravelMinutes` enveloppe cette fonction : il résout les identifiants de
cinéma via `useCinemas` et retourne `(fromCinemaId, toCinemaId) => number`, avec
`0` pour un identifiant inconnu.

`DETOUR_FACTOR = 1.3` (les rues ne sont pas des lignes droites),
`WALK_SPEED_M_PER_MIN = 80`. L'arrondi à 5 minutes est délibéré : afficher
« 7 min de trajet » serait une précision que le calcul n'a pas.

`findChainable` gagne une option `travelMinutesBetween?: (from, to) => number`
et un champ `travelMin` sur `ChainCandidate`. Trois grandeurs, distinctes :

- `gapMin` — `début(suivant) − fin(précédent)`, inchangé.
- `travelMin` — trajet estimé, `0` par défaut.
- `slackMin` — `gapMin − travelMin`, le temps réellement libre.

Les filtres de faisabilité portent sur `slackMin`, pas sur `gapMin` :
`slackMin >= -OVERLAP_TOLERANCE_MIN && slackMin <= maxGapMin`. Le tri
`chain` ordonne sur `Math.abs(slackMin)`.

L'affichage reste honnête sur les deux : « 25 min de battement, dont ~10 min de
trajet ». Quand `travelMin` vaut 0, rien n'est mentionné — pas de « 0 min de
trajet ».

`SoireeGapRow` gagne une prop optionnelle `travelMin`, câblée par `SoireePage`,
`SoireeBar` et `MesSoireesPage` via `useTravelMinutes`. Absente, le composant se
comporte comme aujourd'hui.

## Ancre et suggestions

`before` s'ancre sur `items[0]`, `after` sur `items[items.length - 1]` — la même
règle que `SoireeBar`, désormais partagée au lieu d'être dupliquée.

Deux exclusions s'ajoutent au résultat de `findChainable` :

- toute séance déjà au plan (`showtimeId`) ;
- tout film déjà au plan (`filmId`) — revoir le même film à une autre heure n'a
  pas de sens, et `findChainable` n'exclut que le film-ancre.

`notBefore` reste appliqué le jour même.

## Cas limites

| Situation | Comportement |
|-----------|--------------|
| Soirée du jour vide | Pas de sections Avant/Après ; `FilmPicker` déplié ; bascule « même cinéma » masquée |
| Changement de jour | On affiche la soirée de ce jour, éventuellement vide. Rien n'est effacé |
| Aucun candidat, filtres larges | « Aucune séance enchaînable après (battement max …, même ville). » |
| Aucun candidat à cause des filtres | Message distinct nommant les filtres en cause, avec un bouton « Relâcher les filtres » qui remet version et cinémas à leur valeur neutre |
| Coordonnées manquantes | `travelMin = 0`, aucune mention de trajet, candidat conservé |
| Séance déjà commencée aujourd'hui | Exclue par `notBefore`, message existant conservé |
| Semaine affichée ne couvrant plus la date | L'effet de recalage existant s'applique, sans plus rien à réinitialiser |
| Ville persistée introuvable | Recalage existant sur la première ville disponible |

## Tests

`utils/travel.ts` — nouveau `travel.test.ts` :

- distance entre deux cinémas brestois connus, dans le bon ordre de grandeur ;
- même cinéma → `0` ;
- coordonnée manquante d'un côté → `0` ;
- arrondi au multiple de 5, plancher à 5 pour deux cinémas distincts et proches.

`utils/chaining.ts` — ajouts à `chaining.test.ts` :

- un candidat acceptable sans trajet devient inéligible une fois le trajet
  déduit ;
- `travelMin` vaut 0 pour deux séances du même cinéma ;
- `travelMinutesBetween` absent → comportement identique à l'existant
  (non-régression) ;
- le tri `chain` ordonne sur `slackMin`, pas sur `gapMin`.

`utils/soireeFilters.ts` — nouveau `soireeFilters.test.ts` :

- filtre version `VO` retenant `VO` et `VOST`, excluant `VF` ;
- filtre cinéma vide = aucun filtre ;
- « même cinéma uniquement » ne retenant que le cinéma de l'ancre ;
- les quatre tris sur un jeu fixe.

Pas de test de rendu : le projet n'en a pas et cette refonte n'est pas le
moment d'introduire cette dépendance.

## Hors périmètre

- Le filtre version et le filtre cinéma de l'affiche restent inchangés.
- `SoireeBar` conserve son comportement `hidden md:block` ; la page affiche
  désormais la soirée elle-même, donc le manque mobile est comblé sans y
  toucher.
- Aucun trajet en voiture ni en transports : l'estimation est piétonne, et le
  texte d'aide le dit.
