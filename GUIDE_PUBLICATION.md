# 🚀 Guide rapide - Publication et déploiement

## Étape 1 : Publier sur Docker Hub (une seule fois)

Sur votre PC Windows :

```powershell
# Exécuter le script de publication
.\publish-docker.ps1
```

Le script va :
1. ✅ Vérifier Docker
2. ✅ Se connecter à Docker Hub (si besoin)
3. ✅ Construire l'image
4. ✅ Tester localement
5. ✅ Publier sur Docker Hub

L'image sera disponible sur : **`balaiduckman2/cinema-brest:latest`**

---

## Étape 2 : Déployer sur votre NAS avec Portainer

### Dans l'interface Portainer

1. **Ouvrir Portainer** : `http://IP_NAS:9000`

2. **Créer un nouveau Stack**
   - Menu : **Stacks** → **+ Add stack**
   - Nom : `cinema-brest`

3. **Copier-coller ce contenu** :

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

4. **⚠️ IMPORTANT** : Remplacer `VOTRE_CLE_API_ICI` par votre clé API Jawg
   - Obtenir une clé gratuite : https://www.jawg.io/

5. **Deploy the stack**

6. **Attendre 30-60 secondes** que l'application démarre

7. **Accéder à l'application** : `http://IP_NAS:5000`

---

## Vérification

### Dans Portainer

1. **Containers** → `cinema-brest`
2. **Logs** → Vous devriez voir :
   ```
   ✓ 5 cinémas chargés
   ✓ 40 films trouvés pour la semaine!
   Running on http://0.0.0.0:5000
   ```

### Dans le navigateur

```
http://IP_NAS:5000
```

Vous devriez voir la liste des films de la semaine !

---

## Mise à jour future

Quand vous publiez une nouvelle version :

1. **Sur votre PC** :
   ```powershell
   .\publish-docker.ps1
   ```

2. **Dans Portainer** :
   - Containers → cinema-brest
   - Stop
   - Recreate (cocher "Pull latest image")

---

## Changement de port

Si le port 5000 est déjà utilisé, modifiez dans le stack :

```yaml
ports:
  - "8080:5000"  # Utilisera le port 8080
```

---

## Support

- **Guide Portainer détaillé** : [PORTAINER_DEPLOYMENT.md](PORTAINER_DEPLOYMENT.md)
- **Guide Docker complet** : [DEPLOIEMENT_DOCKER.md](DEPLOIEMENT_DOCKER.md)
- **Documentation** : [README.md](README.md)

---

## Récapitulatif des fichiers

✅ **publish-docker.ps1** - Script de publication sur Docker Hub
✅ **portainer-stack.yml** - Configuration Portainer
✅ **PORTAINER_DEPLOYMENT.md** - Guide détaillé Portainer
✅ **PUBLICATION_DOCKER_HUB.md** - Instructions Docker Hub

---

## Commandes Docker Hub

```bash
# Voir les images publiées
docker search balaiduckman2/cinema-brest

# Télécharger l'image
docker pull balaiduckman2/cinema-brest:latest

# Lancer manuellement
docker run -d -p 5000:5000 \
  -e JAWG_API_KEY=votre_clé \
  balaiduckman2/cinema-brest:latest
```

---

## 🎉 C'est tout !

Votre application est maintenant :
- ✅ Publiée sur Docker Hub
- ✅ Déployable en 2 clics avec Portainer
- ✅ Accessible depuis n'importe quel navigateur
- ✅ Automatiquement mise à jour toutes les 6 heures
