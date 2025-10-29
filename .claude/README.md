# Commandes Claude Code Personnalisées

Ce dossier contient des commandes personnalisées pour Claude Code permettant d'automatiser les tâches courantes du projet CinéBrest.

## Commandes Disponibles

### `/clean` - Nettoyage du Projet
Nettoie automatiquement le projet en supprimant :
- Caches Python (`__pycache__/`, `*.pyc`, `*.pyo`)
- Base de données de cache
- Fichiers temporaires de développement
- Fichiers Markdown temporaires
- (Optionnel) Images et conteneurs Docker inutilisés

**Utilisation** :
```
/clean
```

**Quand l'utiliser** :
- Après développement intensif
- Avant un commit Git
- Quand l'espace disque est faible
- Après un changement de branche
- Avant un déploiement

**Résultat attendu** :
- ~50-200 MB d'espace libéré
- Projet propre et optimisé
- Caches vidés pour un rechargement frais

---

### `/status` - État du Projet
Affiche un rapport complet sur l'état actuel du projet :
- Statistiques du code (LOC, fichiers)
- État de la base de données (films, séances, utilisateurs)
- État du cache (fichiers à nettoyer)
- État Git (branche, modifications, commits récents)
- État Docker (images, conteneurs)
- Santé globale du projet
- Recommandations d'actions

**Utilisation** :
```
/status
```

**Quand l'utiliser** :
- Au début d'une session de développement
- Avant un commit important
- Pour vérifier la santé du projet
- Pour voir rapidement ce qui a changé
- Pour obtenir des recommandations

**Résultat attendu** :
- Vue d'ensemble complète en 5 secondes
- Score de qualité du projet
- Actions recommandées

---

### `/test` - Tests et Validations
Lance une suite complète de tests et validations :
- Vérification de l'environnement Python
- Tests de syntaxe (compilation)
- Tests des imports
- Tests de la base de données
- Tests des routes Flask
- Tests du système de cache
- Audit de sécurité
- (Optionnel) Build Docker

**Utilisation** :
```
/test
```

**Quand l'utiliser** :
- Avant chaque commit
- Après modification du code
- Avant un déploiement
- Après installation de dépendances
- Pour vérifier que tout fonctionne

**Résultat attendu** :
- Tous les tests passés (✅)
- Identification rapide des problèmes
- Confiance pour déployer

---

## Comment Utiliser les Commandes

### Dans Claude Code Chat

1. Ouvrez Claude Code Chat (`Ctrl+Alt+I` ou `Cmd+Shift+I`)
2. Tapez la commande précédée d'un `/` :
   ```
   /clean
   ```
3. Appuyez sur `Entrée`
4. Claude exécutera automatiquement les actions définies

### Workflow Recommandé

#### Début de Session de Développement
```
/status
```
→ Voir l'état du projet et les recommandations

#### Pendant le Développement
```
/test
```
→ Valider les modifications régulièrement

#### Avant un Commit
```
/clean
/test
/status
```
→ Nettoyer, tester, vérifier l'état

#### Avant un Déploiement
```
/test
/status
```
→ S'assurer que tout est prêt pour la production

---

## Personnalisation

Vous pouvez modifier ces commandes en éditant les fichiers `.md` dans `commands/` :

- `commands/clean.md` - Personnaliser le nettoyage
- `commands/status.md` - Ajouter des statistiques
- `commands/test.md` - Ajouter des tests

### Créer une Nouvelle Commande

1. Créez un fichier `.md` dans `commands/`
   ```
   .claude/commands/ma-commande.md
   ```

2. Utilisez le format suivant :
   ```markdown
   # Commande: /ma-commande

   Description de ce que fait la commande.

   ## Actions à effectuer

   ### 1. Première action
   - Détails...

   ### 2. Deuxième action
   - Détails...

   ## Format de sortie
   ```
   Exemple de sortie attendue
   ```
   ```

3. Utilisez la commande :
   ```
   /ma-commande
   ```

---

## Avantages des Commandes Claude Code

✅ **Automatisation** : Plus besoin de taper les commandes manuellement
✅ **Cohérence** : Mêmes actions exécutées à chaque fois
✅ **Rapidité** : Tâches complexes en une commande
✅ **Documentation** : Les commandes documentent les processus
✅ **Partage** : Toute l'équipe utilise les mêmes commandes
✅ **Évolution** : Facile d'améliorer les commandes au fil du temps

---

## Dépannage

### Commande Non Reconnue
**Problème** : `/clean` n'est pas reconnu
**Solution** : Vérifiez que vous êtes dans le bon projet et que `.claude/commands/clean.md` existe

### Commande Échoue
**Problème** : La commande retourne des erreurs
**Solution** : Vérifiez les logs, l'environnement Python, et les dépendances

### Commande Trop Lente
**Problème** : `/test` prend trop de temps
**Solution** : Commentez les sections optionnelles dans `commands/test.md`

---

## Support

Pour toute question ou amélioration :
1. Consultez la documentation Claude Code : https://docs.claude.com/claude-code
2. Éditez directement les fichiers `.md` dans `commands/`
3. Partagez vos améliorations avec l'équipe

---

**Version** : 1.0
**Projet** : CinéBrest
**Auteur** : Équipe de développement
**Dernière mise à jour** : 2025-10-29
