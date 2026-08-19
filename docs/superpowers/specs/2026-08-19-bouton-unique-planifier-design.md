# Un seul bouton par séance, qui mène à « Planifier ma soirée »

Date : 2026-08-19

## Problème

Une ligne de séance porte aujourd'hui deux boutons : `[+]` qui ajoute la séance
à la soirée sans quitter l'écran, et une icône d'enchaînement qui bascule le
tiroir film dans `SequencePanel`, la vue « Enchaîner les séances ».

`SequencePanel` est resté dans l'état d'avant la refonte de `/soiree` :

- aucun tri, aucun filtre — ni version, ni cinéma, ni « même cinéma » ;
- battement figé à 60 minutes, non réglable, et le message d'absence annonce
  « battement max 1h » en dur ;
- pas de `notBefore`, donc les séances déjà commencées restent proposées ;
- pas d'injection du trajet, donc les temps de marche ne sont jamais déduits ;
- il conserve « Ajouter cette séance », le geste explicite qu'on a justement
  supprimé de `/soiree` ;
- il ne retire pas les séances ni les films déjà au plan.

Le défaut de fond est ailleurs : `FilmDrawer` est monté sur l'affiche **et** sur
`/soiree`. Depuis la page qu'on vient d'unifier, ouvrir un candidat puis cliquer
l'icône d'enchaînement fait basculer dans l'ancienne interface, imbriquée dans la
nouvelle. Deux systèmes d'enchaînement concurrents coexistent.

Enfin, l'icône d'enchaînement est `hidden md:flex` : elle n'existe pas sur
mobile, alors que c'est l'usage prioritaire.

## Décisions

| # | Sujet | Décision |
|---|-------|----------|
| 1 | Sort de `SequencePanel` | Supprimé. On n'enchaîne plus qu'à un seul endroit, `/soiree` |
| 2 | Boutons d'une ligne de séance | `[+]` et l'icône d'enchaînement fusionnent en un bouton unique qui mène à `/soiree` |
| 3 | Effet du bouton | Il ajoute la séance à la soirée de son jour, puis navigue |
| 4 | Portée | Le `[+]` reste sur `/soiree` : y naviguer depuis `/soiree` n'aurait aucun sens |
| 5 | Disponibilité | Le bouton existe à toutes les tailles d'écran |

## Ce qui disparaît

- `components/SequencePanel.tsx` et son export de `components/index.ts`.
- L'export d'`AddToSoireeButton` reste : `CandidateRow` s'en sert toujours.
- Dans `FilmDrawer` : les états `chainAnchor` et `chainEnabled`, et la branche
  conditionnelle. Le tiroir affiche désormais toujours la fiche du film.
- La prop `onChain`, qui traversait `FilmDrawer` → `FilmShowtimes` →
  `ShowtimeRow`.
- `AddToSoireeButton` dans `ShowtimeRow`, remplacé.

Les props `films` et `onFilmSelect` de `FilmDrawer` ne servaient peut-être qu'à
`SequencePanel`. À vérifier à l'implémentation : si c'est le cas, elles
disparaissent aussi et les deux pages qui montent le tiroir s'allègent d'autant.
`cityOf` reste nécessaire, `ShowtimeRow` en a besoin.

Effet de bord voulu : une ligne de séance passe de trois cibles à deux — l'heure,
cliquable pour réserver, et le bouton. C'est **moins** chargé qu'aujourd'hui,
donc rendre le bouton visible sur mobile n'y encombre rien.

## Ce qui apparaît

`components/soiree/PlanSoireeButton.tsx`, de mêmes props que l'ancien
`AddToSoireeButton` — `film`, `showtime`, `city`. Au clic il ajoute la séance
via `addToSoiree(makeSoireeItem(...))`, puis navigue.

Pas de toast : on atterrit sur `/soiree` et la séance est visible dans la
timeline. L'annoncer en même temps serait redondant.

Un seul état visuel. Le bouton navigue même si la séance est déjà au plan — le
store dédoublonne — et signaler « déjà ajoutée » serait inutile puisque la page
d'arrivée le montre.

Il s'inscrit dans `components/index.ts`, que `CLAUDE.md` demande de tenir à jour
pour chaque nouveau fichier. En vérifiant ce barrel on constate qu'il lui manque
les quatre composants ajoutés par la PR #1 — `SoireeFilters`, `SoireePlan`,
`CandidateList` et `FilmPicker`. Ils y sont ajoutés ici : c'est le fichier qu'on
modifie, et l'oubli vient du travail précédent.

## Le calage de `/soiree`

L'URL porte tout : `/soiree?date=2026-08-25&city=Brest`, plus `&week=N` quand la
séance n'est pas dans la semaine courante. Un tel lien est partageable et le
retour navigateur fonctionne.

`useWeekNavigation` lit déjà `?week=` et le réécrit ; rien à y changer.
`SoireePage` lit `?date=` et `?city=` comme **valeurs initiales** de
`selectedDate` et `city`, dans les initialiseurs paresseux de `useState`, aux
côtés de la recopie depuis `filtersStore`. L'URL gagne quand elle est présente.

Replis : paramètre absent, date malformée ou ville inconnue du référentiel →
comportement actuel, c'est-à-dire aujourd'hui et la ville de `filtersStore`. Les
effets de recalage existants continuent de s'appliquer derrière.

### `weekOffsetForDate`

Nouveau dans `utils/dates.ts` :

```ts
weekOffsetForDate(target: string, today: string): number
```

Écart en semaines calendaires entre les deux dates, semaines commençant le
lundi comme partout ailleurs dans le projet. `0` pour la semaine courante, `1`
pour la suivante, `-1` pour la précédente. Fonction pure, donc testable avec le
`environment: 'node'` du projet.

## Cas limites

| Situation | Comportement |
|-----------|--------------|
| Séance déjà dans la soirée | Le store dédoublonne, on navigue quand même |
| Séance dans une autre ville que le filtre courant | L'URL porte la ville, `/soiree` s'y cale |
| Ville hors zone (Troyes) | Devient la ville courante, donc `cities` la conserve |
| Séance d'une autre semaine | `?week=` la rattrape via `useWeekNavigation` |
| `?date=` hors de la semaine finalement chargée | L'effet de recalage existant ramène au premier jour sélectionnable |
| `?city=` inconnue | Ignorée ; l'effet existant recale sur la première ville disponible |

## Tests

`weekOffsetForDate` dans `dates.test.ts` :

- même semaine → `0`, y compris lundi et dimanche de cette semaine ;
- semaine suivante → `1`, précédente → `-1` ;
- dimanche puis lundi consécutifs → écart de `1`, le bord où ce calcul casse ;
- écart de plusieurs semaines, dans les deux sens ;
- date identique à aujourd'hui → `0`.

Pas de test de rendu : le projet n'en a pas et cette modification n'est pas le
moment d'introduire cette dépendance.

## Hors périmètre

- Le solveur de soirée à partir d'une liste d'envies, qui fera son propre spec.
- Le comportement de `/soiree` lui-même, refondu par la PR #1, inchangé ici.
