# Filtre par note Letterboxd — Design

**Date :** 2026-06-09
**Projet :** ReelTime v2 (`reeltime-v2/`)
**Statut :** Approuvé, prêt pour planification

## Objectif

Ajouter une **priorisation par note Letterboxd** aux films. La note Letterboxd
(moyenne communautaire, échelle 0–5) vient s'ajouter à la note AlloCiné déjà
présente. Elle est récupérée via TMDB, affichée sur les fiches films, et utilisée
comme critère de tri doux.

## Comportement clé : priorisation douce (pas un filtre strict)

Contrairement à un filtre classique, le « filtre » Letterboxd **ne masque aucun
film**. Quand l'utilisateur fixe un seuil X :

- Les films avec `letterboxdRating ≥ X` remontent en tête de liste.
- Les films avec une note connue `< X` **ou sans note** sont repoussés en bas.
- Au sein de chaque partition, le tri actif normal s'applique.

C'est donc un mécanisme de tri/priorisation, pas d'exclusion.

## 1. Modèle de données (Prisma — `apps/api/prisma/schema.prisma`)

Ajout de trois champs au modèle `Film` :

```prisma
model Film {
  // ... champs existants ...
  tmdbId              Int?      @map("tmdb_id")
  letterboxdRating    Float?    @map("letterboxd_rating")
  letterboxdFetchedAt DateTime? @map("letterboxd_fetched_at")
}
```

- `tmdbId` : ID TMDB résolu, mis en cache pour éviter de re-chercher à chaque
  enrichissement.
- `letterboxdRating` : note moyenne Letterboxd, échelle 0–5 (même échelle que
  `rating` AlloCiné).
- `letterboxdFetchedAt` : horodatage du dernier enrichissement, sert à ne
  ré-enrichir que les films obsolètes.

Migration via `npx prisma db push` (dev SQLite) + `npx prisma generate`.

## 2. Backend — service d'enrichissement `letterboxdService`

Nouveau service `apps/api/src/services/letterboxdService.ts`.

### Flux d'enrichissement par film

1. **Recherche TMDB** : `GET https://api.themoviedb.org/3/search/movie`
   avec `query=<titre>`, `year=<productionYear|year>`, `language=fr-FR`.
   On retient le premier résultat (meilleur match) → `tmdbId`.
2. **Résolution Letterboxd** : `GET https://letterboxd.com/tmdb/{tmdbId}/`.
   Letterboxd lie ses films aux IDs TMDB ; cette URL redirige vers la page
   canonique du film. On suit la redirection.
3. **Extraction de la note** : dans le HTML de la page film, lire le bloc
   `<script type="application/ld+json">` et extraire
   `aggregateRating.ratingValue` (déjà sur 0–5) → `letterboxdRating`.
4. Persister `tmdbId`, `letterboxdRating`, `letterboxdFetchedAt = now()`.

### Stratégie d'exécution

- **Enrichissement paresseux en tâche de fond** : un job sélectionne les films
  où `letterboxdFetchedAt IS NULL` ou `letterboxdFetchedAt < now() - 7 jours`
  (les notes Letterboxd évoluent lentement).
- **Rate-limité** : réutiliser le pattern `RateLimiter` existant
  (`apps/api/src/utils/rateLimiter.ts`) pour ne pas marteler TMDB / Letterboxd.
- **Jamais sur le chemin HTTP** : l'enrichissement ne bloque jamais une requête
  utilisateur, exactement comme le scraping AlloCiné refactoré récemment
  (commit `a55e278`). Déclenché en arrière-plan, idéalement raccroché au
  scheduler existant (`cacheScheduler` / `refreshService`).
- **Tolérant aux échecs** : si TMDB ne renvoie aucun match ou si le JSON-LD est
  absent, on laisse `letterboxdRating = null` et on met quand même
  `letterboxdFetchedAt` (pour ne pas retenter en boucle immédiatement). Les
  erreurs sont logguées, pas propagées.

### Configuration

- Nouvelle variable d'environnement `TMDB_API_KEY` dans `apps/api/.env`
  (et documentée dans `.env.example` + `CLAUDE.md`).
- Lue via `apps/api/src/config/`.

## 3. API & types partagés

- `@reeltime/types` (`packages/types/src/film.ts`) : ajouter
  `letterboxdRating: z.number().min(0).max(5).nullable().optional()` au
  `FilmSchema`.
- `apps/api/src/services/filmService.ts` : inclure `letterboxdRating` dans les
  objets film renvoyés (aux endroits déjà listés pour `rating` : ~l.148, l.215,
  l.343).
- Web (`apps/web/src/types/components.ts`) : ajouter
  `letterboxdRating: number | null` à `FilmListItem`.

## 4. Web — store & logique de priorisation

### Store (`apps/web/src/stores/filtersStore.ts`)

- Ajouter `minLetterboxdRating: number | null` + setter
  `setMinLetterboxdRating`.
- Valeur par défaut `null`, incluse dans `partialize` (persistée) et dans
  `resetAll`.

### Logique (`apps/web/src/hooks/useFilteredFilms.ts`)

- **Ne pas ajouter de `.filter()`** pour ce critère.
- Modifier l'étape de tri : quand `minLetterboxdRating !== null`, partitionner
  avant d'appliquer le comparateur de tri courant :
  - Groupe A : `(film.letterboxdRating ?? -1) >= minLetterboxdRating`.
  - Groupe B : le reste (note `< X` ou absente).
  - A entièrement avant B ; à l'intérieur de chaque groupe, le tri `sort` actif
    s'applique normalement.
- Incrémenter `activeFilterCount` quand `minLetterboxdRating !== null`.

### UI (`apps/web/src/components/filters/FilterBar.tsx`)

- Ajouter un contrôle de sélection de seuil 0–5 pour la note Letterboxd
  (boutons ou curseur), branché sur `minLetterboxdRating` /
  `setMinLetterboxdRating`.
- Suivre le style « vintage cinema » existant et le pattern des autres contrôles
  de la FilterBar.

## 5. Affichage de la note sur les fiches

- `FilmCard` (`apps/web/src/components/FilmCard.tsx`) : afficher un badge note
  Letterboxd (ex. à côté de la note AlloCiné). Masqué si `letterboxdRating`
  est `null`.
- `FilmDrawer` (`apps/web/src/components/FilmDrawer.tsx`) : afficher la note
  Letterboxd dans la zone de métadonnées du film.

## Hors périmètre (YAGNI)

- Pas d'option de tri « par note Letterboxd » dédiée dans le sélecteur de tri
  (la priorisation douce couvre le besoin).
- Pas de portage du filtre côté mobile (`apps/mobile`) dans cette itération —
  à traiter séparément si souhaité.
- Pas de récupération du nombre de votes Letterboxd ni de l'historique.

## Risques / points d'attention

- **Matching TMDB imparfait** : titres français ambigus ou rééditions peuvent
  matcher le mauvais film. L'usage de `year`/`productionYear` réduit le risque ;
  les non-matchs restent simplement non notés (affichés en bas).
- **Fragilité du scraping JSON-LD** : si Letterboxd change la structure de sa
  page, l'extraction casse silencieusement → `null`. Tolérance aux échecs déjà
  prévue.
- **Quotas** : TMDB a des limites de débit ; le rate-limiter + l'enrichissement
  paresseux espacé sur 7 jours gardent le volume bas.
