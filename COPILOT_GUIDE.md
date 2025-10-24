# 🤖 Guide d'Utilisation de GitHub Copilot - CinéBrest

## 📋 Commandes Personnalisées Disponibles

GitHub Copilot a été configuré avec des instructions personnalisées pour ce projet. Voici comment les utiliser :

### 🧹 `/clean_code` - Nettoyer le Code et le Workspace

**Usage** : Dans Copilot Chat, tapez `/clean_code` pour un nettoyage complet du workspace.

**Exemples** :
```
/clean_code                    # Nettoie tout le workspace
/clean_code app.py             # Nettoie uniquement app.py
/clean_code modules/           # Nettoie tous les fichiers du dossier modules/
```

**Actions effectuées** :

#### 📂 Phase 1 - Analyse du Workspace
- ✅ Scan de tous les fichiers du projet
- ✅ Détection des fichiers dupliqués (MD5)
- ✅ Détection des assets inutilisés (images, fonts, CSS)
- ✅ Détection des fichiers temporaires (.pyc, __pycache__)
- ✅ Détection de la documentation redondante

#### 🗑️ Phase 2 - Nettoyage des Fichiers
- ✅ Suppression des fichiers temporaires Python
- ✅ Suppression des fichiers dupliqués
- ✅ Suppression des images/assets non référencés
- ✅ Suppression des dossiers vides
- ✅ Suppression des backups (.bak, .old, ~)
- ✅ Consolidation de la documentation

#### 🐍 Phase 3 - Nettoyage du Code Python
- ✅ Suppression des imports inutilisés
- ✅ Réorganisation des imports (stdlib → third-party → local)
- ✅ Suppression des variables non utilisées
- ✅ Suppression des fonctions mortes (jamais appelées)
- ✅ Formatage PEP 8 (4 espaces, 79 caractères max)
- ✅ Ajout des type hints manquants
- ✅ Vérification/ajout des docstrings (format Google)
- ✅ Suppression des print() de debug
- ✅ Suppression des lignes vides en trop (max 2 consécutives)
- ✅ Suppression des commentaires inutiles

#### 📜 Phase 4 - Nettoyage du Code JavaScript
- ✅ Suppression des fonctions dupliquées
- ✅ Suppression des variables non utilisées
- ✅ Suppression des event listeners orphelins
- ✅ Optimisation des querySelector répétés
- ✅ Suppression des console.log() de debug
- ✅ Suppression des lignes vides en trop

#### 🌐 Phase 5 - Nettoyage des Templates HTML
- ✅ Suppression des classes CSS non utilisées
- ✅ Suppression des attributs vides (class="", style="")
- ✅ Suppression des commentaires HTML inutiles
- ✅ Optimisation des balises répétées
- ✅ Vérification des liens cassés

#### 📊 Phase 6 - Rapport Final
- ✅ Résumé des actions effectuées
- ✅ Liste des fichiers supprimés
- ✅ Espace disque libéré
- ✅ Optimisations supplémentaires proposées
- ✅ Création d'un rapport détaillé (CLEAN_REPORT.md)

**⚠️ Important** : Toujours faire un commit Git AVANT de lancer `/clean_code` !

---

### 🗄️ `/optimize_db` - Optimiser la Base de Données

**Usage** :
```
/optimize_db
```

**Actions effectuées** :
1. ✅ Vérification des index SQLite
2. ✅ Optimisation des requêtes (EXPLAIN QUERY PLAN)
3. ✅ Ajout d'index manquants
4. ✅ Vérification du TTL du cache
5. ✅ Nettoyage des anciennes données

---

### 📱 `/fix_pwa` - Corriger la PWA

**Usage** :
```
/fix_pwa
```

**Actions effectuées** :
1. ✅ Vérification du manifest.json
2. ✅ Correction du service worker (urlsToCache)
3. ✅ Vérification des icônes PWA (192x192, 512x512)
4. ✅ Test de l'installabilité
5. ✅ Vérification de la stratégie de cache

---

### ✨ `/add_feature` - Ajouter une Fonctionnalité

**Usage** :
```
/add_feature Ajouter un filtre par réalisateur
```

**Actions effectuées** :
1. ✅ Analyse de la demande
2. ✅ Identification des fichiers à modifier
3. ✅ Proposition d'architecture
4. ✅ Implémentation avec tests
5. ✅ Mise à jour de la documentation

---

### 🐳 `/docker_check` - Vérifier Docker

**Usage** :
```
/docker_check
```

**Actions effectuées** :
1. ✅ Vérification du Dockerfile
2. ✅ Optimisation des layers
3. ✅ Vérification du .dockerignore
4. ✅ Test du build local
5. ✅ Vérification du docker-compose.yml

---

### 🔒 `/security_audit` - Audit de Sécurité

**Usage** :
```
/security_audit
```

**Actions effectuées** :
1. ✅ Vérification des variables d'environnement (.env)
2. ✅ Vérification de l'absence de credentials en dur
3. ✅ Vérification des dépendances (pip list)
4. ✅ Proposition de rate limiting
5. ✅ Vérification des headers de sécurité

---

## 🎯 Comment Utiliser les Commandes

### Méthode 1 : Copilot Chat (Recommandé)

1. **Ouvrir Copilot Chat** : `Ctrl+Alt+I` (Windows) ou `Cmd+Shift+I` (Mac)
2. **Taper la commande** : `/clean_code app.py`
3. **Valider** : Appuyez sur Entrée
4. **Suivre les suggestions** : Copilot va proposer les modifications

### Méthode 2 : Inline Chat

1. **Sélectionner le code** à nettoyer
2. **Ouvrir Inline Chat** : `Ctrl+I` (Windows) ou `Cmd+I` (Mac)
3. **Taper** : `clean this code according to project guidelines`
4. **Valider** : Copilot appliquera les règles du projet

### Méthode 3 : Commentaire Magique

Dans votre code Python, tapez :
```python
# TODO: clean_code
```

Puis demandez à Copilot de suivre les instructions du projet.

---

## 📚 Règles Automatiques

Copilot appliquera automatiquement ces règles quand vous codez :

### Python
- ✅ PEP 8 strict (4 espaces)
- ✅ Type hints partout
- ✅ Docstrings format Google
- ✅ Imports groupés et triés
- ✅ Logging avec emojis (🎬, ✓, ⚠️, ❌)

### JavaScript
- ✅ Vanilla JS uniquement (pas de frameworks)
- ✅ camelCase pour les variables
- ✅ `querySelector` préféré à `getElementById`
- ✅ Vérification localStorage avant usage

### CSS
- ✅ **Tailwind CSS uniquement** (pas de custom CSS)
- ✅ Classes responsive (`sm:`, `md:`, `lg:`)
- ✅ Palette indigo pour le thème

---

## 🚀 Exemples Pratiques

### Exemple 1 : Nettoyage Complet du Workspace

**Commande** :
```
/clean_code
```

**Résultat** :
```
🔍 Analyse du workspace...

📂 Fichiers trouvés :
- Total : 35 fichiers
- Python : 8 fichiers
- JavaScript : 1 fichier (dans templates)
- HTML : 2 fichiers
- Images : 7 fichiers
- Autres : 17 fichiers

🗑️ Fichiers à supprimer :
- __pycache__/ (3 fichiers, 45 KB)
- static/images/old_logo.png (non référencé, 120 KB)
- CLEANUP_SUMMARY.md (temporaire, 15 KB)
- README_OLD.md (duplicata, 8 KB)

🐍 Code Python :
- app.py : 3 imports inutilisés, 2 variables non utilisées
- modules/api.py : 5 lignes vides en trop
- modules/database.py : 2 docstrings manquants

📜 Code JavaScript :
- templates/index.html : 2 console.log() à supprimer
- 1 fonction dupliquée (filterByVersion)

🌐 Templates HTML :
- base.html : 5 classes Tailwind non utilisées
- index.html : 3 commentaires obsolètes

✅ Nettoyage effectué !
📊 Espace libéré : 188 KB
📄 Rapport détaillé : CLEAN_REPORT.md
```

### Exemple 2 : Nettoyer un Fichier Spécifique

**Avant** :
```python
from flask import Flask, render_template, request
import requests
from datetime import datetime, timedelta
import time

unused_var = "test"

def get_movies():
    movies = []
    for i in range(10):
        movies.append(i)
    return movies
```

**Commande** :
```
/clean_code app.py
```

**Après** :
```python
from datetime import datetime, timedelta

from flask import Flask, render_template, request
import requests

from modules.api import Theater
from modules.database import db


def get_movies() -> list[int]:
    """Récupère la liste des films.
    
    Returns:
        list[int]: Liste des IDs de films
    """
    return list(range(10))
```

### Exemple 2 : Ajouter une Feature

**Commande** :
```
/add_feature Ajouter un bouton pour exporter les séances en PDF
```

**Réponse Copilot** :
```
Je vais ajouter cette fonctionnalité en plusieurs étapes :

1. **Backend (app.py)** :
   - Nouvelle route `/export_pdf`
   - Utilisation de `reportlab` pour générer le PDF

2. **Frontend (index.html)** :
   - Bouton "Exporter en PDF" avec icône
   - Tailwind : `bg-indigo-600 hover:bg-indigo-700`

3. **Dépendances (requirements.txt)** :
   - Ajouter `reportlab==4.0.7`

Voulez-vous que je procède ?
```

---

## 💡 Astuces

### 1. Utiliser le Contexte

Copilot comprend mieux avec du contexte :
```
@workspace /clean_code app.py en suivant les règles PEP 8 du projet
```

### 2. Référencer d'Autres Fichiers

```
Ajoute une fonction similaire à celle dans modules/api.py
```

### 3. Demander des Explications

```
Explique-moi le cache 3 niveaux dans ce projet
```

### 4. Corriger les Erreurs

```
/fix_pwa Le service worker ne charge pas les images
```

---

## 🔧 Configuration Avancée

### Modifier les Instructions

Les instructions personnalisées sont dans :
```
.github/copilot-instructions.md
```

Pour ajouter une nouvelle commande :

1. Ouvrir `.github/copilot-instructions.md`
2. Ajouter une section `#### /ma_commande`
3. Décrire les actions à effectuer
4. Sauvegarder

**Exemple** :
```markdown
#### `/test`
1. Vérifier que les tests existent
2. Lancer pytest
3. Afficher le coverage
4. Proposer des tests manquants
```

### Paramètres VS Code

Les paramètres Copilot sont dans :
```
.vscode/settings.json
```

---

## 📖 Documentation Complète

- **Instructions du projet** : `.github/copilot-instructions.md`
- **Architecture** : `ARCHITECTURE.md`
- **Scripts utiles** : `scripts.md`
- **README principal** : `README.md`

---

## 🆘 Aide Rapide

**Commande** | **Usage** | **Exemple**
---|---|---
`/clean_code` | Nettoyer workspace complet | `/clean_code` ou `/clean_code app.py`
`/optimize_db` | Optimiser SQLite | `/optimize_db`
`/fix_pwa` | Corriger la PWA | `/fix_pwa`
`/add_feature` | Nouvelle feature | `/add_feature filtrer par genre`
`/docker_check` | Vérifier Docker | `/docker_check`
`/security_audit` | Audit sécurité | `/security_audit`

### 🧹 Détails `/clean_code`

**Option** | **Description**
---|---
`/clean_code` | Nettoie tout le workspace (fichiers + code)
`/clean_code app.py` | Nettoie uniquement app.py
`/clean_code modules/` | Nettoie tous les fichiers du dossier modules/
`/clean_code --dry-run` | Affiche ce qui serait nettoyé sans rien modifier

**Actions** :
- 🗑️ Supprime fichiers temporaires (__pycache__, .pyc)
- 🗑️ Supprime fichiers dupliqués (MD5)
- 🗑️ Supprime assets non référencés (images, fonts)
- 🗑️ Supprime dossiers vides
- 🐍 Nettoie code Python (imports, variables, PEP 8)
- 📜 Nettoie JavaScript (fonctions dupliquées, console.log)
- 🌐 Nettoie HTML (classes inutilisées, commentaires)
- 📊 Génère rapport CLEAN_REPORT.md

---

**Bon développement avec Copilot ! 🚀**
