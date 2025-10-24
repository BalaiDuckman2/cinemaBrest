# 🚀 Guide de Démarrage Rapide - CinéBrest

## ✅ Système d'Authentification Implémenté !

Toutes les fonctionnalités sont **opérationnelles** :
- ✅ Inscription utilisateur
- ✅ Connexion/Déconnexion
- ✅ Calendrier personnel
- ✅ Ajout/Suppression de séances
- ✅ Sécurité (bcrypt, CSRF, sessions)

---

## 🎯 Test Rapide (5 minutes)

### 1. L'application tourne déjà sur http://127.0.0.1:5000 ✓

### 2. Tester l'Inscription

Allez sur : **http://127.0.0.1:5000/register**

Remplissez :
- Email : `demo@cinebrest.fr`
- Nom : `Cinéphile Brestois`
- Mot de passe : `cinema2025`
- Confirmer : `cinema2025`

Cliquez sur **"S'inscrire"**

**✅ Résultat attendu** : Redirection vers `/login` avec message de succès

---

### 3. Tester la Connexion

Sur : **http://127.0.0.1:5000/login**

Connectez-vous avec :
- Email : `demo@cinebrest.fr`
- Password : `cinema2025`
- ☑️ Cochez "Se souvenir de moi"

Cliquez sur **"Se connecter"**

**✅ Résultat attendu** :
- Message : "Bienvenue Cinéphile Brestois ! 🎬"
- Header affiche : "📅 Mon Calendrier" et "👋 Déconnexion"

---

### 4. Tester l'Ajout au Calendrier

Sur : **http://127.0.0.1:5000**

1. Parcourez les films
2. Survolez un horaire (ex: "20h30")
3. Cliquez sur le bouton **➕** qui apparaît

**✅ Résultat attendu** : Notification "✅ Ajouté à votre calendrier !"

---

### 5. Voir le Calendrier

Cliquez sur **"📅 Mon Calendrier"** dans le header

**✅ Résultat attendu** :
- Cartes de films avec affiche, titre, cinéma, date, heure
- Bouton "Supprimer" sur chaque carte

---

### 6. Supprimer une Séance

Sur le calendrier, cliquez sur **"Supprimer"**

**✅ Résultat attendu** :
- Message : "Séance supprimée de votre calendrier"
- Film retiré de la liste

---

### 7. Déconnexion

Cliquez sur **"👋 Déconnexion"** dans le header

**✅ Résultat attendu** :
- Message : "Vous êtes déconnecté"
- Header affiche : "Se connecter" et "S'inscrire"
- Boutons ➕ ne sont plus visibles

---

## 📋 Checklist de Vérification

- [ ] ✅ Page d'inscription accessible
- [ ] ✅ Création de compte fonctionne
- [ ] ✅ Connexion fonctionne
- [ ] ✅ Message de bienvenue personnalisé
- [ ] ✅ Header dynamique (connecté/déconnecté)
- [ ] ✅ Boutons ➕ visibles uniquement si connecté
- [ ] ✅ Ajout au calendrier fonctionne
- [ ] ✅ Notifications toast affichées
- [ ] ✅ Calendrier affiche les séances
- [ ] ✅ Suppression fonctionne
- [ ] ✅ Déconnexion fonctionne

---

## 🐛 En Cas de Problème

### Erreur "Could not build url"
✅ **RÉSOLU** : Routes corrigées (`url_for('home')` au lieu de `url_for('index')`)

### Base de données non initialisée
Lancez :
```powershell
python init_auth_db.py
```

### Application ne démarre pas
Vérifiez les dépendances :
```powershell
pip install -r requirements.txt
```

### Page blanche
Vérifiez que l'application tourne :
```powershell
python app.py
```
Puis ouvrez : http://127.0.0.1:5000

---

## 📖 Documentation Complète

- **SUMMARY.md** → Résumé complet avec checklist
- **TEST_GUIDE.md** → 15+ scénarios de test détaillés
- **FEATURES.md** → Liste exhaustive des fonctionnalités
- **DOCUMENTATION.md** → Documentation technique complète
- **CHANGELOG_AUTH.md** → Changelog des modifications

---

## 🎉 Félicitations !

Votre système d'authentification avec calendrier personnel est **100% fonctionnel** !

**CinéBrest - Tous vos cinémas en un coup d'œil** 🎬✨
