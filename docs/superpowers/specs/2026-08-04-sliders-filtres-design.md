# Design : sliders pour les filtres horaires et âge, refonte du filtre cinémas

Date : 2026-08-04
Source : brainstorming avec l'utilisateur. Cible : `reeltime-v2/apps/web`,
`components/filters/` et `stores/filtersStore.ts`.

## 0. Contexte

La barre de filtres actuelle empile six `FilterSelect` (Tri, Version, Horaires,
Âge du film, Département, Ville) plus une liste de puces de cinémas. Trois
défauts motivent ce chantier :

1. **Le filtre horaire est trop grossier.** Quatre créneaux figés — Matin
   (< 12h), Après-midi (12–18h), Soirée (18–22h), Nuit (≥ 22h)
   (`useFilteredFilms.ts:26-29`). Impossible de demander « entre 20h et 21h30 ».
2. **Le filtre âge est un select à sept entrées** là où un curseur exprime mieux
   une progression.
3. **La ville n'est pas un filtre, elle est dépliée en liste de cinémas.**
   `handleCityChange` (`FilterControls.tsx:70-83`) écrase `selectedCinemas` avec
   les identifiants des cinémas de la ville, et `visibleCinemas`
   (`FilterControls.tsx:43`) réduit les puces affichées. Le filtrage marche,
   mais les deux contrôles se marchent dessus : décocher ensuite un cinéma
   laisse le select afficher « Quimper » alors que le filtre réel n'est plus la
   ville. `ActiveFilterTags.tsx:71` porte la trace de ce couplage — l'étiquette
   du nombre de cinémas est masquée quand un département est actif, pour ne pas
   afficher deux fois la même information. `DEPARTMENTS` ne contient de plus
   qu'une seule entrée, Finistère (29) : ce select n'offre jamais qu'un choix.

## 1. Décisions de cadrage

Actées avec l'utilisateur pendant le brainstorming :

| Question | Décision |
|---|---|
| Le double slider remplace-t-il les 4 créneaux ? | **Oui, remplacement complet.** Le select « Horaires » disparaît. |
| Bornes du slider horaire | **Calculées sur les séances du jour affiché**, pas de bornes fixes. |
| Que devient la plage quand les bornes changent ? | **Réinitialisation à la plage complète.** |
| Paliers du slider d'âge | **Les 7 paliers actuels** (0, 1, 5, 10, 20, 30, 50). |
| Remplacement de Département + Ville | **Select Ville qui filtre réellement + puces des cinémas de cette ville.** |
| Implémentation | **Radix UI Slider** (`@radix-ui/react-slider`). |

### Pourquoi Radix plutôt que des `<input type="range">` natifs

`apps/web` n'a que cinq dépendances runtime et aucune librairie de composants :
Radix y sera la première. Le surcoût est faible (~10 ko gz, tree-shakeable) et
il achète la partie difficile — **deux pouces sur écran tactile**. Avec des
range natifs superposés, quand les curseurs se rapprochent il faut bricoler
`z-index` et `pointer-events` pour que le doigt attrape le bon ; or les bornes
calculées produisent souvent des plages étroites, donc des pouces proches. Sur
une PWA manipulée au pouce, ce cas n'est pas un détail. Radix gère aussi le
clavier, ARIA et le focus, et s'habille en Tailwind ordinaire, là où le natif
impose de dupliquer le CSS en `::-webkit-slider-thumb` et `::-moz-range-thumb`
sans états cohérents entre navigateurs.

## 2. Filtre horaires — double slider

### Bornes

Calculées sur les séances du jour sélectionné, après tous les autres filtres
(ville, cinémas, version, âge) **mais avant le filtre horaire lui-même** — sinon
le calcul serait circulaire, la plage choisie rétrécissant ses propres bornes.

Les bornes brutes sont arrondies **vers l'extérieur au quart d'heure** : des
séances de 13h50 à 22h40 donnent un slider 13h45 → 22h45. Sans cet arrondi les
crans tomberaient sur 13h50, 14h05, 14h20 — illisibles. Pas de 15 minutes.

Si le jour ne contient aucune séance, le slider est masqué : il n'y a rien à
filtrer et les bornes seraient indéfinies.

### État

- `timeSlot: TimeSlotFilter` **supprimé** du store, remplacé par
  `timeRange: { start: string; end: string } | null`. `null` signifie « plage
  complète, aucun filtre » — et non « plage égale aux bornes », ce qui évite
  d'avoir à recalculer les bornes pour savoir si le filtre est actif.
- `timeRange` n'est **pas persisté** (absent du `partialize`). Les bornes se
  recalculent à chaque jour ; restaurer la plage d'hier n'aurait pas de sens et
  produirait un filtre invisible au rechargement.
- `minTime: string | null` **supprimé**. Ce champ n'est écrit par aucun
  composant : il subsiste dans le store et dans `useFilteredFilms.ts:129` sans
  interface, et la borne basse du slider le remplace exactement. Le paramètre
  `minTime` de l'API (`filmSchemas.ts`, `filmService.ts:273`) n'est pas touché :
  c'est une surface publique distincte, hors périmètre.
- `TimeSlotFilter`, `TIME_SLOT_OPTIONS` et `TIME_LABELS` sortent de
  `filterOptions.ts` et du store.

### Comportement

- **Filtrage** : un film est gardé s'il a au moins une séance dans la plage, et
  seules ces séances sont affichées. C'est exactement le comportement actuel de
  `timeSlot` (`useFilteredFilms.ts:118-122`), bornes incluses des deux côtés.
- **Réinitialisation** : tout changement de jour, de ville ou de sélection de
  cinémas remet `timeRange` à `null`. Le déclencheur est le changement des
  bornes calculées, pas la liste des dépendances : si les nouvelles bornes sont
  identiques aux précédentes, la plage est conservée.
- **`ceSoirMode` continue de primer.** Quand il est actif, il impose « aujourd'hui,
  à partir de max(18h, maintenant) » (`useFilteredFilms.ts:94`) ; le slider est
  alors ignoré dans le filtrage et grisé à l'écran, comme l'est le select
  aujourd'hui.
- **Étiquette de filtre actif** : « de 18h00 à 22h45 », croix pour revenir à
  `null`. Aucune étiquette quand `timeRange` vaut `null`.

## 3. Filtre âge — slider simple

`MIN_AGE_VALUES = [0, 1, 5, 10, 20, 30, 50]`. Le slider travaille sur l'**index**
0→6 avec un pas de 1, ce qui répartit les paliers à intervalles égaux et donne
des crans larges au pouce.

`minAge: MinAgeFilter` et la logique de filtrage ne changent pas, la valeur
reste persistée : seul l'habillage remplace le select. Libellé sous le curseur —
« Tous les films » à l'index 0, « films de +10 ans » ensuite.
`MIN_AGE_OPTIONS` sort de `filterOptions.ts`, remplacé par `MIN_AGE_VALUES`.

## 4. Filtre cinémas

- `selectedDepartment`, `setDepartment` et `DEPARTMENTS` **supprimés** (un seul
  département existant).
- `selectedCity` devient une **dimension de filtre à part entière** au lieu
  d'être dépliée dans `selectedCinemas` : ville choisie sans cinéma coché → on
  filtre sur les cinémas de cette ville. Concrètement
  `effectiveCinemaIds = selectedCinemas.length ? selectedCinemas : cinémasDeLaVille`,
  ce qui réutilise la logique de filtrage par `cinemaId` existante au lieu d'en
  introduire une seconde. `selectedCity === null` conserve le sens actuel :
  tous les cinémas. `handleCityChange` cesse donc d'écrire dans
  `selectedCinemas` — c'est ce qui supprime le couplage entre les deux
  contrôles.
- Les puces n'affichent que les cinémas de la ville sélectionnée.
- **Changer de ville vide `selectedCinemas`.** Sans cela, des cinémas d'une
  autre ville resteraient cochés, invisibles à l'écran, et filtreraient en
  douce — c'est le piège que ce chantier corrige, il ne faut pas le réintroduire
  sous une autre forme.
- Étiquette de filtre actif pour la ville, croix → `null`.
- La liste des villes vient des cinémas eux-mêmes (`cinema.city`), triée, et non
  plus d'une constante `DEPARTMENTS` à maintenir à la main.

## 5. Composants

- `filters/Slider.tsx` — habillage Radix unique, `value: number[]`, un ou deux
  pouces selon la longueur du tableau. Thème vintage : piste `sepia-chaud`,
  plage sélectionnée `rouge-cinema`, pouce `creme-ecran` bordé
  `bordeaux-profond`, cible tactile de 44 px conforme au reste de la refonte
  mobile.
- `filters/TimeRangeSlider.tsx` et `filters/AgeSlider.tsx` — deux usages minces
  au-dessus, qui portent le libellé et le formatage.
- `filters/FilterControls.tsx` — les `FilterSelect` Horaires, Âge du film,
  Département et Ville sortent ; Tri et Version restent des selects. La grille
  passe de quatre à deux colonnes sur la rangée des selects.
- `filters/index.ts` — barrel mis à jour, comme l'impose le CLAUDE.md du dépôt.
- `filters/ActiveFilterTags.tsx` — étiquette horaire reformulée, étiquette ville
  ajoutée, étiquette département supprimée.

## 6. Logique pure et tests

Vitest web tourne en environnement `node` sur `src/__tests__/**/*.test.ts`, sans
testing-library : **aucun test de composant n'est possible en l'état**, et
l'installer sort du périmètre. La logique est donc extraite dans `src/utils/` et
testée là, suivant la convention déjà en place pour `dates.ts` et `gestures.ts`.

- `utils/timeRange.ts` — `computeTimeBounds(films)` (arrondi au quart d'heure,
  cas « aucune séance »), `isInTimeRange(time, range)`.
- `utils/ageFilter.ts` — `MIN_AGE_VALUES`, conversions index ↔ valeur, libellé.

Cas couverts par les tests :

- bornes arrondies vers l'extérieur (13h50/22h40 → 13h45/22h45) ;
- jour sans séance → pas de bornes ;
- plage inclusive aux deux extrémités ;
- une plage dont les bornes égalent les bornes calculées ne filtre rien ;
- mapping index ↔ âge dans les deux sens, libellé de l'index 0 ;
- résolution ville → identifiants de cinémas.

Le rendu Radix et l'interaction tactile ne sont pas couverts par ces tests : ils
sont vérifiés manuellement avec `pnpm dev` avant livraison.

## 7. Hors périmètre

- Le paramètre `minTime` de l'API et son schéma Zod.
- L'installation de testing-library et les tests de composants.
- Le mode `ceSoirMode`, conservé tel quel.
- Les filtres Tri et Version, qui restent des selects.
