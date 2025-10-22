# 🐳 Déploiement avec Portainer

Ce guide vous explique comment déployer CinéBrest sur votre NAS en utilisant Portainer.

## Prérequis

- Portainer installé sur votre NAS
- Une clé API Jawg Maps (gratuite sur https://www.jawg.io/)

## Option 1 : Déploiement depuis Docker Hub (Recommandé)

### Utiliser l'image pré-construite

L'image Docker est disponible publiquement sur Docker Hub : **`balaiduckman2/cinema-brest:latest`**

### Étapes dans Portainer

1. **Ouvrir Portainer** dans votre navigateur
   ```
   http://IP_NAS:9000
   ```

2. **Aller dans "Stacks"** (menu de gauche)

3. **Cliquer sur "+ Add stack"**

4. **Nommer le stack** : `cinema-brest`

5. **Copier-coller le contenu** de `portainer-stack.yml` dans l'éditeur Web :

```yaml
version: '3.8'

services:
  cinema-brest:
    image: balaiduckman2/cinema-brest:latest
    container_name: cinema-brest
    restart: unless-stopped
    ports:
      - "5000:5000"
    volumes:
      - cinema-data:/app/data
    environment:
      - HOST=0.0.0.0
      - PORT=5000
      - TIMEZONE=Europe/Paris
      - JAWG_API_KEY=VOTRE_CLE_API_ICI
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/healthcheck"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  cinema-data:
    driver: local
```

6. **⚠️ IMPORTANT** : Remplacer `VOTRE_CLE_API_ICI` par votre vraie clé API Jawg

7. **Cliquer sur "Deploy the stack"**

8. **Attendre** que le conteneur démarre (30-60 secondes)

9. **Accéder à l'application** : `http://IP_NAS:5000`

---

## Option 2 : Déploiement depuis Container

Si vous préférez utiliser l'interface "Containers" :

1. **Aller dans "Containers"**

2. **Cliquer sur "+ Add container"**

3. **Configuration** :
   - **Name** : `cinema-brest`
   - **Image** : `balaiduckman2/cinema-brest:latest`
   
4. **Port mapping** :
   - Host: `5000` → Container: `5000`

5. **Volumes** :
   - Cliquer sur "+ map additional volume"
   - Container: `/app/data`
   - Volume: Créer un nouveau volume nommé `cinema-data`

6. **Environment variables** :
   ```
   HOST=0.0.0.0
   PORT=5000
   TIMEZONE=Europe/Paris
   JAWG_API_KEY=votre_clé_api_ici
   ```

7. **Restart policy** : `Unless stopped`

8. **Deploy the container**

---

## Vérification

### Logs

Dans Portainer :
1. Aller dans **Containers**
2. Cliquer sur `cinema-brest`
3. Onglet **Logs**

Vous devriez voir :
```
✓ 5 cinémas chargés
✓ 40 films trouvés pour la semaine!
Running on http://0.0.0.0:5000
```

### Test de santé

```bash
curl http://IP_NAS:5000/healthcheck
# Devrait retourner: ok
```

### Accès web

Ouvrir dans le navigateur :
```
http://IP_NAS:5000
```

---

## Mise à jour de l'application

### Avec Portainer

1. **Aller dans Stacks** (si déployé en stack) ou **Containers**
2. **Arrêter le conteneur** cinema-brest
3. **Cliquer sur "Recreate"**
4. **Cocher "Pull latest image"**
5. **Recreate**

### En ligne de commande

```bash
docker pull balaiduckman2/cinema-brest:latest
docker stop cinema-brest
docker rm cinema-brest
# Puis redéployer depuis Portainer
```

---

## Configuration du port

Si le port 5000 est déjà utilisé, changez-le dans le stack :

```yaml
ports:
  - "8080:5000"  # Utilisera le port 8080 au lieu de 5000
```

---

## Personnalisation

### Changer le fuseau horaire

```yaml
environment:
  - TIMEZONE=America/New_York  # New York
  - TIMEZONE=Asia/Tokyo         # Tokyo
  - TIMEZONE=Europe/London      # Londres
```

### Ajouter un reverse proxy

Si vous utilisez Traefik ou Nginx Proxy Manager :

```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.cinema.rule=Host(`cinema.votredomaine.fr`)"
  - "traefik.http.services.cinema.loadbalancer.server.port=5000"
```

---

## Dépannage

### Le conteneur ne démarre pas

1. Vérifier les logs dans Portainer
2. Vérifier que le port 5000 n'est pas déjà utilisé
3. Vérifier que la clé JAWG_API_KEY est bien définie

### Pas d'accès Internet depuis le conteneur

Dans Portainer, vérifier que le réseau du conteneur est bien configuré (bridge par défaut).

### Base de données ne persiste pas

Le volume `cinema-data` doit être créé. Vérifier dans **Volumes** de Portainer.

### Erreur "read-only file system"

Ne pas utiliser `sudo` avec Docker. Ajouter votre utilisateur au groupe docker :
```bash
sudo usermod -aG docker $USER
```

---

## Sécurité

⚠️ **Important** : Cette application n'a pas d'authentification. 

Si vous l'exposez sur Internet :
- Utilisez un reverse proxy (Traefik, Nginx)
- Ajoutez une authentification basique
- Utilisez HTTPS avec Let's Encrypt

---

## Support

- **Documentation complète** : README.md
- **Guide Docker** : DEPLOIEMENT_DOCKER.md
- **GitHub** : https://github.com/BalaiDuckman2/cinemaBrest
- **Docker Hub** : https://hub.docker.com/r/balaiduckman2/cinema-brest

---

## Désinstallation

1. Dans Portainer, aller dans **Stacks**
2. Sélectionner `cinema-brest`
3. Cliquer sur **Delete**
4. Optionnel : Supprimer le volume `cinema-data` dans **Volumes**
