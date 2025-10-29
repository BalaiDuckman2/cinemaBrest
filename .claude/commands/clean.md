# Commande: /clean

Nettoie le projet CinéBrest en supprimant les fichiers temporaires, caches et fichiers inutiles.

## Actions à effectuer

### 1. Nettoyage des caches Python
- Supprimer tous les dossiers `__pycache__/`
- Supprimer tous les fichiers `*.pyc`, `*.pyo`, `*.pyd`
- Afficher le nombre de fichiers supprimés

Commandes:
```bash
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete
find . -type f -name "*.pyo" -delete
find . -type f -name "*.pyd" -delete
```

### 2. Nettoyage des caches applicatifs
- Vider la base de données de cache : `python clear_db.py`
- Afficher un message de confirmation

### 3. Nettoyage des fichiers temporaires
Supprimer les fichiers de développement/test temporaires :
- `check_*.py`
- `test_*.py` (sauf dans un dossier tests/)
- `debug_*.py`
- `inspect_*.py`
- `tmp_*.py`
- `temp_*.py`

### 4. Nettoyage des logs et rapports
Supprimer les fichiers Markdown temporaires :
- `*_SUMMARY.md`
- `AMELIORATIONS_*.md`
- `CORRECTION_*.md`
- `NETTOYAGE_*.md`
- `NOUVEAU_*.md`
- `RECAPITULATIF_*.md`

### 5. Nettoyage Docker (optionnel)
Demander à l'utilisateur s'il veut nettoyer Docker :
- Images Docker non utilisées
- Conteneurs arrêtés
- Volumes orphelins

Commandes:
```bash
docker system prune -f
docker volume prune -f
```

### 6. Rapport final
Afficher un résumé :
- ✅ Nombre de fichiers `__pycache__` supprimés
- ✅ Nombre de fichiers `.pyc/.pyo/.pyd` supprimés
- ✅ Base de données vidée (oui/non)
- ✅ Fichiers temporaires supprimés (nombre)
- ✅ Fichiers Markdown temporaires supprimés (nombre)
- ✅ Espace disque libéré (estimation)
- ✅ Docker nettoyé (oui/non/skip)

## Important
- Ne PAS supprimer les fichiers de configuration (.env, .gitignore, etc.)
- Ne PAS supprimer les fichiers de documentation principaux (README.md, CLAUDE.md, etc.)
- Ne PAS supprimer le dossier `data/` (base de données principale)
- Toujours demander confirmation avant de supprimer des fichiers Docker

## Format de sortie
Afficher un message clair avec émojis :
```
🧹 Nettoyage du projet CinéBrest...

✅ Python caches: 12 dossiers supprimés
✅ Fichiers .pyc: 45 fichiers supprimés
✅ Base de données: Vidée (250 séances supprimées)
✅ Fichiers temporaires: 3 fichiers supprimés
✅ Markdown temporaires: 0 fichiers trouvés
✅ Docker: Nettoyé (125 MB libérés)

💾 Espace total libéré: ~130 MB
⏱️  Temps: 2.3s

✨ Projet nettoyé avec succès !
```
