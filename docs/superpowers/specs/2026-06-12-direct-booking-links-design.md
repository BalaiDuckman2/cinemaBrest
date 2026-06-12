# Liens de réservation directs par séance

**Date** : 2026-06-12
**Statut** : validé (option A)

## Problème

Cliquer sur un horaire passe par une page intermédiaire « Votre Séance » dont le bouton
« Réserver » pointe presque toujours vers la fiche AlloCiné du film, pas vers la billetterie.

Cause racine : le parser lit `entry.service` (`allocineParser.ts`), qui ne contient que des
tags (ex. `"DISABLED_ACCESS"`). Les vrais liens billetterie sont dans
`entry.data.ticketing[].urls[]`. Le `bookingUrl` en base est donc toujours `null` et le
fallback `buildBookingUrl()` (fiche AlloCiné) s'applique systématiquement.

Vérifié en live sur les 10 cinémas : 100 % des séances exposent un deep link billetterie
(s.pathe.fr, achat.cgrcinemas.fr, ticketingcine.com, relay.mvtx.us) pointant vers la séance
exacte. Les Studios et Quai Dupleix n'ont actuellement aucune séance sur AlloCiné
(toutes dates) — sans impact sur ce design.

## Design retenu (option A : lien direct)

### API (`apps/api`)

- `allocineParser.ts` : remplacer l'extraction depuis `service` par `data.ticketing` —
  préférer l'entrée `provider === 'default'`, sinon la première entrée avec une URL.
  Mettre à jour le type `RawShowtime` (`service` est en réalité `string[]`).
- Aucun changement de schéma : `setInL2` purge déjà les séances par cinéma+date avant
  insertion, donc la prochaine synchro peuple `bookingUrl` automatiquement.
- Le fallback `buildBookingUrl()` dans `filmService` reste pour les séances sans lien.

### Web (`apps/web`)

- `FilmShowtimes.tsx` : les pastilles horaires deviennent des liens externes directs
  (`<a href={bookingUrl} target="_blank" rel="noopener noreferrer">`) au lieu de
  `Link` vers `/reservation/:id`. Si `bookingUrl` est `null` (cas marginal), la pastille
  est affichée non cliquable.
- Suppression de `ReservationPage` et de la route `/reservation/:showtimeId`
  (corrige au passage son bug de refresh : la page dépendait de `location.state`).

## Tests

- Parser : fixture au format réel AlloCiné (`data.ticketing`, multi-providers) —
  préférence `default`, fallback première URL, `null` sans ticketing.
- Web : `tsc --noEmit` + build Vite (pas d'infra de test web à ce jour).

## Déploiement

Après mise en prod (Portainer/ghcr), les liens apparaissent à la prochaine synchro
(minuit) ou via un refresh manuel.
