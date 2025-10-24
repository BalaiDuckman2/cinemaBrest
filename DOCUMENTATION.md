# 🎬 CinéBrest - Documentation Complète

## 📚 Table des Matières

1. [Introduction](#introduction)
2. [Architecture](#architecture)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Utilisation](#utilisation)
6. [API](#api)
7. [Base de Données](#base-de-données)
8. [Sécurité](#sécurité)
9. [Tests](#tests)
10. [Déploiement](#déploiement)

---

## Introduction

**CinéBrest** est une application web Flask qui agrège les horaires de cinéma de Brest et Landerneau sur une seule page, avec un système de comptes utilisateurs permettant de sauvegarder ses séances favorites dans un calendrier personnel.

### Fonctionnalités Principales

- 🎬 Agrégation des séances de 5 cinémas
- 📅 Affichage sur 7 jours glissants
- 🔍 Filtres par cinéma, date, version (VF/VOST)
- 🔎 Recherche par titre de film
- 📊 Tri par date de sortie, popularité, nombre de séances
- 👤 Comptes utilisateurs avec email/password
- 📅 Calendrier personnel pour sauvegarder les séances
- 📱 PWA (Progressive Web App) installable
- ⚡ Cache 3 niveaux (mémoire, SQLite, API)
- 📈 Monitoring Prometheus

### Technologies Utilisées

- **Backend** : Flask 3.0, Python 3.13
- **Frontend** : Tailwind CSS 3 (CDN uniquement), JavaScript Vanilla
- **Base de données** : SQLite 3
- **Authentification** : Flask-Login, Flask-Bcrypt
- **Validation** : Flask-WTF, WTForms
- **PWA** : Service Worker, Manifest
- **Déploiement** : Docker Alpine

---

## Architecture

### Structure du Projet

```
cinema/
├── app.py                      # Application Flask principale
├── requirements.txt            # Dépendances Python
├── init_auth_db.py             # Initialisation des tables auth
├── .env.example                # Template de configuration
├── .github/
│   └── copilot-instructions.md # Commandes Copilot personnalisées
├── modules/
│   ├── api.py                  # Client API AlloCiné
│   ├── database.py             # ORM SQLite
│   ├── monitoring.py           # Métriques Prometheus
│   ├── auto_refresh.py         # Rafraîchissement quotidien
│   ├── auth.py                 # User model + password utils
│   ├── forms.py                # WTForms (Login, Register)
│   └── curl.py                 # HTTP client custom
├── templates/
│   ├── base.html               # Template de base avec PWA
│   ├── index.html              # Page principale avec filtres
│   ├── login.html              # Page de connexion
│   ├── register.html           # Page d'inscription
│   └── calendar.html           # Calendrier personnel
├── static/
│   ├── images/                 # Icônes, logos, backgrounds
│   ├── manifest.json           # Manifest PWA
│   └── sw.js                   # Service Worker
├── docs/
│   ├── TEST_GUIDE.md           # Guide de test complet
│   ├── CHANGELOG_AUTH.md       # Changelog du système auth
│   └── README.md               # Ce fichier
└── docker/
    ├── Dockerfile              # Image Alpine Python
    └── docker-compose.yml      # Orchestration
```

### Flux de Données

```
┌─────────────┐
│   Client    │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP Request
       ▼
┌─────────────────┐
│   Flask App     │
│   (app.py)      │
└────────┬────────┘
         │
         ├─────► modules/api.py ──► AlloCiné API
         │                           (rate limited 200ms)
         │
         ├─────► modules/database.py ──► SQLite
         │                                (cinema.db)
         │
         └─────► modules/monitoring.py ──► Prometheus
                                            (:9090/metrics)
```

### Cache 3 Niveaux

```
1. Cache Mémoire (Dict Python)
   └─ TTL: Jusqu'au redémarrage
   
2. Cache SQLite (Table `showtimes`)
   └─ TTL: 6 heures (configurable)
   
3. API AlloCiné (Fallback)
   └─ Rate limit: 200ms entre appels
```

---

## Installation

### Prérequis

- Python 3.13+
- pip 24+
- SQLite 3

### 1. Cloner le Projet

```powershell
git clone https://github.com/votre-repo/cinema.git
cd cinema
```

### 2. Installer les Dépendances

```powershell
pip install -r requirements.txt
```

### 3. Configurer l'Environnement

Copier `.env.example` en `.env` :

```powershell
cp .env.example .env
```

Modifier `.env` :

```env
SECRET_KEY=votre_clé_secrète_générée
HOST=127.0.0.1
PORT=5000
```

Générer une clé secrète :

```powershell
python -c "import secrets; print(secrets.token_hex(32))"
```

### 4. Initialiser la Base de Données

```powershell
python init_auth_db.py
```

### 5. Lancer l'Application

```powershell
python app.py
```

L'application sera accessible sur **http://127.0.0.1:5000**

---

## Configuration

### Variables d'Environnement

| Variable           | Type    | Défaut        | Description                                  |
|--------------------|---------|---------------|----------------------------------------------|
| `SECRET_KEY`       | string  | (généré auto) | Clé secrète Flask pour les sessions          |
| `HOST`             | string  | `127.0.0.1`   | Adresse d'écoute du serveur                  |
| `PORT`             | int     | `5000`        | Port d'écoute du serveur                     |
| `TIMEZONE`         | string  | `Europe/Paris`| Fuseau horaire                               |
| `JAWG_API_KEY`     | string  | (optionnel)   | Clé API pour les cartes Jawg                 |
| `monitoring_enabled` | bool  | `false`       | Activer Prometheus monitoring                |

### Configuration Flask

- **DEBUG** : `False` (ne JAMAIS activer en production)
- **PERMANENT_SESSION_LIFETIME** : 30 jours
- **SESSION_COOKIE_SECURE** : `False` (mettre `True` en HTTPS)
- **SESSION_COOKIE_HTTPONLY** : `True`
- **SESSION_COOKIE_SAMESITE** : `Lax`

---

## Utilisation

### Interface Utilisateur

#### 1. Page d'Accueil (`/`)

- Affiche tous les films à l'affiche
- Filtres disponibles :
  - 🎭 Cinéma (5 cinémas)
  - 📅 Semaine (semaine actuelle, prochaine semaine)
  - 👶 Âge (tout public, famille, adulte)
- Tri :
  - 📅 Date de sortie
  - ⭐ Popularité (nombre de salles)
  - 🎬 Nombre de séances
- Recherche par titre

#### 2. Inscription (`/register`)

- Formulaire :
  - Email (unique, validé)
  - Nom (optionnel)
  - Mot de passe (min 6 caractères)
  - Confirmation du mot de passe
- Validation côté serveur (WTForms)
- Redirection vers `/login` après succès

#### 3. Connexion (`/login`)

- Formulaire :
  - Email
  - Mot de passe
  - Case "Se souvenir de moi" (30 jours)
- Messages flash en cas d'erreur
- Redirection vers page demandée ou `/`

#### 4. Calendrier Personnel (`/my-calendar`)

- **Accessible uniquement si connecté**
- Affiche toutes les séances sauvegardées
- Tri chronologique automatique
- Informations affichées :
  - 🎞️ Affiche du film
  - 🎬 Titre
  - 🏛️ Cinéma
  - 📅 Date
  - ⏰ Heure
  - 🗣️ Version (VF/VOST)
- Actions :
  - 🗑️ Supprimer une séance

#### 5. Ajouter au Calendrier

- Bouton ➕ sur chaque horaire (visible uniquement si connecté)
- Détection des doublons
- Notification toast de confirmation

---

## API

### Endpoints Publics

#### `GET /`

Affiche la page d'accueil avec les films.

**Paramètres (query string)** :

- `week` : Semaine (0 = actuelle, 1 = prochaine)
- `age` : Âge minimum (0, 1, 30)

**Exemple** :

```
GET /?week=0&age=0
```

---

#### `GET /api/films`

Retourne les films au format JSON.

**Paramètres (query string)** :

- `week` : Semaine (0 ou 1)
- `age` : Âge minimum (0, 1, 30)

**Réponse** :

```json
{
  "films": [
    {
      "titre": "Venom: The Last Dance",
      "url": "https://...",
      "affiche": "https://...",
      "genre": "Action, Fantastique",
      "duree": "1h50",
      "sortie": "2025-10-23",
      "version": "VF",
      "seances": {
        "CGR Brest Le Celtic": {
          "2025-10-25": ["14:00", "16:30", "20:00"]
        }
      }
    }
  ]
}
```

---

### Endpoints Authentification

#### `GET /register`

Affiche le formulaire d'inscription.

#### `POST /register`

Crée un nouveau compte utilisateur.

**Body (form-data)** :

- `email` : Email unique
- `name` : Nom (optionnel)
- `password` : Mot de passe (min 6 chars)
- `confirm_password` : Confirmation

**Redirection** :

- Succès : `/login`
- Erreur : `/register` avec erreurs

---

#### `GET /login`

Affiche le formulaire de connexion.

#### `POST /login`

Authentifie l'utilisateur.

**Body (form-data)** :

- `email` : Email
- `password` : Mot de passe
- `remember` : `true`/`false` (optionnel)

**Redirection** :

- Succès : `/` ou `?next=...`
- Erreur : `/login` avec message d'erreur

---

#### `GET /logout`

Déconnecte l'utilisateur.

**Redirection** : `/`

---

### Endpoints Calendrier (Authentification requise)

#### `GET /my-calendar`

Affiche le calendrier personnel de l'utilisateur.

---

#### `POST /add-to-calendar`

Ajoute une séance au calendrier.

**Body (form-data)** :

- `film_title` : Titre du film
- `cinema` : Nom du cinéma
- `showtime_date` : Date (YYYY-MM-DD)
- `showtime_time` : Heure (HH:MM)
- `film_url` : URL AlloCiné (optionnel)
- `film_poster` : URL affiche (optionnel)
- `showtime_version` : VF/VOST (optionnel)

**Réponse JSON** :

```json
{
  "success": true,
  "message": "Ajouté à votre calendrier !"
}
```

ou

```json
{
  "success": false,
  "message": "Déjà dans votre calendrier"
}
```

---

#### `POST /remove-from-calendar/<watchlist_id>`

Supprime une séance du calendrier.

**Redirection** : `/my-calendar`

---

### Endpoints Utilitaires

#### `GET /healthcheck`

Health check pour Docker/Kubernetes.

**Réponse** : `ok`

---

#### `GET /metrics`

Métriques Prometheus (si activé).

---

#### `GET /manifest.json`

Manifest PWA.

---

#### `GET /sw.js`

Service Worker PWA.

---

## Base de Données

### Schéma SQLite

#### Table `cinemas`

```sql
CREATE TABLE cinemas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    allocine_id TEXT UNIQUE NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### Table `films`

```sql
CREATE TABLE films (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    allocine_id TEXT UNIQUE NOT NULL,
    genre TEXT,
    duration TEXT,
    release_date TEXT,
    poster_url TEXT,
    url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

#### Table `showtimes`

```sql
CREATE TABLE showtimes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cinema_id INTEGER NOT NULL,
    film_id INTEGER NOT NULL,
    showtime_date TEXT NOT NULL,
    showtime_time TEXT NOT NULL,
    version TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
    FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE
);

CREATE INDEX idx_showtimes_cinema ON showtimes(cinema_id);
CREATE INDEX idx_showtimes_film ON showtimes(film_id);
CREATE INDEX idx_showtimes_date ON showtimes(showtime_date);
```

---

#### Table `users` ⭐ NEW

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

---

#### Table `user_watchlist` ⭐ NEW

```sql
CREATE TABLE user_watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    film_title TEXT NOT NULL,
    cinema TEXT NOT NULL,
    showtime_date TEXT NOT NULL,
    showtime_time TEXT NOT NULL,
    film_url TEXT,
    film_poster TEXT,
    showtime_version TEXT,
    notes TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_watchlist_user ON user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_date ON user_watchlist(user_id, showtime_date);
```

---

## Sécurité

### Authentification

- **Hachage des mots de passe** : Bcrypt avec salt automatique
- **Sessions sécurisées** : Flask-Login avec cookies HttpOnly
- **CSRF Protection** : Flask-WTF sur tous les formulaires
- **Email validation** : email-validator (RFC 5322)
- **Password strength** : Minimum 6 caractères (à augmenter en production)

### Prévention des Attaques

| Attaque              | Protection                                  |
|----------------------|---------------------------------------------|
| SQL Injection        | Prepared statements (parameterized queries) |
| XSS                  | Jinja2 auto-escaping                        |
| CSRF                 | Flask-WTF tokens                            |
| Session Fixation     | Flask-Login session regeneration            |
| Brute Force          | Rate limiting (à implémenter)               |
| Password Cracking    | Bcrypt (slow hashing)                       |

### Recommandations Production

1. **HTTPS obligatoire** : Mettre `SESSION_COOKIE_SECURE=True`
2. **SECRET_KEY robuste** : Min 32 bytes, aléatoire, secret
3. **Rate Limiting** : Flask-Limiter sur `/login` et `/register`
4. **Email Verification** : Vérifier l'email avant activation
5. **Password Policy** : Min 8 chars, complexité (maj, min, chiffres, symboles)
6. **2FA** : Two-Factor Authentication (OTP, TOTP)
7. **Logging** : Logger toutes les tentatives de connexion
8. **Monitoring** : Alertes sur activité suspecte

---

## Tests

Consulter **TEST_GUIDE.md** pour le guide complet.

### Tests Unitaires (À implémenter)

```python
# tests/test_auth.py
def test_register_user():
    """Test de l'inscription."""
    pass

def test_login_user():
    """Test de la connexion."""
    pass

def test_add_to_watchlist():
    """Test d'ajout au calendrier."""
    pass
```

### Tests Fonctionnels

- ✅ Inscription avec email unique
- ✅ Connexion avec email/password
- ✅ Ajout de séances au calendrier
- ✅ Suppression de séances du calendrier
- ✅ Protection des routes privées
- ✅ Validation des formulaires

---

## Déploiement

### Docker

```dockerfile
FROM python:3.13-alpine

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV HOST=0.0.0.0
ENV PORT=5000

EXPOSE 5000

CMD ["python", "app.py"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  cinema:
    build: .
    ports:
      - "5000:5000"
    environment:
      - SECRET_KEY=${SECRET_KEY}
      - HOST=0.0.0.0
      - PORT=5000
    volumes:
      - ./cinema.db:/app/cinema.db
    restart: unless-stopped
```

### Commandes

```powershell
# Build
docker build -t cinebrest .

# Run
docker run -p 5000:5000 -e SECRET_KEY="..." cinebrest

# Compose
docker-compose up -d
```

---

## Support

- 📧 Email : support@cinebrest.fr
- 🐛 Issues : https://github.com/votre-repo/cinema/issues
- 📖 Wiki : https://github.com/votre-repo/cinema/wiki

---

**CinéBrest - Tous vos cinémas en un coup d'œil** 🎬✨
