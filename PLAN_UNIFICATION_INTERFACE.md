# Plan d'Implémentation : Interface Unifiée Mobile-First

## Objectif

Unifier l'interface ReelTime pour utiliser le pattern mobile (grille + bottom sheet drawer + filtres cachés) sur tous les écrans, avec adaptation responsive du nombre de colonnes.

## Décisions de Design

- **Grille responsive** : 2 colonnes (mobile) → 3 (tablette) → 4 (laptop) → 5 (desktop)
- **Bottom sheet drawer** : Conservé sur tous les écrans (monte du bas), avec largeur max sur desktop
- **Filtres cachés** : Collapsible par défaut sur tous les écrans
- **Suppression complète** : Vue desktop actuelle (liste + tableau + filtres toujours visibles)

## Fichier à Modifier

**`templates/index.html`** (1997 lignes) - Contient tout le HTML, JavaScript et styles inline

## Backup Créé

✅ `templates/index.html.backup` - Fichier de sauvegarde

## Étapes d'Implémentation

### 1. Suppression du Code Desktop (Lignes 141-439)

**Supprimer** :
- Panneau de filtres desktop (lignes 141-220)
- Container desktop `filmsContainer` avec tableaux de séances (lignes 328-439)

**Rationale** : Le pattern mobile deviendra universel.

### 2. Universaliser les Composants Mobile (Lignes 43-326)

**Barre de recherche/filtres (lignes 43-66)** :
- Retirer `md:hidden` de la ligne 43
- Garder le bouton collapsible et le badge de compteur

**Panneau de filtres mobile (lignes 68-139)** :
- Retirer `md:hidden` de la ligne 70
- Améliorer la grille pour desktop : `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`

**Container de films (lignes 272-299)** :
- Retirer `md:hidden` de la ligne 273
- Mise à jour grille : `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4`
- Adapter hauteurs images : `h-56 sm:h-64 md:h-72 lg:h-80`

**Bottom sheet drawer (lignes 301-326)** :
- Retirer `md:hidden` des lignes 303 et 326
- Ajouter contrainte de largeur max sur desktop :
  ```html
  <div id="filmDrawer" class="fixed inset-x-0 bottom-0 max-w-4xl mx-auto transform translate-y-full transition-transform duration-300 ease-out z-50">
  ```
- Garder le swipe-to-close existant (fonctionne sur tous les appareils tactiles)

### 3. Refactorisation JavaScript

**Fonctions à supprimer** :
- `syncSearch()`, `syncSort()`, `syncVersion()`, `syncDay()`, `syncTimeSlot()` (lignes 717-804)
  - Raison : Plus besoin de synchro mobile/desktop
- `toggleViewMode()`, `applyCompactView()`, `applyExtendedView()` (lignes 905-973)
  - Raison : Plus de toggle compact/extended sur desktop

**Fonctions à simplifier** :

**`renderFilms()` (lignes 1563-1750+)** :
- Supprimer le rendu du container desktop
- Garder uniquement le rendu de la grille mobile
- S'assurer que `filmsData` et `datesData` sont bien mis à jour

**`searchFilms()` (lignes 1112-1164)** :
- Supprimer la logique de filtrage desktop (`.film-item`)
- Garder uniquement `.film-mobile-card`
- Vérifier que `searchResultsMobile` affiche le compteur

**`sortFilms()` (lignes 1511+)** :
- Supprimer le tri du container desktop
- Trier uniquement les enfants de la grille (`.film-mobile-card`)
- Maintenir tous les algorithmes de tri

**`filterByCinema()` (lignes 1269-1340)** :
- Supprimer la logique desktop `.cinema-row` (lignes 1288-1305)
- Garder uniquement le filtrage des cartes mobile

**`changeWeek()` (lignes 1044-1110)** :
- Mettre à jour référence : `filmsContainer` → `mobileFilmsContainer`
- Simplifier la logique de restauration (une seule vue)

**`DOMContentLoaded` (lignes 834-886)** :
- Supprimer la restauration du mode compact (lignes 858-861)
- Supprimer les références aux éléments desktop
- Mettre à jour les IDs : `sortSelectMobile` → `sortSelect`, etc.

### 4. Renommer les IDs dans le HTML Mobile

Pour simplifier le code, renommer les IDs "Mobile" en IDs génériques :
- `searchInputMobile` → `searchInput`
- `sortSelectMobile` → `sortSelect`
- `versionSelectMobile` → `versionSelect`
- `ageSelectMobile` → `ageSelect`
- `timeSlotSelectMobile` → `timeSlotSelect`
- `daySelectMobile` → `daySelect`
- `mobileFilmsContainer` → `filmsContainer`

Puis mettre à jour toutes les références JavaScript.

### 5. Implémentation du Compteur de Filtres Actifs

Ajouter fonction `updateFilterBadge()` :
```javascript
function updateFilterBadge() {
    const badge = document.getElementById('filterBadge');
    let count = 0;

    if (document.getElementById('versionSelect').value !== 'all') count++;
    if (document.getElementById('timeSlotSelect').value !== 'all') count++;
    if (document.getElementById('daySelect').value !== 'all') count++;

    const unchecked = Array.from(document.querySelectorAll('.cinema-chip input'))
        .filter(cb => !cb.checked).length;
    if (unchecked > 0) count++;

    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
}
```

Appeler dans toutes les fonctions de filtrage.

### 6. Ajustements CSS

**Ajouter styles pour hover desktop** :
```css
@media (min-width: 768px) {
    .film-mobile-card {
        transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .film-mobile-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }
}
```

**Drawer centré sur desktop** :
Le `max-w-4xl mx-auto` sur le drawer empêchera qu'il s'étire sur toute la largeur.

### 7. Nettoyage

**localStorage** :
- Supprimer la clé `compactView` (deprecated)

**Variables globales** :
- Supprimer `isCompactView`

**Commentaires** :
- Mettre à jour les références à "desktop view" / "mobile view"

## Ordre d'Implémentation Recommandé

### Jour 1 : Structure HTML
1. ✅ Backup de `index.html`
2. Supprimer panneaux desktop (lignes 141-220, 328-439)
3. Retirer `md:hidden` des composants mobile
4. Mettre à jour classes responsive de la grille
5. Tester : vérifier que la grille s'affiche sur tous écrans

### Jour 2 : JavaScript Core
1. Mettre à jour `renderFilms()`
2. Supprimer fonctions de sync
3. Mettre à jour `changeWeek()` et `searchFilms()`
4. Tester : recherche et navigation semaine

### Jour 3 : Filtres et Tri
1. Simplifier toutes les fonctions de filtrage
2. Mettre à jour `sortFilms()`
3. Implémenter `updateFilterBadge()`
4. Tester : tous les filtres et tris

### Jour 4 : Finalisation
1. Renommer IDs mobile → génériques
2. Ajuster drawer pour desktop (max-width)
3. Ajouter styles CSS hover
4. Mettre à jour `DOMContentLoaded`
5. Tester : drawer sur tous écrans

### Jour 5 : Tests et Nettoyage
1. Tests complets (voir checklist ci-dessous)
2. Nettoyage code et commentaires
3. Tests cross-browser
4. Déploiement

## Checklist de Vérification

### Responsive Grid
- [ ] 2 colonnes sur mobile (< 640px)
- [ ] 3 colonnes sur tablette (640-767px)
- [ ] 4 colonnes sur laptop (768-1023px)
- [ ] 5 colonnes sur desktop (≥ 1024px)
- [ ] Ratio aspect cartes correct à toutes tailles
- [ ] Hover fonctionne sur desktop (pas sur tactile)

### Bottom Sheet Drawer
- [ ] Monte du bas sur tous écrans
- [ ] Swipe-down pour fermer fonctionne (tactile)
- [ ] Clic sur backdrop ferme le drawer
- [ ] Drawer scroll indépendant quand contenu dépasse
- [ ] Largeur max centrée sur desktop
- [ ] Bouton fermeture fonctionne

### Filtres
- [ ] Panneau caché par défaut sur tous écrans
- [ ] Bouton toggle affiche/cache les filtres
- [ ] Badge montre le bon nombre de filtres actifs
- [ ] Tous les dropdowns fonctionnels
- [ ] Chips cinéma wrap correctement
- [ ] Sync localStorage fonctionne

### Recherche
- [ ] Input filtre les cartes grille
- [ ] Compteur résultats correct
- [ ] Message "no results" affiché si besoin
- [ ] Recherche persiste entre changements de semaine

### Tri et Filtrage
- [ ] Tri : Popularité, Alphabétique, Année, Nb séances
- [ ] Filtre cinéma (toutes combinaisons)
- [ ] Filtre version (All, VF, VO)
- [ ] Filtre créneau horaire
- [ ] Filtre jour de semaine
- [ ] Filtre âge film
- [ ] Combinaison multiple de filtres fonctionne

### Navigation Semaine
- [ ] Boutons Précédent/Suivant fonctionnent
- [ ] Période semaine s'update correctement
- [ ] Bouton "Aujourd'hui" apparaît quand offset ≠ 0
- [ ] Retour à semaine actuelle fonctionne
- [ ] Filtres/tri persistent entre semaines

### Watchlist (si authentifié)
- [ ] Boutons séances montrent statut watchlist dans drawer
- [ ] Ajout à watchlist colore le bouton
- [ ] Suppression watchlist fonctionne
- [ ] État persiste après navigation

### Accessibilité
- [ ] Navigation clavier dans grille fonctionne
- [ ] Enter/Espace ouvre drawer
- [ ] Escape ferme drawer
- [ ] Dropdowns filtres navigables au clavier

### Performance
- [ ] Chargement initial < 3s (cache froid)
- [ ] Changement semaine < 500ms (cache chaud)
- [ ] Ouverture drawer < 300ms
- [ ] Application filtre < 100ms

### Edge Cases
- [ ] Aucun film dans semaine (message affiché)
- [ ] Tous cinémas déselectionnés (message)
- [ ] Tous filtres excluent tous films (message)
- [ ] Titres très longs (truncate)
- [ ] Données film manquantes gérées
- [ ] Refresh minuit fonctionne toujours

## Fichiers Critiques

- **`C:\Users\raf29\Documents\cinemaBrest\templates\index.html`** - Fichier principal à modifier
- **`C:\Users\raf29\Documents\cinemaBrest\templates\base.html`** - Pas de changement nécessaire
- **`C:\Users\raf29\Documents\cinemaBrest\app.py`** - Pas de changement nécessaire

## Risques et Mitigations

**Risque élevé** : Logique de filtres complexe (mobile/desktop différents actuellement)
- **Mitigation** : Tester toutes combinaisons de filtres

**Risque moyen** : Références container dans `renderFilms()`
- **Mitigation** : S'assurer que `filmsData`/`datesData` sont bien mis à jour

**Risque faible** : Drawer au breakpoint exact 768px
- **Mitigation** : Tester à 767px, 768px, 769px

## Plan de Rollback

1. Restaurer backup : `cp templates/index.html.backup templates/index.html`
2. En cas de problème critique : restaurer l'original
3. Monitoring 24h après déploiement

## Métriques de Succès

- ✅ Grille s'adapte correctement à chaque breakpoint
- ✅ Drawer s'ouvre/ferme smoothly sur tous appareils
- ✅ Tous filtres fonctionnels sur tous écrans
- ✅ Aucune régression fonctionnalité watchlist
- ✅ Recherche performe aussi bien qu'avant
- ✅ Pas d'augmentation erreurs JavaScript

## Commande de Notification

Pour notifier la fin des tâches :
```bash
powershell.exe -c "[System.Media.SystemSounds]::Asterisk.Play()"
```
