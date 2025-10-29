# Commande: /status

Affiche l'état actuel du projet CinéBrest avec des statistiques et recommandations.

## Actions à effectuer

### 1. Statistiques du code
Analyser et afficher :
- Nombre de fichiers Python (`.py`)
- Lignes de code Python totales
- Nombre de templates HTML
- Nombre de fichiers JavaScript
- Nombre de fichiers Markdown

Commandes:
```bash
echo "Python files: $(find . -name '*.py' -not -path './__pycache__/*' -not -path './.*' | wc -l)"
echo "Python LOC: $(find . -name '*.py' -not -path './__pycache__/*' -not -path './.*' -exec wc -l {} + | tail -1)"
echo "HTML templates: $(find templates -name '*.html' 2>/dev/null | wc -l)"
echo "Markdown files: $(ls *.md 2>/dev/null | wc -l)"
```

### 2. État de la base de données
Exécuter `python db_stats.py` et afficher :
- Nombre de cinémas
- Nombre de films
- Nombre de séances
- Nombre d'utilisateurs
- Taille de la base de données

### 3. État du cache
Vérifier :
- Présence de dossiers `__pycache__/` (à nettoyer)
- Présence de fichiers `.pyc` (à nettoyer)
- Taille du dossier `data/`

### 4. État Git
Afficher :
- Branche actuelle
- Fichiers modifiés non commités
- Fichiers non suivis
- Derniers commits (5 derniers)

Commandes:
```bash
git branch --show-current
git status --short
git log --oneline -5
```

### 5. État Docker
Si Docker est disponible, afficher :
- Images locales du projet
- Conteneurs en cours d'exécution
- Utilisation mémoire

Commandes:
```bash
docker images | grep cinema
docker ps -a | grep cinema
```

### 6. Santé du projet
Vérifier :
- ✅ Fichier `.env` existe
- ✅ Fichier `.gitignore` existe
- ✅ Fichier `requirements.txt` existe
- ✅ Dossier `data/` existe
- ✅ Base de données existe dans `data/`
- ✅ Pas de fichiers temporaires (check_*.py, etc.)
- ⚠️ Fichiers `__pycache__` présents (à nettoyer)

### 7. Recommandations
Basé sur l'analyse, suggérer :
- 🧹 Nettoyer si des caches sont présents
- 📦 Commit si des fichiers sont modifiés
- 🐳 Rebuild Docker si Dockerfile modifié
- 📚 Mettre à jour la doc si code modifié

## Format de sortie

```
📊 État du Projet CinéBrest
═══════════════════════════════════════

📁 Code
  • Python files: 11 fichiers (2,500 LOC)
  • HTML templates: 5 fichiers
  • Markdown docs: 6 fichiers

💾 Base de Données
  • Cinémas: 5
  • Films: 145
  • Séances: 850
  • Utilisateurs: 12
  • Taille: 2.3 MB

🗂️  Cache
  • __pycache__: 3 dossiers (à nettoyer)
  • Fichiers .pyc: 15 fichiers (à nettoyer)
  • data/: 2.5 MB

📝 Git
  • Branche: main
  • Modifiés: 2 fichiers
  • Non suivis: 0 fichiers
  • Dernier commit: "fix: User-Agent None check"

🐳 Docker
  • Image: cinema-brest:latest (150 MB)
  • Conteneurs: 0 en cours
  • Status: ✅ Prêt

✅ Santé du Projet
  ✅ .env configuré
  ✅ .gitignore présent
  ✅ requirements.txt à jour
  ✅ Base de données initialisée
  ⚠️ Caches Python à nettoyer

💡 Recommandations
  1. 🧹 Exécuter /clean pour nettoyer les caches
  2. 📦 Commiter les 2 fichiers modifiés
  3. ✅ Projet prêt pour production (score: 95/100)
```

## Note
Cette commande est en lecture seule et ne modifie rien.
