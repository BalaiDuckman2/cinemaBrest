# Image Python légère
FROM python:3.13-slim

# Installer curl pour le healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances
RUN pip install --no-cache-dir -r requirements.txt

# Copier tout le code de l'application
COPY . .

# Créer le répertoire pour la base de données
RUN mkdir -p /app/data

# Exposer le port Flask
EXPOSE 5000

# Variables d'environnement par défaut (peuvent être surchargées)
ENV HOST=0.0.0.0
ENV PORT=5000
ENV TIMEZONE=Europe/Paris

# Lancer l'application
CMD ["python", "app.py"]
