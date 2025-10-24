# 🎬 CinéBrest - Système d'Authentification et Calendrier Personnel

## 📋 Résumé des Modifications

### ✨ Nouvelles Fonctionnalités

1. **Système de Comptes Utilisateurs**
   - Inscription avec email/nom/mot de passe
   - Connexion sécurisée avec session persistante
   - Déconnexion
   - Protection des routes privées avec `@login_required`

2. **Calendrier Personnel**
   - Ajouter des séances de films au calendrier
   - Voir toutes les séances sauvegardées
   - Supprimer des séances du calendrier
   - Détection des doublons (même film, même horaire, même cinéma)

3. **Interface Utilisateur**
   - Header dynamique (connecté/déconnecté)
   - Boutons ➕ sur chaque horaire (visibles uniquement si connecté)
   - Notifications toast temporaires
   - Messages flash pour les actions importantes
   - Design Tailwind CSS cohérent

---

## 📂 Fichiers Créés

### Backend

1. **`modules/auth.py`** (NEW)
   - Classe `User` pour Flask-Login
   - Fonctions `hash_password()` et `check_password()` avec bcrypt

2. **`modules/forms.py`** (NEW)
   - Formulaires WTForms : `RegisterForm`, `LoginForm`
   - Validation des emails, mots de passe, unicité des emails

3. **`init_auth_db.py`** (NEW)
   - Script d'initialisation des tables `users` et `user_watchlist`

### Frontend

4. **`templates/login.html`** (NEW)
   - Page de connexion avec formulaire email/password
   - Lien vers la page d'inscription

5. **`templates/register.html`** (NEW)
   - Page d'inscription avec validation
   - Confirmation du mot de passe

6. **`templates/calendar.html`** (NEW)
   - Affichage du calendrier personnel
   - Cartes de films avec affiche, infos, bouton supprimer
   - État vide avec CTA

---

## 🔧 Fichiers Modifiés

### Backend

1. **`app.py`**
   - Imports Flask-Login, redirect, url_for, flash
   - Configuration `SECRET_KEY`
   - Initialisation `LoginManager` et `Bcrypt`
   - Fonction `user_loader()`
   - **6 nouvelles routes** :
     - `POST /register` - Inscription
     - `POST /login` - Connexion
     - `GET /logout` - Déconnexion
     - `GET /my-calendar` - Affichage calendrier
     - `POST /add-to-calendar` - Ajouter séance
     - `POST /remove-from-calendar/<id>` - Supprimer séance

2. **`modules/database.py`**
   - Nouvelle table `users` (id, email, password_hash, name, created_at, last_login)
   - Nouvelle table `user_watchlist` (id, user_id, film_title, cinema, showtime_date, showtime_time, film_url, film_poster, showtime_version, notes, added_at)
   - Index sur `user_id` et `(user_id, showtime_date)`
   - **8 nouvelles fonctions** :
     - `create_user(email, password_hash, name)`
     - `get_user_by_email(email)`
     - `get_user_by_id(user_id)`
     - `update_last_login(user_id)`
     - `add_to_watchlist(...)`
     - `remove_from_watchlist(watchlist_id, user_id)`
     - `get_user_watchlist(user_id, start_date, end_date)`
     - `is_in_watchlist(user_id, film_title, cinema, date, time)`

3. **`requirements.txt`**
   - Ajout de 4 nouvelles dépendances :
     - `Flask-Login>=0.6.3`
     - `Flask-Bcrypt>=1.0.1`
     - `Flask-WTF>=1.2.1`
     - `email-validator>=2.1.0`

### Frontend

4. **`templates/base.html`**
   - Header mis à jour avec liens conditionnels :
     - Si connecté : "📅 Mon Calendrier" + "👋 Déconnexion"
     - Si déconnecté : "Se connecter" + "S'inscrire"
   - Ajout du système de messages flash (success, error, info)

5. **`templates/index.html`**
   - Boutons ➕ sur chaque horaire (visibles si connecté)
   - Fonction JavaScript `addToCalendar()`
   - Fonction `showNotification()` pour les toasts

---

## 🗄️ Structure de la Base de Données

### Table `users`

| Colonne        | Type      | Description                        |
|----------------|-----------|------------------------------------|
| id             | INTEGER   | PRIMARY KEY AUTOINCREMENT          |
| email          | TEXT      | UNIQUE NOT NULL                    |
| password_hash  | TEXT      | NOT NULL (bcrypt hash)             |
| name           | TEXT      | NULL (optionnel)                   |
| created_at     | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP          |
| last_login     | TIMESTAMP | NULL (mise à jour à chaque login)  |

### Table `user_watchlist`

| Colonne          | Type      | Description                        |
|------------------|-----------|------------------------------------|
| id               | INTEGER   | PRIMARY KEY AUTOINCREMENT          |
| user_id          | INTEGER   | FOREIGN KEY → users(id) ON DELETE CASCADE |
| film_title       | TEXT      | NOT NULL                           |
| cinema           | TEXT      | NOT NULL                           |
| showtime_date    | TEXT      | NOT NULL (format YYYY-MM-DD)       |
| showtime_time    | TEXT      | NOT NULL (format HH:MM)            |
| film_url         | TEXT      | NULL                               |
| film_poster      | TEXT      | NULL                               |
| showtime_version | TEXT      | NULL (VF, VOST, etc.)              |
| notes            | TEXT      | NULL (notes personnelles)          |
| added_at         | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP          |

### Indexes

- `idx_user_watchlist_user` sur `user_watchlist(user_id)`
- `idx_user_watchlist_date` sur `user_watchlist(user_id, showtime_date)`

---

## 🔐 Sécurité

### Implémentation

1. **Hachage des Mots de Passe** : Bcrypt avec salt automatique
2. **Protection CSRF** : Flask-WTF sur tous les formulaires
3. **Sessions Sécurisées** : `SECRET_KEY` générée aléatoirement si absente du `.env`
4. **Validation Serveur** : WTForms valide tous les inputs
5. **SQL Prepared Statements** : Protection contre les injections SQL
6. **Login Required** : Décorateur `@login_required` sur les routes privées

### Variables d'Environnement

Ajouter dans `.env` :

```env
SECRET_KEY=votre_clé_secrète_très_longue_et_aléatoire
```

Sinon, une clé est générée automatiquement à chaque démarrage (sessions perdues au redémarrage).

---

## 🎨 Design System

### Palette de Couleurs

- **Indigo** : Boutons primaires (S'inscrire, Se connecter)
- **Purple** : Calendrier, fonctionnalités utilisateur
- **Green** : Succès, bouton Installation PWA
- **Red** : Erreurs
- **Blue** : Informations
- **Gray** : Fond, déconnexion

### Emojis

- 🎬 : Cinéma général
- ✅ : Succès
- ❌ : Erreur
- ⚠️ : Avertissement
- 📅 : Calendrier
- 👋 : Déconnexion
- 🔐 : Connexion
- ➕ : Ajouter

---

## 📦 Installation et Démarrage

### 1. Installer les Dépendances

```powershell
pip install -r requirements.txt
```

### 2. Initialiser la Base de Données

```powershell
python init_auth_db.py
```

### 3. Lancer l'Application

```powershell
python app.py
```

### 4. Accéder à l'Application

Ouvrir **http://127.0.0.1:5000**

---

## 🧪 Tests

Consulter **TEST_GUIDE.md** pour le guide complet de test.

### Tests Rapides

1. **Inscription** : http://127.0.0.1:5000/register
2. **Connexion** : http://127.0.0.1:5000/login
3. **Calendrier** : http://127.0.0.1:5000/my-calendar
4. **Ajouter une séance** : Cliquer sur ➕ sur un horaire
5. **Déconnexion** : Cliquer sur "👋 Déconnexion"

---

## 🚀 Déploiement

### Docker

Les changements sont compatibles avec le `Dockerfile` existant. Aucune modification nécessaire.

### Variables d'Environnement

Ajouter dans le fichier `.env` ou dans Docker :

```env
SECRET_KEY=votre_clé_secrète_production
```

### Base de Données

SQLite par défaut (`cinema.db`). Pour la production, envisager PostgreSQL avec SQLAlchemy.

---

## 📊 Métriques

Pas de changement sur les métriques Prometheus existantes. Possibilité d'ajouter :

- `cinema_users_total` : Nombre total d'utilisateurs
- `cinema_watchlist_total` : Nombre total de séances ajoutées
- `cinema_logins_total` : Nombre de connexions

---

## 🐛 Problèmes Connus

### Warnings Pylance (Non-bloquants)

- **Type hints** : `str | None` vs `str` sur les arguments des fonctions
- **Solution** : Ajouter des checks `if value is not None` dans les routes

### Limitations

1. **Email non vérifié** : Pas de système de confirmation par email (à implémenter)
2. **Récupération de mot de passe** : Pas de fonctionnalité "Mot de passe oublié"
3. **Profil utilisateur** : Pas de page de profil pour modifier les infos
4. **Photos de profil** : Non supporté actuellement

---

## 🔮 Améliorations Futures

### Court Terme

1. **Vérification Email** : Envoyer un lien de confirmation
2. **Reset Password** : Système de récupération de mot de passe
3. **Profil Utilisateur** : Page pour modifier nom/email/password
4. **Notes** : Ajouter des notes personnelles sur chaque séance

### Moyen Terme

5. **Export iCal** : Télécharger le calendrier au format `.ics`
6. **Notifications** : Rappels 1h avant la séance (PWA notifications)
7. **Partage** : Partager son calendrier avec des amis
8. **Statistiques** : Tableau de bord utilisateur (films vus, cinéma préféré)

### Long Terme

9. **OAuth** : Connexion avec Google, Facebook, GitHub
10. **API REST** : Endpoints pour applications mobiles natives
11. **Gestion Groupes** : Créer des groupes d'amis pour voir les films ensemble
12. **Recommandations** : Suggestions de films basées sur l'historique

---

## 📝 Changelog

### v2.0.0 - 2025-10-24

**BREAKING CHANGES**

- Nouvelle table `users` dans la base de données
- Nouvelle table `user_watchlist` dans la base de données
- Nécessite `python init_auth_db.py` avant le premier démarrage

**Ajouts**

- ✅ Système d'authentification complet (inscription, connexion, déconnexion)
- ✅ Calendrier personnel pour sauvegarder les séances
- ✅ Boutons ➕ sur chaque horaire (visibles uniquement si connecté)
- ✅ Messages flash et notifications toast
- ✅ Protection des routes privées avec `@login_required`
- ✅ Validation des formulaires avec WTForms
- ✅ Hachage sécurisé des mots de passe avec bcrypt

**Modifications**

- 🔄 Header dynamique (liens conditionnels selon l'état de connexion)
- 🔄 Base de données étendue avec tables `users` et `user_watchlist`
- 🔄 Requirements.txt mis à jour (Flask-Login, Flask-Bcrypt, Flask-WTF)

**Corrections**

- 🐛 Aucun bug connu à ce stade

---

**Développé avec ❤️ pour CinéBrest**
