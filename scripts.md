# 🛠️ Scripts Utiles - CinéBrest

## 🚀 Développement

### Démarrer l'application
```bash
python app.py
```

### Voir les statistiques de la BDD
```bash
python db_stats.py
```

### Vider la base de données
```bash
python clear_db.py
```

## 🐳 Docker

### Build l'image
```bash
docker build -t cinebrest:latest .
```

### Lancer avec Docker Compose
```bash
docker-compose up -d
```

### Voir les logs
```bash
docker-compose logs -f
```

### Arrêter les conteneurs
```bash
docker-compose down
```

## 🧹 Nettoyage

### Supprimer les caches Python
```bash
# Windows PowerShell
Remove-Item -Path "__pycache__", "modules\__pycache__" -Recurse -Force -ErrorAction SilentlyContinue

# Linux/Mac
rm -rf __pycache__ modules/__pycache__
```

### Supprimer la base de données
```bash
# Windows PowerShell
Remove-Item -Path "cinema.db", "data\" -Recurse -Force

# Linux/Mac
rm -rf cinema.db data/
```

## 📊 Monitoring

L'application expose des métriques sur `/metrics` (format Prometheus)

### Métriques disponibles
- `flask_http_requests_total` - Nombre total de requêtes HTTP
- `flask_http_request_duration_seconds` - Durée des requêtes
- `allocine_api_calls_total` - Nombre d'appels à l'API AlloCiné
- `database_cache_hits_total` - Nombre de hits du cache BDD
- `database_cache_misses_total` - Nombre de miss du cache BDD

## 🔧 Variables d'environnement (.env)

```env
# Timezone (Europe/Paris par défaut)
TIMEZONE=Europe/Paris

# Clé API Jawg Maps (pour la carte)
JAWG_API_KEY=votre_cle_api_ici

# Skip le préchargement au démarrage (utile pour dev)
SKIP_PRELOAD=true

# Port Flask (5000 par défaut)
PORT=5000
```

## 📝 Notes

- La base de données se régénère automatiquement si elle est vide
- Le TTL du cache est de 6 heures
- L'auto-refresh se fait quotidiennement à 5h du matin
- Les données sont mises en cache sur 3 niveaux : mémoire, SQLite, API
