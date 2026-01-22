# 🚀 Guide de Déploiement en Production - ReelTime

## 📋 Prérequis

- Docker & Docker Compose
- Accès SSH au serveur
- Nom de domaine (optionnel mais recommandé pour HTTPS)

---

## ⚙️ Configuration Initiale

### 1. Cloner le Projet

```bash
git clone https://github.com/BalaiDuckman2/cinemaBrest.git
cd cinemaBrest
```

### 2. Configurer les Variables d'Environnement

```bash
cp .env.example .env
nano .env
```

**Configuration PRODUCTION** :

```bash
# API
JAWG_API_KEY="votre_clé_jawg_io"

# Serveur
HOST="0.0.0.0"
PORT=5000
TIMEZONE="Europe/Paris"

# Sécurité (IMPORTANT!)
SECRET_KEY="<générer_avec_python_-c_import_secrets_print_secrets_token_hex_32>"
FORCE_HTTPS=true      # ← ACTIVER EN PRODUCTION pour headers de sécurité
DEBUG=false            # ← TOUJOURS false en production

# Monitoring (Optionnel)
monitoring_enabled=false
```

**⚠️ IMPORTANT** : Générer une SECRET_KEY unique :

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

---

## 🐳 Déploiement Docker

### Option 1 : Docker Compose (Recommandé)

```bash
# Build et démarrage
docker-compose up -d --build

# Vérifier les logs
docker-compose logs -f app

# Arrêter
docker-compose down
```

### Option 2 : Docker Build & Run Manuel

```bash
# Build
docker build -t reeltime:latest .

# Run
docker run -d \
  --name cinebrest \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  -v $(pwd)/data:/app/data \
  reeltime:latest

# Logs
docker logs -f cinebrest
```

---

## 🔒 Sécurité en Production

### 1. Variables d'Environnement

✅ **OBLIGATOIRE** :
- `SECRET_KEY` : Clé unique de 64 caractères
- `FORCE_HTTPS=true` : Active Flask-Talisman
- `DEBUG=false` : Désactive le mode debug

### 2. Headers de Sécurité Activés

Quand `FORCE_HTTPS=true`, Flask-Talisman ajoute automatiquement :

- **HTTPS forcé** : Redirection HTTP → HTTPS
- **HSTS** : Strict-Transport-Security (1 an)
- **CSP** : Content-Security-Policy strict
- **X-Frame-Options** : DENY (protection clickjacking)
- **X-Content-Type-Options** : nosniff

### 3. Rate Limiting

Limites automatiques appliquées :

| Route | Limite | Protection contre |
|-------|--------|-------------------|
| `/register` | 5/heure | Spam de comptes |
| `/login` | 10/minute | Brute-force |
| `/add-to-calendar` | 30/minute | Ajouts massifs |
| **Global** | 200/jour, 50/heure | Abus général |

### 4. Compression

Flask-Compress activé automatiquement :
- Réduit la taille des réponses de 70-80%
- Gzip sur HTML, CSS, JS, JSON

---

## 🌐 Configuration HTTPS (Nginx Reverse Proxy)

### 1. Installer Nginx + Certbot

```bash
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx
```

### 2. Configuration Nginx

Créer `/etc/nginx/sites-available/cinebrest` :

```nginx
server {
    listen 80;
    server_name cinema.votredomaine.fr;

    # Redirection HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cinema.votredomaine.fr;

    # Certificats SSL (Certbot)
    ssl_certificate /etc/letsencrypt/live/cinema.votredomaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cinema.votredomaine.fr/privkey.pem;

    # Sécurité SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Headers de sécurité (en plus de Flask-Talisman)
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy vers Flask
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support (si besoin futur)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Cache statique
    location /static/ {
        proxy_pass http://localhost:5000/static/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # Logs
    access_log /var/log/nginx/cinebrest_access.log;
    error_log /var/log/nginx/cinebrest_error.log;
}
```

### 3. Activer et Obtenir le Certificat SSL

```bash
# Activer le site
sudo ln -s /etc/nginx/sites-available/cinebrest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obtenir certificat SSL (Let's Encrypt)
sudo certbot --nginx -d cinema.votredomaine.fr

# Auto-renewal (déjà configuré par Certbot)
sudo certbot renew --dry-run
```

---

## 📊 Monitoring et Logs

### Logs Docker

```bash
# Logs en temps réel
docker-compose logs -f app

# Dernières 100 lignes
docker-compose logs --tail=100 app

# Logs d'une période
docker-compose logs --since 2024-01-01 app
```

### Métriques Prometheus (si activé)

Endpoint disponible sur `/metrics` :

```bash
curl http://localhost:5000/metrics
```

### Health Check

```bash
# Vérifier que l'app répond
curl -I http://localhost:5000/

# Devrait retourner HTTP 200
```

---

## 🔄 Mise à Jour de l'Application

```bash
# 1. Récupérer les dernières modifications
git pull origin main

# 2. Rebuild Docker
docker-compose down
docker-compose up -d --build

# 3. Vérifier les logs
docker-compose logs -f app
```

---

## 💾 Sauvegarde de la Base de Données

### Backup Manuel

```bash
# Créer un backup
docker exec cinebrest sqlite3 /app/data/cinema.db ".backup '/app/data/cinema_backup_$(date +%Y%m%d).db'"

# Copier en local
docker cp reeltime:/app/data/cinema_backup_YYYYMMDD.db ./backups/
```

### Backup Automatique (Cron)

Créer `/etc/cron.daily/cinebrest-backup` :

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/cinebrest"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup BDD
docker exec cinebrest sqlite3 /app/data/cinema.db ".backup '/app/data/backup_temp.db'"
docker cp reeltime:/app/data/backup_temp.db $BACKUP_DIR/cinema_$DATE.db

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "cinema_*.db" -mtime +30 -delete

# Log
echo "✅ Backup créé: cinema_$DATE.db" >> /var/log/cinebrest_backup.log
```

Rendre exécutable :

```bash
sudo chmod +x /etc/cron.daily/cinebrest-backup
```

---

## 🚨 Troubleshooting

### L'application ne démarre pas

```bash
# Vérifier les logs
docker-compose logs app

# Vérifier les variables d'env
docker exec cinebrest env | grep -E "(SECRET_KEY|FORCE_HTTPS|DEBUG)"

# Redémarrer
docker-compose restart app
```

### Erreur 502 Bad Gateway (Nginx)

```bash
# Vérifier que Flask tourne
docker ps | grep cinebrest

# Vérifier les logs Nginx
sudo tail -f /var/log/nginx/cinebrest_error.log

# Vérifier le port
ss -tulpn | grep :5000
```

### Rate Limit trop strict

Modifier les limites dans `app.py` :

```python
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["500 per day", "100 per hour"],  # Augmenter ici
    storage_uri="memory://",
)
```

### Certificat SSL expiré

```bash
# Forcer le renouvellement
sudo certbot renew --force-renewal

# Redémarrer Nginx
sudo systemctl restart nginx
```

---

## 📈 Performances

### Optimisations Activées

✅ **Compression Gzip** : -70% taille réponses  
✅ **Cache 3 niveaux** : Mémoire → SQLite (6h TTL) → API AlloCiné  
✅ **Service Worker** : Offline-first PWA  
✅ **Tailwind CSS CDN** : Pas de build CSS nécessaire  
✅ **SQLite optimisé** : Index sur requêtes fréquentes  

### Métriques Attendues

- **Temps de réponse** : < 100ms (page principale, cache warm)
- **Taille page** : ~50 KB (compressée)
- **PWA Score** : 90+ (Lighthouse)
- **Sécurité** : A+ (securityheaders.com)

---

## 🎯 Checklist de Déploiement

Avant de mettre en production :

- [ ] `SECRET_KEY` unique généré
- [ ] `FORCE_HTTPS=true` dans `.env`
- [ ] `DEBUG=false` dans `.env`
- [ ] Certificat SSL configuré (Nginx + Certbot)
- [ ] Backup automatique configuré (cron)
- [ ] Logs accessibles (docker logs)
- [ ] Monitoring activé (optionnel)
- [ ] Domaine DNS configuré
- [ ] Firewall configuré (ports 80, 443)
- [ ] Docker en auto-restart (`--restart unless-stopped`)

---

## 📞 Support

En cas de problème :

1. Consulter les logs : `docker-compose logs -f app`
2. Vérifier `.env` : Toutes les variables sont correctes ?
3. Tester en local : `docker-compose up` (sans `-d`)
4. Consulter la documentation : `README.md`, `FEATURES.md`

---

**🎉 Votre application est maintenant en production avec :**
- ✅ HTTPS forcé
- ✅ Headers de sécurité
- ✅ Rate limiting
- ✅ Compression Gzip
- ✅ Cache optimisé
- ✅ PWA offline-first
