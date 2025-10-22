# 🐳 Déploiement Docker sur NAS

Ce guide explique comment déployer l'application CinéBrest sur votre NAS avec Docker.

## Prérequis

- Docker et Docker Compose installés sur votre NAS
- Une clé API Jawg Maps (gratuite sur https://www.jawg.io/)

## 🚀 Installation rapide

### 1. Préparer les fichiers

Copiez tous les fichiers du projet sur votre NAS dans un dossier, par exemple :
```
/volume1/docker/cinema-brest/
```

### 2. Créer le fichier .env

Créez un fichier `.env` à la racine du projet avec votre clé API :

```bash
JAWG_API_KEY=votre_clé_api_ici
HOST=0.0.0.0
PORT=5000
TIMEZONE=Europe/Paris
```

### 3. Créer le dossier de données

```bash
mkdir -p data
```

### 4. Lancer l'application

**Avec Docker Compose (recommandé) :**
```bash
docker-compose up -d
```

**Sans Docker Compose :**
```bash
# Construire l'image
docker build -t cinema-brest .

# Lancer le conteneur
docker run -d \
  --name cinema-brest \
  --restart unless-stopped \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  -e JAWG_API_KEY=votre_clé_api \
  cinema-brest
```

### 5. Accéder à l'application

Ouvrez votre navigateur : `http://IP_DE_VOTRE_NAS:5000`

## 📊 Gestion

### Voir les logs
```bash
docker-compose logs -f
```

### Redémarrer
```bash
docker-compose restart
```

### Arrêter
```bash
docker-compose down
```

### Mettre à jour
```bash
# Arrêter et reconstruire
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Vider le cache de la base de données
```bash
# Depuis votre NAS
docker exec -it cinema-brest python clear_db.py

# Ou simplement supprimer le fichier
rm data/cinema.db
docker-compose restart
```

## 🔧 Configuration avancée

### Changer le port

Modifiez dans `docker-compose.yml` :
```yaml
ports:
  - "8080:5000"  # Port 8080 au lieu de 5000
```

### Proxy inverse (Nginx, Traefik, etc.)

Si vous utilisez un reverse proxy sur votre NAS :

```yaml
services:
  cinema-brest:
    # ... configuration existante ...
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.cinema.rule=Host(`cinema.votre-domaine.fr`)"
      - "traefik.http.services.cinema.loadbalancer.server.port=5000"
```

### Ressources limitées

Pour limiter l'utilisation CPU/RAM :
```yaml
services:
  cinema-brest:
    # ... configuration existante ...
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

## 🛠️ Dépannage

### L'application ne démarre pas
```bash
# Voir les logs d'erreur
docker-compose logs

# Vérifier que le port n'est pas déjà utilisé
netstat -tuln | grep 5000
```

### La base de données ne persiste pas
Vérifiez que le dossier `data/` existe et que Docker a les permissions d'écriture :
```bash
ls -la data/
chmod -R 777 data/
```

### Erreur de connexion API AlloCiné
L'application a besoin d'un accès Internet pour récupérer les séances. Vérifiez :
```bash
docker exec -it cinema-brest ping -c 3 allocine.fr
```

## 📦 Structure des volumes

```
cinema-brest/
├── data/              # Volume persistant Docker
│   └── cinema.db     # Base de données SQLite (créé automatiquement)
├── app.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── .env              # À créer (contient JAWG_API_KEY)
└── ...
```

## 🔄 Mise à jour automatique

Pour automatiser les mises à jour, créez un script cron sur votre NAS :

```bash
#!/bin/bash
cd /volume1/docker/cinema-brest
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

Planifiez-le pour s'exécuter chaque semaine par exemple.

## 🌐 Accès depuis l'extérieur

Si vous voulez accéder à l'application depuis l'extérieur de votre réseau :

1. **Avec un nom de domaine** : Utilisez un reverse proxy (recommandé)
2. **Sans nom de domaine** : Configurez une redirection de port sur votre routeur
   - Port externe : 8080 (ou autre)
   - Port interne : 5000
   - IP : Celle de votre NAS

⚠️ **Sécurité** : Cette application n'a pas d'authentification. Si vous l'exposez sur Internet, protégez-la avec un reverse proxy et une authentification basique.

## 📝 Notes

- La base de données se rafraîchit automatiquement toutes les 6 heures
- Les anciennes séances (> 1 jour) sont nettoyées au démarrage
- Le cache mémoire permet un accès quasi-instantané après le premier chargement
- L'application utilise très peu de ressources (< 100 Mo RAM)
