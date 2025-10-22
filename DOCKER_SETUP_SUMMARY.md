# 📦 Fichiers créés pour le déploiement Docker

## Fichiers Docker

✅ **Dockerfile** - Image Docker de l'application
✅ **docker-compose.yml** - Configuration Docker Compose
✅ **.dockerignore** - Fichiers à ignorer lors de la construction

## Scripts

✅ **deploy-to-nas.ps1** - Script PowerShell pour déployer automatiquement sur NAS
✅ **test-docker.ps1** - Script pour tester la construction Docker localement

## Documentation

✅ **README.md** - Documentation principale complète
✅ **DEPLOIEMENT_DOCKER.md** - Guide détaillé Docker
✅ **QUICK_START_DOCKER.md** - Guide de démarrage rapide

## Configuration

✅ **.gitignore** - Mis à jour pour ignorer les fichiers Docker
✅ **requirements.txt** - Nettoyé (retiré psycopg2)
✅ **modules/database.py** - Modifié pour utiliser le dossier data/
✅ **data/.gitkeep** - Pour suivre le dossier data/ dans Git

## Modifications du code

✅ **modules/api.py** - Fix du bug AttributeError sur releaseDate
✅ **modules/database.py** - Support du dossier data/ pour Docker

## Prochaines étapes

### 1. Tester localement (optionnel)

```powershell
# Construire et tester l'image
.\test-docker.ps1

# Lancer localement
docker-compose up -d

# Vérifier
Start-Process "http://localhost:5000"

# Voir les logs
docker-compose logs -f

# Arrêter
docker-compose down
```

### 2. Déployer sur votre NAS

**Méthode automatique (recommandée) :**
```powershell
.\deploy-to-nas.ps1 -NasIP "192.168.1.XXX" -NasUser "admin"
```

**Méthode manuelle :**
1. Transférer tous les fichiers sur le NAS (via SFTP/SCP)
2. Se connecter en SSH au NAS
3. Naviguer vers le dossier
4. Lancer `docker-compose up -d`

### 3. Vérifier le déploiement

```bash
# SSH vers le NAS
ssh admin@IP_DU_NAS

# Aller dans le dossier
cd /volume1/docker/cinema-brest

# Voir les logs
docker-compose logs -f

# Vérifier que ça tourne
curl http://localhost:5000/healthcheck
```

L'application devrait être accessible sur : **http://IP_DU_NAS:5000**

## Support

- Pour le déploiement Docker : voir **DEPLOIEMENT_DOCKER.md**
- Pour le démarrage rapide : voir **QUICK_START_DOCKER.md**
- Pour les problèmes : voir la section "Dépannage" dans **README.md**

## Notes importantes

⚠️ **N'oubliez pas** de créer votre fichier `.env` avec votre `JAWG_API_KEY` !

```bash
cp .env.example .env
# Éditez .env et ajoutez votre clé API
```

🔐 **Sécurité** : Cette application n'a pas d'authentification. Si vous l'exposez sur Internet, protégez-la avec un reverse proxy (Nginx, Traefik) et une authentification basique.

📊 **Ressources** : L'application utilise très peu de ressources :
- RAM : < 100 Mo
- CPU : Minimal (sauf lors du refresh API toutes les 6h)
- Disque : < 10 Mo (base de données)
