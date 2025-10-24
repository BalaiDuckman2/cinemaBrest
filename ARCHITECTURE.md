# 🏗️ Architecture du Code - CinéBrest

## 📋 Vue d'ensemble

CinéBrest est une application web Flask qui agrège les horaires de cinéma depuis l'API AlloCiné et les affiche dans une interface moderne avec cache multi-niveaux.

## 🔧 Technologies

- **Backend** : Flask 3.0 (Python 3.13)
- **Base de données** : SQLite 3
- **Frontend** : Tailwind CSS 3 (CDN), JavaScript Vanilla
- **PWA** : Service Worker, Manifest.json
- **Deployment** : Docker (Alpine Linux)
- **Monitoring** : Prometheus metrics

## 📂 Structure du Code

### `app.py` - Application Principale

**Responsabilités** :
- Initialisation Flask
- Routes HTTP (`/`, `/metrics`, `/change_week`)
- Gestion du cache mémoire (semaines complètes)
- Formatage des données pour les templates
- Auto-refresh quotidien (5h du matin)

**Fonctions clés** :
- `getShowtimesWeek(week_offset)` : Récupère les séances d'une semaine
- `translate_month()`, `translate_day()` : Traduction des dates
- `get_film_age()` : Calcule l'âge d'un film

**Cache** :
- Niveau 1 : `_week_cache` (dictionnaire Python, ultra-rapide)
- Niveau 2 : SQLite (via `modules/database.py`)
- Niveau 3 : API AlloCiné (via `modules/api.py`)

### `modules/api.py` - API AlloCiné

**Responsabilités** :
- Appels à l'API AlloCiné (GraphQL)
- Rate limiting (200ms entre chaque appel)
- Parsing des réponses JSON
- Sauvegarde dans SQLite

**Classes** :
- `Theater` : Représente un cinéma
  - `getMoviesOfTheDay(date)` : Récupère les films d'une journée
  - Gère le cache mémoire et SQLite
  - Transforme les données API en format exploitable

**Optimisations** :
- Cache mémoire : Dict par date et cinéma
- Cache SQLite : TTL de 6 heures
- Rate limiting : Évite le ban IP

### `modules/database.py` - Gestion SQLite

**Responsabilités** :
- Connexion à la base de données
- CRUD des séances
- Statistiques
- Nettoyage automatique des anciennes données

**Tables** :
```sql
CREATE TABLE showtimes (
    id INTEGER PRIMARY KEY,
    cinema TEXT NOT NULL,
    film_title TEXT NOT NULL,
    film_url TEXT,
    film_affiche TEXT,
    release_date TEXT,
    showtime_date TEXT NOT NULL,
    showtime_time TEXT NOT NULL,
    showtime_version TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fonctions** :
- `get_showtimes(cinema, date)` : Récupère depuis SQLite
- `save_showtimes(cinema, date, showtimes)` : Sauvegarde en SQLite
- `is_cache_valid(cinema, date, ttl_hours=6)` : Vérifie le TTL
- `cleanup_old_showtimes(days=7)` : Supprime les vieilles données
- `get_stats()` : Statistiques de la BDD

### `modules/auto_refresh.py` - Rafraîchissement Automatique

**Responsabilités** :
- Rafraîchissement quotidien à 5h du matin
- Thread en arrière-plan
- Logging des opérations

**Mécanisme** :
```python
AutoRefresh.start(
    refresh_func=lambda: getShowtimesWeek(0),
    hour=5,  # 5h du matin
    minute=0
)
```

### `modules/monitoring.py` - Métriques Prometheus

**Responsabilités** :
- Expose `/metrics` pour Prometheus
- Compteurs d'appels API, cache hits/misses
- Histogrammes de durée de requêtes

**Métriques** :
- `flask_http_requests_total`
- `flask_http_request_duration_seconds`
- `allocine_api_calls_total`
- `database_cache_hits_total`
- `database_cache_misses_total`

### `modules/curl.py` - Utilitaire HTTP

Simple wrapper pour `requests.get()` avec gestion d'erreurs.

## 🎨 Frontend

### `templates/base.html` - Template de Base

**Contenu** :
- `<head>` avec meta tags PWA
- Service Worker registration
- Header avec logo et titre
- Footer avec liens GitHub
- Bouton "Installer l'application"

### `templates/index.html` - Page Principale

**Structure** :
1. **Navigation semaines** : Boutons Précédent/Suivant + "Aujourd'hui"
2. **Filtres** : 
   - Tri (alphabétique, date de sortie, âge)
   - Version (VF/VO/VOST)
   - Âge du film (+1, +5, +10, +20, +30, +50 ans)
   - Recherche en temps réel
3. **Sélection cinémas** : Checkboxes pour filtrer par cinéma
4. **Tableau des séances** : Colonnes par date, lignes par cinéma
5. **Vue compacte/étendue** : Toggle pour réduire l'affichage

**JavaScript** :
- `filterByVersion()` : Filtre VF/VO/VOST
- `filterByCinema()` : Filtre par cinéma sélectionné
- `filterByAge()` : Filtre par âge du film
- `sortFilms()` : Tri alphabétique/date/âge
- `searchFilms()` : Recherche en temps réel
- `changeWeek(offset)` : Navigation entre semaines
- `toggleViewMode()` : Vue compacte/étendue

**localStorage** :
- `sortBy` : Tri sélectionné
- `minAge` : Filtre d'âge
- `selectedCinemas` : Cinémas sélectionnés
- `versionFilter` : Filtre de version (VF/VO/VOST)
- `compactView` : Mode d'affichage

### `static/sw.js` - Service Worker

**Stratégie** : Network First, Cache Fallback

1. **Install** : Met en cache `/`, `/static/images/favicon.png`, `/static/images/nocontent.png`
2. **Fetch** : 
   - Essaie le réseau en premier
   - Si échec, retourne depuis le cache
   - Mise à jour dynamique du cache

**Cache** : `cinebrest-v1`

### `static/manifest.json` - PWA Manifest

**Configuration** :
- Nom : "CinéBrest - Horaires Cinéma"
- Icônes : 192x192, 512x512
- Display : standalone
- Orientation : portrait-primary
- Thème : #6366f1 (indigo)

## 🔄 Flux de Données

```
1. Utilisateur visite /?week=0&age=0
   ↓
2. app.py reçoit la requête
   ↓
3. getShowtimesWeek(week_offset=0)
   ├─ Vérifie cache mémoire (_week_cache)
   │  ├─ HIT → Retourne immédiatement
   │  └─ MISS → Continue
   ├─ Pour chaque cinéma (5 cinémas)
   │  └─ Pour chaque date (7 jours)
   │     ├─ theater.getMoviesOfTheDay(date)
   │     │  ├─ Vérifie cache mémoire
   │     │  ├─ Vérifie SQLite (TTL 6h)
   │     │  └─ Appelle API AlloCiné si nécessaire
   │     └─ Retourne les séances
   ├─ Fusionne les données par film
   ├─ Calcule l'âge de chaque film
   └─ Sauvegarde dans _week_cache
   ↓
4. render_template('index.html', films=...)
   ↓
5. JavaScript client applique les filtres localStorage
   ↓
6. Utilisateur voit les séances filtrées
```

## 🐛 Debugging

### Voir les requêtes API en temps réel
Les logs affichent :
- `⚡ Cache mémoire` : Hit du cache Python
- `✓ BDD hit` : Hit du cache SQLite
- `⟳ API call` : Appel à AlloCiné
- `💾 Sauvegardé` : Données enregistrées dans SQLite

### Vider tous les caches
```bash
python clear_db.py  # Vide SQLite
# Puis redémarrer app.py pour vider le cache mémoire
```

### Désactiver le préchargement
```env
# .env
SKIP_PRELOAD=true
```

### Voir les statistiques BDD
```bash
python db_stats.py
```

## 🚀 Performance

**Objectifs** :
- Première visite : < 3s (appels API)
- Visites suivantes : < 500ms (cache SQLite)
- Cache chaud : < 50ms (cache mémoire)

**Optimisations** :
1. Cache 3 niveaux (mémoire → SQLite → API)
2. TTL de 6h sur SQLite (compromis fraîcheur/performance)
3. Rate limiting pour éviter le ban
4. Préchargement en background (optionnel)
5. Index SQLite sur (cinema, showtime_date)

## 📊 Monitoring Production

Pour un déploiement production avec Grafana/Prometheus :

1. Exposer `/metrics` publiquement ou via VPN
2. Configurer Prometheus pour scraper l'endpoint
3. Importer le dashboard Grafana (si disponible)
4. Monitorer :
   - Taux de cache hit/miss
   - Nombre d'appels API AlloCiné
   - Durée des requêtes HTTP
   - Erreurs 500

## 🔐 Sécurité

**Bonnes pratiques** :
- ✅ Variables d'environnement dans `.env` (non versionné)
- ✅ Rate limiting sur l'API AlloCiné
- ✅ Pas de credentials hardcodés
- ✅ Service Worker avec stratégie sécurisée
- ⚠️ **TODO** : Ajouter HTTPS en production
- ⚠️ **TODO** : Rate limiting sur Flask routes

## 📝 Conventions de Code

**Python** :
- PEP 8 (4 espaces d'indentation)
- Type hints encouragés
- Docstrings pour les fonctions publiques

**JavaScript** :
- camelCase pour les variables
- Commentaires pour les sections complexes
- Vanilla JS (pas de framework)

**CSS** :
- Tailwind CSS uniquement (pas de custom CSS)
- Classes utilitaires responsives (`sm:`, `md:`, `lg:`)

## 🤝 Contribuer

Pour ajouter une nouvelle fonctionnalité :

1. Créer une branche : `git checkout -b feature/ma-feature`
2. Coder + tester localement
3. Vérifier la syntaxe : `python -m py_compile *.py`
4. Commit : `git commit -m "feat: ma super feature"`
5. Push + Pull Request

**Bon à savoir** :
- Les données AlloCiné sont publiques (pas de clé API requise)
- La structure de l'API peut changer sans préavis
- Tester avec `SKIP_PRELOAD=true` pour accélérer le développement
