# Guide de publication sur Docker Hub pour Portainer

## Étape 1 : Créer un compte Docker Hub (si pas déjà fait)

Allez sur https://hub.docker.com/ et créez un compte gratuit.

## Étape 2 : Construire et publier l'image

Sur votre PC Windows, dans le dossier du projet :

```powershell
# Se connecter à Docker Hub
docker login

# Construire l'image avec votre nom d'utilisateur Docker Hub
docker build -t balaiduckman2/cinema-brest:latest .

# Optionnel : tester localement
docker run -d -p 5000:5000 --env-file .env balaiduckman2/cinema-brest:latest

# Publier sur Docker Hub
docker push balaiduckman2/cinema-brest:latest
```

## Étape 3 : Utiliser dans Portainer

Une fois l'image publiée, vous pourrez la déployer depuis Portainer en utilisant :

**Image** : `balaiduckman2/cinema-brest:latest`

Voir le fichier `portainer-stack.yml` pour la configuration complète.
