# Commande: /test

Lance tous les tests et validations du projet CinéBrest.

## Actions à effectuer

### 1. Vérification de l'environnement
Vérifier que tous les prérequis sont installés :
- Python 3.13+
- Toutes les dépendances de `requirements.txt`
- Base de données initialisée

Commandes:
```bash
python --version
pip list | grep Flask
python -c "from modules.database import db; print('✅ Database OK')"
```

### 2. Tests de syntaxe Python
Vérifier que tous les fichiers Python compilent :
```bash
python -m py_compile app.py
python -m py_compile modules/*.py
python -m py_compile clear_db.py
python -m py_compile db_stats.py
python -m py_compile init_auth_db.py
```

### 3. Tests d'imports
Vérifier que tous les imports fonctionnent :
```python
# Test dans un script temporaire
try:
    from app import app, getShowtimesWeek, generate_letterboxd_url
    from modules.api import Movie, Theater, Showtime
    from modules.database import db
    from modules.auth import User
    from modules.forms import LoginForm, RegisterForm
    print("✅ Tous les imports fonctionnent")
except ImportError as e:
    print(f"❌ Erreur d'import: {e}")
```

### 4. Tests de la base de données
- Vérifier que la base existe
- Vérifier les tables (users, watchlist, cinemas, films, seances)
- Tester une requête simple
- Afficher les statistiques

Commandes:
```bash
python db_stats.py
python -c "from modules.database import db; print('Tables:', db.get_stats())"
```

### 5. Tests des routes Flask
Tester les principales routes (sans lancer le serveur) :
- `/` (home)
- `/healthcheck`
- `/api/films`
- `/login` (GET)
- `/register` (GET)

### 6. Tests de cache
Vérifier le système de cache :
- Vider les caches avec `clear_db.py`
- Vérifier que les caches se reconstruisent
- Tester les 3 niveaux de cache

### 7. Tests de sécurité
Vérifier :
- ✅ SECRET_KEY est défini dans .env
- ✅ CSRF protection activée
- ✅ Rate limiting configuré
- ✅ Bcrypt pour les mots de passe
- ✅ Session secure configuré si HTTPS

### 8. Tests Docker
Si Docker est disponible :
```bash
docker build -t cinema-test . && echo "✅ Docker build OK"
```

### 9. Validation du code
- Vérifier PEP 8 (optionnel, avec flake8 si installé)
- Vérifier type hints (optionnel, avec mypy si installé)

## Format de sortie

```
🧪 Tests du Projet CinéBrest
═══════════════════════════════════════

📋 Environnement
  ✅ Python 3.13.0
  ✅ Flask 3.1.2
  ✅ Toutes dépendances installées
  ✅ Base de données initialisée

🐍 Syntaxe Python
  ✅ app.py compilé
  ✅ modules/api.py compilé
  ✅ modules/database.py compilé
  ✅ modules/auth.py compilé
  ✅ modules/forms.py compilé
  ✅ modules/monitoring.py compilé
  ✅ modules/curl.py compilé
  ✅ modules/auto_refresh.py compilé
  ✅ clear_db.py compilé
  ✅ db_stats.py compilé
  ✅ init_auth_db.py compilé

📦 Imports
  ✅ Tous les imports fonctionnent

💾 Base de Données
  ✅ Tables créées (7 tables)
  ✅ 5 cinémas, 145 films, 850 séances
  ✅ Indexes présents
  ✅ Requêtes fonctionnent

🌐 Routes Flask
  ✅ / (home)
  ✅ /healthcheck
  ✅ /api/films
  ✅ /login
  ✅ /register

🗄️  Cache
  ✅ Cache mémoire fonctionne
  ✅ Cache SQLite fonctionne
  ✅ TTL de 6h configuré

🔒 Sécurité
  ✅ SECRET_KEY configuré
  ✅ CSRF protection activée
  ✅ Rate limiting: 200/jour, 50/heure
  ✅ Bcrypt pour passwords
  ✅ Sessions sécurisées

🐳 Docker
  ✅ Dockerfile valide
  ✅ Build réussi (150 MB)

═══════════════════════════════════════
✅ Tous les tests passés (11/11)
⏱️  Temps total: 3.2s

🎉 Projet prêt pour la production !
```

## En cas d'erreur
Si un test échoue, afficher :
```
❌ Test échoué: [nom du test]
📝 Erreur: [message d'erreur détaillé]
💡 Suggestion: [comment corriger]
```

## Note
Cette commande ne modifie rien et peut être lancée à tout moment.
