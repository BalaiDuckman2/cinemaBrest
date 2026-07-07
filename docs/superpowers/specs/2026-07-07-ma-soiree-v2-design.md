# Design : Ma soirée v2 — multi-soirées, barre clarifiée, `/soiree` « autour d'un film », page « Mes soirées »

Date : 2026-07-07
Source : QA utilisateur de la v1 (spec `2026-07-06-ergonomie-quotidienne-design.md`,
livrée le jour même). Constats : (a) la barre dépliée est peu claire, les films
choisis doivent passer en premier ; (b) une seule soirée ne suffit pas (« aujourd'hui
ça, dans deux jours ça ») ; (c) la page `/soiree` ne sert à rien en l'état — 776
combos c'est du bruit ; l'usage réel est « je choisis un film, puis je construis
autour ». Les comptes utilisateurs demandés en même temps sont un **chantier séparé**
(spec à venir) ; le stockage conçu ici doit s'y synchroniser tel quel.

## 1. Store multi-soirées (`soireeStore` v2)

**Modèle** : une soirée par date, plusieurs dates possibles.

```ts
interface SoireeState {
  /** clé = date "YYYY-MM-DD", valeur = séances triées chrono. Soirée vide = clé supprimée. */
  soirees: Record<string, SoireeItem[]>;
  /** Date affichée dans la barre. Transitoire (hors partialize). */
  activeDate: string | null;
}
```

`SoireeItem` inchangé (snapshot). Clé persist inchangée `reeltime-soiree`,
**`version: 1`** avec `migrate` : l'ancien format `{ date, items }` devient
`{ soirees: { [date]: items } }` (si `items` non vide) — personne ne perd sa soirée
au déploiement.

**Règles** :
- `addToSoiree(item)` : ajoute à la soirée de `item.date` (créée au besoin), dédup
  par `showtimeId` dans cette soirée, tri chrono, puis `activeDate = item.date`.
  **La confirmation `window.confirm` « Remplacer la soirée ? » disparaît** (plus de
  conflit de dates possible). `replaceSoiree` disparaît (plus de combos).
- `remove(date, showtimeId)` ; une soirée vidée est supprimée de `soirees`.
- `clearDate(date)` : vide une seule soirée (bouton « Tout effacer » de la barre).
- `purgeExpired(today)` : au montage de l'app, supprime toutes les soirées de date
  strictement passée.
- État ✓ du bouton « + » : la séance est présente dans la soirée **de sa date**.

## 2. Barre « Ma soirée » v2

- **Repliée** : résumé de la **prochaine soirée à venir** (plus petite date ≥
  aujourd'hui ; les dates passées sont purgées au montage) :
  `🎟 Ma soirée · mar. 8 · 2 films · 18h10 → ~22h35`, suivi de ` · +N` si N autres
  soirées existent. Masquée si aucune soirée.
- **Dépliée**, dans cet ordre :
  1. **Puces de dates** (`mar. 8` `jeu. 10`…) pour basculer entre soirées ; la puce
     active reprend le style DayStrip sélectionné (`rouge-cinema`).
  2. **Les films choisis** de la soirée affichée (timeline actuelle : mini-affiche,
     titre, heures, battements — rouge si chevauchement —, ✕, lien Réserver, grisé si
     l'heure est passée le jour même, ⚠ villes différentes).
  3. **Les suggestions** « + un film avant » / « + un film après », visuellement
     séparées des films choisis (bloc distinct avec fond `creme-ecran/50` ou
     bordure + intitulé « Suggestions »). Ancrées sur les bords de la soirée
     affichée ; absentes si les données de la semaine ne couvrent pas sa date.
  4. **« Tout effacer »** : vide uniquement la soirée affichée (`clearDate`) ; à
     côté, un lien « Voir tout » ouvre la page `/mes-soirees` (§4).
- Ajouter une séance (depuis n'importe quel point d'entrée) bascule la barre sur la
  soirée de cette date (`activeDate`), pour un retour visuel immédiat.
- Si `activeDate` est null ou ne correspond plus à une soirée existante, la barre
  affiche la prochaine soirée à venir.
- La barre est **masquée sur `/mes-soirees`** (doublon avec le contenu de la page).

## 3. Page `/soiree` refondue : « autour d'un film »

Les combos (`buildEveningCombos`, « Utiliser ce combo », `MAX_COMBOS`) disparaissent.

**Étape 1 — choisir le film** :
- Contrôles existants conservés : DayStrip (jour obligatoire), ville, « à partir
  de » (défaut 17:00).
- Liste compacte des **films ayant au moins une séance** ce jour-là, dans cette
  ville, à partir de l'heure choisie : affiche, titre, note Letterboxd si connue,
  nombre de séances éligibles. Tri par popularité (rating desc, comme la home).
  Champ de recherche par titre (normalisation accents/casse comme la home).

**Étape 2 — construire autour** (un film sélectionné) :
- Ses séances éligibles du jour en **chips sélectionnables** (heure, cinéma court,
  version si ≠ VF). Une séance sélectionnée = l'ancre.
- Bouton « Ajouter cette séance » (AddToSoireeButton avec label) pour l'ancre.
- Listes « Avant » / « Après » : candidats `findChainable` (mêmes règles : même
  ville, battement ≤ 1h, chevauchement toléré 10 min), chaque ligne au style
  CandidateRow avec « + » ; taper la ligne ouvre le FilmDrawer du film.
- **Tri des listes avant/après** (select) : « Battement » (défaut — même cinéma
  d'abord puis battement croissant, l'ordre actuel de `findChainable`), « Heure de
  début » (croissante), « Note Letterboxd » (décroissante, films sans note en fin).
- Bouton/lien « changer de film » pour revenir à l'étape 1.
- La réutilisation exacte (extraction de CandidateRow depuis SequencePanel vs
  composant propre à la page) est un choix d'implémentation du plan.

## 4. Page « Mes soirées » (`/mes-soirees`)

- **Accès** : deuxième bouton du header à côté de « Planifier ma soirée »
  (`🎟 Mes soirées`, libellé raccourci sur mobile, même style NavLink), et lien
  « Voir tout » dans la barre dépliée.
- **Contenu** : toutes les soirées à venir triées par date, une **carte par
  soirée** : en-tête `Mardi 8 juillet · 2 films · 18h10 → ~22h35`, timeline
  complète (mêmes lignes que la barre : mini-affiche, titre, heures → fin estimée,
  cinéma court, version si ≠ VF, lien Réserver, ✕ de retrait, battements — rouge si
  chevauchement —, séances passées grisées, ⚠ villes différentes), bouton « Tout
  effacer » par carte (`clearDate`).
- **Pas de suggestions avant/après sur cette page** : elle sert à voir et gérer ;
  la construction passe par la barre et `/soiree`.
- **État vide** : « Aucune soirée planifiée » + liens vers l'affiche (`/`) et
  `/soiree`.
- Les lignes de timeline (item + battement) sont **partagées avec la barre**
  (extraction de `ItemRow`/`GapRow` de `SoireeBar` en composants réutilisables).

## 5. Hors périmètre

- Comptes utilisateurs et synchronisation serveur (chantier C, spec séparée).
- Partage de soirées, notifications, multi-soirées le même jour.
- Aucun changement API/backend.

## 6. Vérification

`npx tsc --noEmit` + `npx vite build` + tests manuels :
- Migration : une soirée v1 dans le localStorage survit au passage en v2.
- Multi-soirées : ajouts sur 2 dates différentes sans confirmation, puces de dates,
  bascule automatique vers la soirée modifiée, « Tout effacer » ne touche qu'une
  soirée, purge au lendemain.
- Barre : films choisis en premier, suggestions séparées, résumé replié avec `+N`,
  lien « Voir tout », barre masquée sur `/mes-soirees`.
- `/soiree` : recherche + choix du film, chips de séances, avant/après, les 3 tris,
  ajout direct, retour étape 1.
- `/mes-soirees` : cartes triées par date, retrait/vidage par carte, état vide,
  accès header + barre.
