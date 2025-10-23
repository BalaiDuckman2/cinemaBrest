# 🎬 CinéBrest - Guide Docker

## 🚀 Démarrage Rapide

### Prérequis
- Docker
- Docker Compose

### Installation en 3 étapes

1. **Cloner le projet**
```bash
git clone https://github.com/BalaiDuckman2/cinemaBrest.git
cd cinemaBrest
```

2. **Configurer les variables (optionnel)**
```bash
cp .env.example .env
# Éditez .env pour ajouter votre clé API Jawg si nécessaire
```

3. **Lancer l'application**
```bash
docker-compose up -d
```

L'application sera accessible sur **http://localhost:5000** 🎉

## 📦 Commandes Docker

### Démarrer
```bash
docker-compose up -d
```

### Arrêter
```bash
docker-compose down
```

### Voir les logs
```bash
docker-compose logs -f
```

### Redémarrer
```bash
docker-compose restart
```

### Rebuild (après modification du code)
```bash
docker-compose up -d --build
```

## 🔧 Configuration

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `HOST` | `0.0.0.0` | Adresse d'écoute |
| `PORT` | `5000` | Port d'écoute |
| `TIMEZONE` | `Europe/Paris` | Fuseau horaire |
| `JAWG_API_KEY` | - | Clé API pour les cartes (optionnel) |

### Personnaliser le port

Modifier dans `docker-compose.yml` :
```yaml
ports:
  - "8080:5000"  # Accessible sur le port 8080
```

## 💾 Données

La base de données SQLite est persistée dans le dossier `./data`.

Pour sauvegarder :
```bash
# Copier la base de données
cp data/cinema.db data/cinema.db.backup
```

Pour réinitialiser :
```bash
# Supprimer les données (l'app recréera la BDD)
rm -rf data/*.db
docker-compose restart
```

## 🏥 Healthcheck

L'application dispose d'un healthcheck automatique :
```bash
curl http://localhost:5000/healthcheck
```

Réponse attendue : `ok`

## 🐳 Build manuel

### Build l'image
```bash
docker build -t cinebrest:latest .
```

### Run le container
```bash
docker run -d \
  --name cinema-brest \
  -p 5000:5000 \
  -v $(pwd)/data:/app/data \
  cinebrest:latest
```

## 📊 Monitoring

### Logs en temps réel
```bash
docker-compose logs -f cinema-brest
```

### Statistiques du container
```bash
docker stats cinema-brest
```

### Inspecter le container
```bash
docker exec -it cinema-brest bash
```

## 🔒 Production

### Recommandations

1. **Reverse Proxy** : Utilisez Nginx ou Traefik
2. **HTTPS** : Obligatoire pour la PWA
3. **Limites** : Configurez les limites CPU/RAM
4. **Backups** : Automatisez les sauvegardes de `data/`

### Exemple avec Traefik

```yaml
services:
  cinema-brest:
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.cinema.rule=Host(`cinema.votredomaine.fr`)"
      - "traefik.http.routers.cinema.entrypoints=websecure"
      - "traefik.http.routers.cinema.tls.certresolver=letsencrypt"
```

## 🛠️ Développement

### Mode développement avec hot-reload
```bash
# Modifier docker-compose.yml pour ajouter :
volumes:
  - ./:/app
  - ./data:/app/data
environment:
  - FLASK_DEBUG=1
```

## ❓ Dépannage

### Le container ne démarre pas
```bash
# Vérifier les logs
docker-compose logs cinema-brest

# Reconstruire
docker-compose up -d --build --force-recreate
```

### Erreur de port déjà utilisé
```bash
# Changer le port dans docker-compose.yml
ports:
  - "5001:5000"
```

### Base de données corrompue
```bash
# Supprimer et recréer
docker-compose down
rm -rf data/*.db
docker-compose up -d
```

## 📝 Mise à jour

```bash
# Récupérer les dernières modifications
git pull

# Rebuild et restart
docker-compose up -d --build
```

## 🌐 Accès distant

Pour accéder depuis d'autres machines du réseau :
1. Assurez-vous que le port 5000 est ouvert dans votre pare-feu
2. Accédez via `http://IP_DU_SERVEUR:5000`

## 📦 Export/Import

### Exporter l'image
```bash
docker save cinebrest:latest | gzip > cinebrest.tar.gz
```

### Importer l'image
```bash
gunzip -c cinebrest.tar.gz | docker load
```

---

**Fait avec 💜 pour la communauté brestoise**

Pour plus d'informations, consultez le [README principal](README.md)
