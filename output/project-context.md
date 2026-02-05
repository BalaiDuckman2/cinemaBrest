---
project_name: 'ReelTime (cinemaBrest-1)'
user_name: 'Raphael'
date: '2026-02-04'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'critical_rules']
status: 'complete'
rule_count: 47
optimized_for_llm: true
---

# Project Context for AI Agents

_Ce fichier contient les règles critiques et patterns que les agents IA doivent suivre lors de l'implémentation de code dans ce projet. Focus sur les détails non-évidents que les agents pourraient manquer._

---

## Technology Stack & Versions

### Backend
- **Python 3.13** - Utiliser les features modernes (match/case, type hints)
- **Flask 3.x** - Application WSGI standard
- **SQLite 3** - Base locale, pas d'ORM (raw SQL avec `sqlite3.Row`)

### Extensions Flask
- Flask-Login, Flask-Bcrypt, Flask-WTF, Flask-Limiter, Flask-Compress, Flask-Talisman

### Frontend
- **Tailwind CSS** via CDN uniquement - JAMAIS de CSS personnalisé
- **Vanilla JavaScript** - JAMAIS de frameworks (React, Vue, etc.)
- Google Fonts : Bebas Neue, Playfair Display, Crimson Text

### Infrastructure
- Docker avec python:3.13-slim
- Timezone : Europe/Paris (ZoneInfo)

---

## Critical Implementation Rules

### Règles Python

**Imports :**
- Ordre : stdlib → third-party → modules locaux (`from modules.xxx import`)
- Utiliser `from modules.database import db` (instance singleton)
- JAMAIS `import *` sauf pour `modules.api` (legacy accepté)

**Gestion des erreurs :**
- Try/except avec logs emoji : `print(f"⚠️ Erreur: {e}")`
- Emojis standards : 🎬 (startup), ✓ (succès), ⚠️ (warning), ❌ (erreur), 🔍 (recherche)
- Ne pas cacher les exceptions - toujours logger

**Type hints :**
- Encouragés mais pas obligatoires
- Utiliser `Optional[T]` et `List[T]` de `typing`
- Docstrings format Google pour les fonctions publiques

**Patterns spécifiques :**
- `ZoneInfo(getenv("TIMEZONE"))` pour les dates (jamais pytz)
- `datetime.fromisoformat()` pour parser les dates
- Validation années : `1880 <= year <= datetime.now().year + 2`

### Règles Flask

**Routes :**
- Décorateur `@login_required` pour routes authentifiées
- Décorateur `@no_cache` après `@login_required` pour contenu utilisateur
- Rate limiting : `@limiter.limit("X per hour")` sur routes sensibles

**Authentification :**
- `current_user` de Flask-Login pour l'utilisateur connecté
- Sessions 30 jours avec "remember me" : `login_user(user, remember=True)`
- Hashage bcrypt via `User.hash_password()` et `User.check_password()`

**Formulaires :**
- CSRF obligatoire via Flask-WTF (`{{ form.csrf_token }}`)
- Validation côté serveur avec WTForms validators
- Messages flash en français : `flash("Message", "success|error|info")`

**Réponses :**
- `jsonify()` pour les réponses API
- `make_response()` pour headers personnalisés
- `render_template()` avec contexte Jinja2

**Sécurité (Flask-Talisman) :**
- CSP headers en production (`FORCE_HTTPS=true`)
- Sanitizer HTML : `html.escape()` pour les entrées utilisateur

### Règles de Test

**État actuel :**
- ⚠️ Pas de suite de tests automatisés (tests manuels uniquement)
- Fichiers de test exclus via `.gitignore` : `test_*.py`, `check_*.py`, `debug_*.py`

**Si des tests sont ajoutés :**
- Utiliser `pytest` comme framework
- Fichiers dans un dossier `tests/` à la racine
- Nommage : `test_<module>.py`
- Mocker les appels API AlloCiné (éviter les vrais appels réseau)
- Utiliser une base SQLite en mémoire pour les tests DB

**Tests manuels actuels :**
- Vérifier le endpoint `/healthcheck` retourne "ok"
- Tester la navigation des semaines (`/api/films?week=0,1,2...`)
- Vérifier les filtres (version, cinéma, âge)
- Tester le flow d'authentification complet

### Règles de Qualité & Style

**Python (PEP 8) :**
- Indentation : 4 espaces
- Longueur max : 79 caractères (flexible jusqu'à 100)
- Pas de linter/formatter configuré - suivre PEP 8 manuellement

**Organisation des fichiers :**
- `app.py` : Routes et logique principale
- `modules/` : Classes et utilitaires (api.py, database.py, auth.py, forms.py)
- `templates/` : Templates Jinja2 (.html)
- `static/` : Assets statiques (images, sw.js, manifest.json)
- `data/` : Base SQLite (gitignored)

**Conventions de nommage :**
- Fichiers Python : `snake_case.py`
- Classes : `PascalCase` (Movie, Theater, Showtime, User)
- Fonctions/variables : `snake_case` ou `camelCase` (mixte dans le projet)
- Constantes globales : `_snake_case` avec underscore (ex: `_week_cache`, `_memory_cache`)

**Templates Jinja2 :**
- Héritage : `{% extends 'base.html' %}`
- Blocs : `{% block head %}`, `{% block content %}`
- Variables : `{{ variable }}` avec `| safe` si HTML autorisé

**JavaScript (dans templates) :**
- Vanilla JS uniquement, pas de `<script src>` externes (sauf CDN Tailwind)
- `querySelector` préféré à `getElementById`
- localStorage pour persistance côté client
- Fonctions globales : `camelCase` (changeWeek, filterByVersion, etc.)

### Règles de Workflow

**Git :**
- Branche principale : `main`
- Branches feature : `feature/nom-feature`
- Commits en français ou anglais, messages descriptifs

**Développement local :**
- `python app.py` pour lancer le serveur
- Variable `SKIP_PRELOAD=true` pour démarrage rapide (évite le preload de 60 jours)
- `python clear_db.py` pour vider le cache SQLite
- `python db_stats.py` pour statistiques base de données

**Docker :**
- `docker compose up -d` pour lancer
- `docker compose logs -f` pour les logs
- Volume persistant : `./data:/app/data`
- Healthcheck sur `/healthcheck`

**Variables d'environnement (.env) :**
- `SECRET_KEY` : Obligatoire (générer avec `secrets.token_hex(32)`)
- `JAWG_API_KEY` : Pour la carte interactive
- `FORCE_HTTPS` : `true` en production
- `SKIP_PRELOAD` : `true` en dev pour startup rapide

**Déploiement :**
- Build : `docker build -t reeltime:latest .`
- Vérifier le healthcheck après déploiement
- Le preload initial prend ~5-10 minutes (60 jours de données)

---

## ⚠️ Règles Critiques (Ne Pas Manquer)

### Système de Cache (3 niveaux)
- **TOUJOURS** considérer l'invalidation du cache lors de modifications :
  1. `_html_cache` : HTML rendu par user/week/filtres
  2. `_week_cache` : Données hebdomadaires agrégées
  3. `_memory_cache` : Objets Showtime par cinéma/date
- Clés de cache incluent la date courante → invalidées à minuit automatiquement
- Après modification de structure de données : `python clear_db.py` + restart

### API AlloCiné (CRITIQUE)
- **JAMAIS** plus de 5 requêtes/seconde → délai 200ms entre appels (`time.sleep(0.2)`)
- Pas de clé API - endpoints GraphQL publics (peuvent changer sans préavis)
- Les dates de films peuvent être trompeuses (re-sorties vs original)
- IP ban possible si rate limit non respecté

### Anti-Patterns à Éviter
- ❌ JAMAIS de CSS personnalisé - Tailwind uniquement
- ❌ JAMAIS de frameworks JS (React, Vue, jQuery)
- ❌ JAMAIS stocker de secrets dans le code (utiliser .env)
- ❌ JAMAIS commit les fichiers .db ou data/
- ❌ JAMAIS d'appels API AlloCiné sans le délai 200ms

### Refresh Minuit
- À 00:00 : tous les caches sont vidés + preload 60 jours
- Client-side : reload automatique si week_offset=0
- Ne pas interférer avec `AutoRefresh` thread

### Letterboxd
- URLs générées via `generate_letterboxd_url()` - nettoie accents et caractères spéciaux
- Liens vers recherche (pas de page directe) - pas d'API Letterboxd
- Toujours `target="_blank"` pour liens externes

### Performance
- Objectif : < 50ms (hot cache), < 500ms (SQLite), < 3s (cold)
- RAM cible : < 100 MB
- Éviter les requêtes N+1 dans les boucles

---

## Guide d'Utilisation

**Pour les Agents IA :**
- Lire ce fichier AVANT d'implémenter du code
- Suivre TOUTES les règles exactement comme documentées
- En cas de doute, choisir l'option la plus restrictive
- Mettre à jour ce fichier si de nouveaux patterns émergent

**Pour les Humains :**
- Garder ce fichier lean et focalisé sur les besoins des agents
- Mettre à jour lors de changements de stack technologique
- Réviser trimestriellement pour retirer les règles obsolètes
- Supprimer les règles devenues évidentes au fil du temps

---

_Dernière mise à jour : 2026-02-04_
