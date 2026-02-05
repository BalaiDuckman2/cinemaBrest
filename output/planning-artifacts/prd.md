---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - 'output/project-context.md'
  - 'output/brainstorming/brainstorming-session-2026-02-04.md'
  - 'CLAUDE.md'
  - 'README.md'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 3
workflowType: 'prd'
projectType: 'brownfield'
classification:
  projectType: 'multi-component'
  architecture:
    - 'api-backend'
    - 'web-app-spa'
    - 'mobile-app-android'
  structure: 'api/ web/ mobile/'
  domain: 'entertainment-media'
  complexity: 'medium-high'
  projectContext: 'brownfield-complete-rewrite'
  targetUsers: 'personal-friends'
  constraints:
    keep: 'allocine-scraping'
    platforms: 'android (possibly iOS)'
status: 'complete'
---

# Product Requirements Document - ReelTime v2

**Author:** Raphael
**Date:** 2026-02-04
**Version:** 1.0

---

## Résumé Exécutif

### Vision

ReelTime v2 est une refonte complète de l'application d'agrégation de séances de cinéma pour Brest et Landerneau. L'objectif est de passer d'un monolithe Flask à une architecture moderne multi-composants (API + Web + Mobile) permettant une meilleure maintenabilité, performance et extensibilité.

### Proposition de Valeur

Trouver et réserver une séance de cinéma en moins de 30 secondes, avec des alertes intelligentes pour ne jamais manquer un film attendu.

### Différenciateur

- Architecture découplée permettant l'évolution indépendante de chaque composant
- Stack TypeScript unifié (API, Web, Mobile) pour une maintenance simplifiée
- Alertes personnalisables avec notifications push (Phase 2)

### Utilisateurs Cibles

Usage personnel (Raphael) et amis proches (~10-20 utilisateurs).

### Contexte

Projet brownfield - refonte complète d'une application Flask existante fonctionnelle mais difficile à maintenir et étendre.

---

## Classification du Projet

| Aspect | Détail |
|--------|--------|
| **Type** | Architecture Multi-Composants (API + Web + Mobile) |
| **Structure** | `api/` `web/` `mobile/` |
| **Domaine** | Divertissement / Média (agrégation cinéma) |
| **Complexité** | Moyenne-Haute |
| **Contexte** | Brownfield - Refonte complète |
| **Utilisateurs** | Personnel + amis proches |
| **Plateformes** | Android (MVP), iOS (futur) |
| **Contrainte** | Conservation du scraping AlloCiné |

---

## Critères de Succès

### Succès Utilisateur

| Métrique | Cible |
|----------|-------|
| Temps pour trouver une séance | < 30 secondes |
| Taps pour réserver | ≤ 2 |
| Sauvegarde watchlist | 1 tap |

**Moment "aha!" :** "J'ai reçu une notif pour Avatar en VO à 18h au Pathé, j'ai réservé en 30 secondes"

### Succès Technique

| Métrique | Cible |
|----------|-------|
| Temps de réponse API (hot cache) | < 200ms |
| Temps appel AlloCiné | < 1s |
| Fluidité mobile | 60 FPS |

### Succès Global

- Utilisation régulière pour trouver et réserver
- L'app remplace la recherche manuelle sur AlloCiné/Google

---

## Parcours Utilisateur

### Parcours 1 : "Le film recommandé"
**Utilisateur :** Connecté | **Objectif :** Trouver un film spécifique | **MVP :** ✅

> Un ami envoie : "T'as vu Dune 2 en VO ?" → Ouvre ReelTime → Recherche "Dune" → Filtre "VO" → Trouve séance jeudi 20h30 → 2 taps → Réservation faite.
>
> **Durée : < 1 minute**

**Capacités :** Recherche, filtres version, lien réservation

---

### Parcours 2 : "L'envie spontanée"
**Utilisateur :** Connecté ou invité | **Objectif :** Découvrir quoi voir ce soir | **MVP :** ✅

> Vendredi 18h, envie de ciné → Ouvre ReelTime → Parcourt les films → Filtre "à partir de 20h" → Regarde les notes → Clic réserver.
>
> **Durée : 2-3 minutes**

**Capacités :** Navigation par jour, filtre horaire, affichage notes

---

### Parcours 3 : "Le film introuvable → Alerte"
**Utilisateur :** Connecté | **Objectif :** Être prévenu quand un film sort | **MVP :** ❌ Phase 2

> Cherche "Nosferatu" → Rien → Bouton "Créer une alerte" → 2 semaines plus tard : notification 🎬 "Nosferatu est au cinéma !" → Clic → Réservation.

**Capacités :** Alertes sur film, notifications push, deep link

---

### Parcours 4 : "L'alerte sur mesure"
**Utilisateur :** Connecté | **Objectif :** Alerte avec critères précis | **MVP :** ❌ Phase 2

> Profil → "Créer alerte" → Configure : Avatar 3 + VO + ≥18h + Pathé → Jour J : notification → Réservation immédiate.

**Capacités :** Alertes configurables, notifications ciblées

---

### Parcours 5 : "Le visiteur invité"
**Utilisateur :** Non connecté | **Objectif :** Consulter les séances | **MVP :** ✅

> Reçoit un lien → Voit les séances → Navigue, filtre → Pour sauvegarder → Invitation à créer un compte.

**Capacités :** Accès sans compte, inscription optionnelle

---

### Parcours 6 : "Le nouvel inscrit"
**Utilisateur :** Nouveau | **Objectif :** Créer un compte | **MVP :** ✅

> Clic "Créer un compte" → Email + mot de passe → Compte créé → Retour à l'action initiale.

**Capacités :** Inscription simple, reprise du contexte

---

### Parcours 7 : "L'administrateur"
**Utilisateur :** Admin/Dev | **Objectif :** Monitoring | **MVP :** ✅

> Consulte les logs → Vérifie métriques (temps de réponse, erreurs API).

**Capacités :** Logs structurés, métriques Prometheus

---

### Matrice Parcours → Capacités

| Capacité | Parcours | MVP |
|----------|----------|-----|
| Recherche rapide | 1, 2 | ✅ |
| Filtres (version, horaire, cinéma, note) | 1, 2, 4 | ✅ |
| Lien direct réservation | 1, 2, 3, 4 | ✅ |
| Alertes sur film | 3 | ❌ |
| Alertes configurables | 4 | ❌ |
| Notifications push | 3, 4 | ❌ |
| Accès sans compte | 5 | ✅ |
| Inscription simple | 6 | ✅ |
| Logs/monitoring | 7 | ✅ |

---

## Cadrage & Développement Phasé

### Stratégie MVP

**Approche :** MVP orienté expérience - livrer une expérience complète sur les fonctionnalités de base avant d'ajouter la complexité des alertes push.

**Justification :** Les alertes push (FCM, cron jobs, gestion tokens) ajoutent une complexité significative. Mieux vaut une v1 stable.

---

### Phase 1 : MVP

**Parcours supportés :** 1, 2, 5, 6, 7

| Composant | Contenu MVP |
|-----------|-------------|
| **API** | Auth, Films, Cinémas, Watchlist |
| **Web** | Liste films, Détail, Filtres, Recherche, Auth, Watchlist |
| **Mobile** | Même que Web, Android uniquement |

**Capacités MVP :**
- Recherche par titre
- Filtres : cinéma, version (VO/VF), horaire, note
- Navigation par semaine
- Watchlist
- Liens directs vers réservation
- Accès invité + Inscription/Connexion

**Exclus :** Alertes, Notifications push, Filtres avancés

---

### Phase 2 : Growth

- Système d'alertes (création, gestion)
- Notifications push (FCM)
- Deep links (notif → film)
- Filtres avancés (genre, acteur, réalisateur)

**Parcours débloqués :** 3, 4

---

### Phase 3 : Vision

- App iOS (même codebase)
- Cinémas personnalisables par profil
- Support d'autres villes/régions

---

### Risques et Mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Scraping AlloCiné instable | Haut | Cache agressif, fallback, logs |
| Performance API | Moyen | Cache Redis, pagination |
| Temps de développement | Moyen | MVP lean |

---

### Estimation Effort MVP

| Composant | Effort |
|-----------|--------|
| API (Fastify + Prisma + Scraping) | 40% |
| Web (React + Vite) | 30% |
| Mobile (React Native + Expo) | 25% |
| DevOps (Docker) | 5% |

---

## Exigences Techniques

### Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| **API** | Node.js + Fastify + Prisma |
| **Web** | React + Vite + Tailwind |
| **Mobile** | React Native + Expo |
| **BDD** | PostgreSQL (prod) / SQLite (dev) |
| **Auth** | JWT |
| **Push** | Firebase Cloud Messaging |
| **Langage** | TypeScript (unifié) |

---

### API Backend - Endpoints

```
Auth:
  POST /auth/register
  POST /auth/login

Films:
  GET  /films
  GET  /films/{id}
  GET  /films/search?q=

Cinémas:
  GET  /cinemas
  GET  /cinemas/{id}/seances

Utilisateur (auth):
  GET  /me
  GET  /me/watchlist
  POST /me/watchlist
  DELETE /me/watchlist/{id}
  GET  /me/alertes          # Phase 2
  POST /me/alertes          # Phase 2
  DELETE /me/alertes/{id}   # Phase 2
```

---

### Web Frontend

- SPA avec React Router
- État : Zustand + React Query
- Tailwind CSS
- Navigateurs : Chrome, Firefox, Safari, Edge
- Mobile-first, PWA optionnel

**Pages :** `/` `/film/{id}` `/login` `/register` `/profil`

---

### Mobile (React Native + Expo)

- Expo managed workflow
- React Navigation
- NativeWind (Tailwind)
- expo-notifications + FCM (Phase 2)
- AsyncStorage (cache hors-ligne)

**Plateformes :** Android (MVP), iOS (Phase 3)

---

### Authentification JWT

1. Register/Login → `accessToken` + `refreshToken`
2. Stockage : SecureStore (mobile) / localStorage (web)
3. Header : `Authorization: Bearer {token}`
4. Expiration : 15min (access) / 30 jours (refresh)

---

## Exigences Fonctionnelles

### Gestion des Utilisateurs

| # | Exigence |
|---|----------|
| FR1 | Un visiteur peut consulter films et séances sans compte |
| FR2 | Un visiteur peut créer un compte (email + mot de passe) |
| FR3 | Un utilisateur peut se connecter |
| FR4 | Un utilisateur peut se déconnecter |
| FR5 | Un utilisateur connecté peut consulter son profil |
| FR6 | Le système maintient la session entre visites |

### Découverte de Films

| # | Exigence |
|---|----------|
| FR7 | Un utilisateur peut voir la liste des films à l'affiche |
| FR8 | Un utilisateur peut rechercher un film par titre |
| FR9 | Un utilisateur peut filtrer par cinéma |
| FR10 | Un utilisateur peut filtrer par version (VO/VF) |
| FR11 | Un utilisateur peut filtrer par horaire minimum |
| FR12 | Un utilisateur peut filtrer par note |
| FR13 | Un utilisateur peut voir le détail d'un film |
| FR14 | Un utilisateur peut naviguer entre les semaines |

### Gestion des Séances

| # | Exigence |
|---|----------|
| FR15 | Un utilisateur peut voir les séances par film/cinéma/jour |
| FR16 | Un utilisateur peut voir les infos d'une séance |
| FR17 | Un utilisateur peut voir la liste des cinémas |

### Watchlist

| # | Exigence |
|---|----------|
| FR18 | Un utilisateur connecté peut ajouter à sa watchlist |
| FR19 | Un utilisateur connecté peut consulter sa watchlist |
| FR20 | Un utilisateur connecté peut retirer de sa watchlist |

### Réservation

| # | Exigence |
|---|----------|
| FR21 | Un utilisateur peut accéder au lien de réservation externe |
| FR22 | Le lien ouvre le site du cinéma correspondant |

### Administration

| # | Exigence |
|---|----------|
| FR23 | Le système génère des logs structurés |
| FR24 | Le système expose des métriques Prometheus |
| FR25 | Le système synchronise avec AlloCiné périodiquement |

### Phase 2 - Alertes

| # | Exigence |
|---|----------|
| FR26 | Un utilisateur peut créer une alerte sur un film |
| FR27 | Un utilisateur peut configurer les critères d'alerte |
| FR28 | Un utilisateur peut consulter ses alertes |
| FR29 | Un utilisateur peut supprimer une alerte |
| FR30 | Le système envoie une notification push sur match |
| FR31 | Un utilisateur peut accéder au film depuis la notification |

---

### Récapitulatif FRs

| Phase | Domaine | Nombre |
|-------|---------|--------|
| MVP | Gestion Utilisateurs | 6 |
| MVP | Découverte Films | 8 |
| MVP | Séances | 3 |
| MVP | Watchlist | 3 |
| MVP | Réservation | 2 |
| MVP | Administration | 3 |
| **MVP Total** | | **25** |
| Phase 2 | Alertes | 6 |
| **Total** | | **31** |

---

## Exigences Non-Fonctionnelles

### Performance

| # | Exigence | Cible |
|---|----------|-------|
| NFR1 | Temps réponse API (hot cache) | < 200ms |
| NFR2 | Temps réponse API (cold cache) | < 2s |
| NFR3 | Temps sync AlloCiné par cinéma | < 1s |
| NFR4 | Fluidité animations mobile | 60 FPS |
| NFR5 | Chargement initial Web | < 3s |
| NFR6 | Chargement initial Mobile | < 2s |

### Sécurité

| # | Exigence |
|---|----------|
| NFR7 | Mots de passe hashés bcrypt (≥10 rounds) |
| NFR8 | Communications HTTPS |
| NFR9 | JWT : 15min (access) / 30 jours (refresh) |
| NFR10 | RGPD : droit à l'effacement |
| NFR11 | Aucun mot de passe en clair |

### Intégration

| # | Exigence |
|---|----------|
| NFR12 | Gestion gracieuse erreurs AlloCiné (retry, fallback) |
| NFR13 | Rate limiting AlloCiné respecté (≥200ms) |
| NFR14 | Liens externes en nouvel onglet/app |
| NFR15 | Ajout cinémas sans modification code |

### Fiabilité

| # | Exigence |
|---|----------|
| NFR16 | Fonctionne si AlloCiné indisponible (cache) |
| NFR17 | Logs avec contexte suffisant pour debug |
| NFR18 | Restart automatique après crash (Docker) |

---

### Récapitulatif NFRs

| Catégorie | Nombre |
|-----------|--------|
| Performance | 6 |
| Sécurité | 5 |
| Intégration | 4 |
| Fiabilité | 3 |
| **Total** | **18** |

---

## Annexes

### Documents Source

- `output/project-context.md` - Contexte technique
- `output/brainstorming/brainstorming-session-2026-02-04.md` - Session brainstorming
- `CLAUDE.md` - Documentation architecture existante
- `README.md` - Documentation utilisateur

### Traçabilité

```
Vision → Critères de Succès → Parcours Utilisateur → Exigences Fonctionnelles
```

Chaque FR est traçable vers un parcours utilisateur, lui-même aligné avec les critères de succès.

---

*Document généré le 2026-02-04 via BMAD PRD Workflow*
