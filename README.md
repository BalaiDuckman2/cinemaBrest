# 🎬 CinéBrest

Application web pour visualiser tous les films à l'affiche dans les cinémas de Brest et Landerneau, avec filtrage par âge du film et vue hebdomadaire.

![Python](https://img.shields.io/badge/Python-3.13-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![SQLite](https://img.shields.io/badge/SQLite-3-lightgrey)

## ✨ Fonctionnalités

### 🎬 Gestion des Séances

- 📅 **Vue hebdomadaire** des séances pour tous les cinémas
- 🎭 **5 cinémas** : Les Studios, CGR Le Celtic, Multiplexe Liberté, Pathé Capucins, Ciné Galaxy
- 🔍 **Filtres par âge du film** : +1, +5, +10, +20, +30, +50 ans
- 🗓️ **Navigation par semaine** (précédente/suivante)
- 🎯 **Tri** par date de sortie, popularité, nombre de séances
- 🔎 **Recherche** par titre de film

### 👤 Comptes Utilisateurs ⭐ NOUVEAU

- 📝 **Inscription** avec email et mot de passe sécurisé (bcrypt)
- 🔐 **Connexion** avec session persistante (30 jours)
- 📅 **Calendrier personnel** pour sauvegarder vos séances favorites
- ➕ **Ajouter des séances** en 1 clic depuis la page principale
- �️ **Gérer votre watchlist** avec suppression facile
- 🔒 **Sécurité** : CSRF protection, password hashing, email validation

### 🛠️ Technique

- �🗺️ **Carte interactive** des cinémas (Leaflet.js + Jawg Maps)
- ⚡ **Cache 3 niveaux** pour des performances instantanées
- 💾 **Base de données SQLite** avec TTL de 6 heures
- 📱 **PWA** (Progressive Web App) installable
- 📈 **Monitoring Prometheus** pour métriques
- 🎨 **Interface moderne** avec Tailwind CSS (thème sombre)
- 🐳 **Prêt pour Docker** et déploiement sur NAS

## 🚀 Installation

### Option 1 : Local (Windows/Linux/Mac)

1. **Cloner le projet**
   ```bash
   git clone https://github.com/BalaiDuckman2/cinemaBrest.git
   cd cinemaBrest
   ```

2. **Installer Python 3.13+**
   - Windows : https://www.python.org/downloads/
   - Linux : `sudo apt install python3.13`
   - Mac : `brew install python@3.13`

3. **Installer les dépendances**
   ```bash
   pip install -r requirements.txt
   ```

4. **Créer le fichier .env**
   ```bash
   cp .env.example .env
   ```
   
   Éditez `.env` et ajoutez :
   - **SECRET_KEY** : Clé secrète pour les sessions (obligatoire)
   - **JAWG_API_KEY** : Clé API Jawg Maps (gratuite sur https://www.jawg.io/)
   
   Générer une clé secrète :
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

5. **Initialiser la base de données**
   ```bash
   python init_auth_db.py
   ```

6. **Lancer l'application**
   ```bash
   python app.py
   ```

7. **Ouvrir dans le navigateur**
   ```
   http://localhost:5000
   ```

### Option 2 : Docker (recommandé pour NAS)

Voir les guides complets :
- [DEPLOIEMENT_DOCKER.md](DEPLOIEMENT_DOCKER.md) - Docker / Docker Compose
- [PORTAINER_DEPLOYMENT.md](PORTAINER_DEPLOYMENT.md) - Portainer (recommandé)

**Démarrage rapide avec Portainer :**

1. Utiliser l'image Docker Hub : `balaiduckman2/cinema-brest:latest`
2. Copier le contenu de `portainer-stack.yml`
3. Créer un nouveau stack dans Portainer
4. Remplacer `JAWG_API_KEY` par votre clé
5. Déployer !

**Démarrage rapide avec Docker Compose :**

```bash
# 1. Créer le fichier .env avec votre clé API
cp .env.example .env

# 2. Lancer avec Docker Compose
docker compose up -d

# 3. Voir les logs
docker compose logs -f
```

**Déploiement automatique sur NAS :**

```powershell
.\deploy-to-nas.ps1 -NasIP "192.168.1.100" -NasUser "admin"
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────┐
│            Navigateur Web                       │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Flask App (app.py)                      │
│  ┌──────────────────────────────────────────┐   │
│  │  Cache HTML (instantané)                 │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │  Cache Semaine (< 10ms)                  │   │
│  └──────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│      modules/api.py (AlloCiné)                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Cache Mémoire (< 1ms)                   │   │
│  └──────────────────────────────────────────┘   │
└────────────────┬────────────────────────────────┘
                 │
     ┌───────────┴───────────┐
     ▼                       ▼
┌─────────────┐      ┌──────────────────┐
│  SQLite DB  │      │  AlloCiné API    │
│  (6h TTL)   │      │  (Rate limited)  │
└─────────────┘      └──────────────────┘
```

### Système de cache 3 niveaux

1. **Cache HTML** : Rendu complet en mémoire → < 5ms
2. **Cache Semaine** : Résultats agrégés → < 10ms
3. **Cache Mémoire** : Objets Showtime → < 1ms
4. **Base de données** : SQLite avec TTL 6h → ~100ms
5. **API AlloCiné** : Requêtes réseau → 5-10s

## 📁 Structure du projet

```
cinema-brest/
├── app.py                      # Application Flask principale
├── requirements.txt            # Dépendances Python
├── Dockerfile                  # Image Docker
├── docker-compose.yml          # Configuration Docker Compose
├── .env.example                # Template de configuration
├── modules/
│   ├── api.py                 # Intégration AlloCiné + cache
│   ├── database.py            # Gestion SQLite
│   ├── curl.py                # Support terminal
│   └── monitoring.py          # Logs et métriques
├── static/
│   ├── css/main.css           # Styles (thème sombre)
│   ├── font/                  # Polices personnalisées
│   └── images/                # Assets graphiques
├── templates/
│   ├── base.html              # Template de base
│   └── index.html             # Page principale
├── data/
│   └── cinema.db              # Base de données (auto-créée)
├── clear_db.py                # Vider le cache
├── db_stats.py                # Statistiques BDD
└── DEPLOIEMENT_DOCKER.md      # Guide Docker détaillé
```

## 🛠️ Commandes utiles

```bash
# Vider la base de données
python clear_db.py

# Voir les statistiques
python db_stats.py

# Lancer en mode développement
python app.py

# Avec Docker
docker-compose up -d          # Lancer
docker-compose logs -f        # Logs
docker-compose restart        # Redémarrer
docker-compose down           # Arrêter
```

## 🎯 Filtres disponibles

- **Tous** : Tous les films
- **+1 an** : Films sortis il y a au moins 1 an
- **+5 ans** : Films sortis il y a au moins 5 ans
- **+10 ans** : Films sortis il y a au moins 10 ans
- **+20 ans** : Films sortis il y a au moins 20 ans
- **+30 ans** : Films sortis il y a au moins 30 ans
- **+50 ans** : Films sortis il y a au moins 50 ans

## 🔧 Configuration

Fichier `.env` :

```env
# Clé API Jawg Maps (obligatoire)
JAWG_API_KEY=votre_clé_ici

# Serveur
HOST=0.0.0.0
PORT=5000

# Fuseau horaire
TIMEZONE=Europe/Paris
```

## 🐛 Dépannage

### L'application ne charge pas les séances

Vérifiez votre connexion Internet et que l'API AlloCiné est accessible :
```bash
curl https://www.allocine.fr/_/localization_city/Brest
```

### Le cache ne se rafraîchit pas

Videz manuellement :
```bash
python clear_db.py
```

### Erreur de base de données

Supprimez et recréez :
```bash
rm data/cinema.db
python app.py
```

## 📝 Notes techniques

- **TTL de la base de données** : 6 heures
- **Nettoyage automatique** : Séances > 1 jour supprimées au démarrage
- **Rate limiting** : 0,3s entre chaque appel API AlloCiné
- **Gestion d'erreurs** : Retry automatique sur erreur 429
- **Utilisation mémoire** : < 100 Mo RAM
- **Taille de l'image Docker** : ~150 Mo

## 🚧 Limitations connues

- **Dates de re-releases** : Les films remasterisés (ex: "Final Cut", "Redux") peuvent afficher la date de re-release au lieu de la date originale. C'est une limitation de l'API AlloCiné.

## 📜 Licence

Ce projet est à usage personnel. L'API AlloCiné est utilisée de manière non officielle.

## 🤝 Contribution

Les pull requests sont bienvenues ! Pour des changements majeurs, ouvrez d'abord une issue.

## 📧 Contact

Créé par [@BalaiDuckman2](https://github.com/BalaiDuckman2)

---

⭐ Si ce projet vous est utile, n'hésitez pas à lui donner une étoile !
