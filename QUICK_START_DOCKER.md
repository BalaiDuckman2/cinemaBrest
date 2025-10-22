# 🚀 Guide de démarrage rapide - Docker

## Sur votre PC Windows (test local)

1. **Copier votre fichier .env**
   ```powershell
   cp .env.example .env
   # Éditez .env et ajoutez votre clé JAWG_API_KEY
   ```

2. **Tester la construction Docker** (optionnel)
   ```powershell
   .\test-docker.ps1
   ```

3. **Lancer avec Docker Compose**
   ```powershell
   docker-compose up -d
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:5000
   ```

## Sur votre NAS Synology

### Via SSH

1. **Se connecter en SSH**
   ```bash
   ssh admin@IP_DU_NAS
   ```

2. **Créer le dossier**
   ```bash
   mkdir -p /volume1/docker/cinema-brest
   cd /volume1/docker/cinema-brest
   ```

3. **Transférer les fichiers**
   Depuis votre PC Windows :
   ```powershell
   scp -r * admin@IP_DU_NAS:/volume1/docker/cinema-brest/
   ```

4. **Créer le fichier .env**
   ```bash
   cd /volume1/docker/cinema-brest
   nano .env
   ```
   Contenu :
   ```
   JAWG_API_KEY=votre_clé_ici
   HOST=0.0.0.0
   PORT=5000
   TIMEZONE=Europe/Paris
   ```

5. **Lancer**
   ```bash
   docker-compose up -d
   ```

6. **Vérifier les logs**
   ```bash
   docker-compose logs -f
   ```

### Via l'interface Docker Synology DSM

1. **Ouvrir Docker** dans DSM

2. **Aller dans Registry** → Rechercher `python` → Télécharger `python:3.13-slim`

3. **Aller dans Image** → Attendre la fin du téléchargement

4. **Transférer les fichiers** via File Station dans `/docker/cinema-brest/`

5. **Ouvrir Terminal** → Créer un task planifié :
   ```bash
   cd /volume1/docker/cinema-brest
   docker-compose up -d
   ```

## Sur votre NAS QNAP

1. **Container Station** → Applications → Créer

2. **Sélectionner** "Create Application"

3. **Coller le contenu** de `docker-compose.yml`

4. **Modifier** les chemins de volumes selon votre NAS

5. **Valider** et lancer

## Vérification

Une fois lancé, l'application sera accessible sur :
```
http://IP_DU_NAS:5000
```

Pour voir si ça fonctionne :
```bash
curl http://localhost:5000/healthcheck
# Devrait retourner: ok
```

## Commandes utiles

```bash
# Voir les logs en temps réel
docker-compose logs -f

# Redémarrer
docker-compose restart

# Arrêter
docker-compose down

# Mettre à jour
docker-compose pull
docker-compose up -d

# Vider le cache
docker exec cinema-brest python clear_db.py
```

## Problèmes courants

### Port déjà utilisé
Changez le port dans `docker-compose.yml` :
```yaml
ports:
  - "8080:5000"  # Utilisez 8080 au lieu de 5000
```

### Pas d'accès Internet depuis le conteneur
Vérifiez la configuration réseau de Docker sur votre NAS.

### Base de données ne persiste pas
Vérifiez les permissions :
```bash
chmod -R 777 /volume1/docker/cinema-brest/data
```
