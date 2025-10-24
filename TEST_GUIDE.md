# 🎬 Guide de Test - Système d'Authentification et Calendrier

## ✅ Étapes de Test

### 1. Inscription (Register)

1. Aller sur **http://127.0.0.1:5000/register**
2. Remplir le formulaire :
   - Email : `test@example.com`
   - Nom : `John Doe` (optionnel)
   - Mot de passe : `cinema123` (min 6 caractères)
   - Confirmer mot de passe : `cinema123`
3. Cliquer sur "S'inscrire"
4. **Résultat attendu** :
   - ✅ Message de succès : "Compte créé avec succès !"
   - ➡️ Redirection vers `/login`

---

### 2. Connexion (Login)

1. Sur **http://127.0.0.1:5000/login**
2. Remplir le formulaire :
   - Email : `test@example.com`
   - Mot de passe : `cinema123`
   - ☑️ Cocher "Se souvenir de moi" (optionnel)
3. Cliquer sur "Se connecter"
4. **Résultat attendu** :
   - ✅ Message de succès : "Bienvenue John Doe ! 🎬"
   - ➡️ Redirection vers `/` (page d'accueil)
   - 🔎 Voir le header avec "📅 Mon Calendrier" et "👋 Déconnexion"

---

### 3. Ajouter un Film au Calendrier

1. Sur **http://127.0.0.1:5000**
2. Parcourir les films et séances
3. Survoler un horaire (ex: "20h30")
4. Cliquer sur le bouton **➕** qui apparaît
5. **Résultat attendu** :
   - ✅ Notification en haut à droite : "✅ Ajouté à votre calendrier !"
   - 🔄 Si déjà ajouté : "⚠️ Déjà dans votre calendrier"

---

### 4. Voir le Calendrier Personnel

1. Cliquer sur **"📅 Mon Calendrier"** dans le header
2. **Résultat attendu** :
   - 📅 Affichage de tous les films ajoutés
   - 🎞️ Cartes avec affiche, titre, cinéma, date, heure, version
   - 🗑️ Bouton "Supprimer" sur chaque carte

---

### 5. Supprimer une Séance du Calendrier

1. Sur **http://127.0.0.1:5000/my-calendar**
2. Cliquer sur **"Supprimer"** sous un film
3. **Résultat attendu** :
   - ✅ Message de succès : "Séance supprimée de votre calendrier"
   - ♻️ Rafraîchissement de la page
   - 🗑️ Film supprimé de la liste

---

### 6. Déconnexion (Logout)

1. Cliquer sur **"👋 Déconnexion"** dans le header
2. **Résultat attendu** :
   - ✅ Message info : "Vous êtes déconnecté"
   - ➡️ Redirection vers `/` (accueil)
   - 🔎 Header affiche "Se connecter" et "S'inscrire"
   - 🚫 Boutons ➕ sur les horaires ne sont plus visibles

---

## 🔒 Tests de Sécurité

### Test 1 : Accès au Calendrier sans Connexion

1. Déconnexion (si connecté)
2. Aller sur **http://127.0.0.1:5000/my-calendar**
3. **Résultat attendu** :
   - ❌ Redirection vers `/login?next=/my-calendar`
   - ⚠️ Message : "Veuillez vous connecter pour accéder à cette page"

### Test 2 : Email Unique

1. Créer un compte avec `test@example.com`
2. Essayer de créer un autre compte avec le même email
3. **Résultat attendu** :
   - ❌ Erreur de validation : "Cet email est déjà utilisé"

### Test 3 : Mot de Passe Trop Court

1. S'inscrire avec un mot de passe de moins de 6 caractères
2. **Résultat attendu** :
   - ❌ Erreur de validation : "Le mot de passe doit contenir au moins 6 caractères"

### Test 4 : Confirmation Mot de Passe Incorrecte

1. S'inscrire avec :
   - Mot de passe : `cinema123`
   - Confirmation : `cinema456`
2. **Résultat attendu** :
   - ❌ Erreur de validation : "Les mots de passe ne correspondent pas"

---

## 📊 Tests Fonctionnels

### Test 1 : Calendrier Vide

1. Se connecter avec un nouveau compte
2. Aller sur **Mon Calendrier**
3. **Résultat attendu** :
   - 🎬 Affichage de l'état vide avec message :
     "Votre calendrier est vide"
   - 🎯 Bouton "Parcourir les films"

### Test 2 : Ajouter Plusieurs Séances du Même Film

1. Ajouter le film "Venom" à 14h00
2. Ajouter le film "Venom" à 20h30
3. **Résultat attendu** :
   - ✅ Les deux séances sont ajoutées séparément
   - 📅 Affichage de 2 cartes pour "Venom" avec horaires différents

### Test 3 : Ajouter Même Séance Deux Fois

1. Ajouter "Venom" à 20h30 au CGR Celtic
2. Re-cliquer sur le bouton ➕ de la même séance
3. **Résultat attendu** :
   - ⚠️ Notification : "Déjà dans votre calendrier"
   - 🚫 Pas de doublon créé

### Test 4 : Filtrage par Date (Futur)

1. Ajouter des séances à différentes dates :
   - 2025-10-24
   - 2025-10-30
   - 2025-11-05
2. Vérifier l'affichage sur **Mon Calendrier**
3. **Résultat attendu** :
   - 📅 Affichage chronologique
   - 🔜 Séances futures en premier

---

## 🎨 Tests UI/UX

### Test 1 : Responsive Design

1. Ouvrir sur mobile (ou DevTools responsive mode)
2. Vérifier :
   - ✅ Header condensé (emojis au lieu de texte complet)
   - ✅ Boutons "Se connecter" / "S'inscrire" visibles
   - ✅ Calendrier lisible en grille
   - ✅ Notifications centrées

### Test 2 : Animations

1. Ajouter un film au calendrier
2. **Résultat attendu** :
   - ✨ Notification apparaît en slide-in depuis la droite
   - ⏱️ Disparaît après 3 secondes en fade-out

### Test 3 : Tailwind CSS Only

1. Inspecter le DOM avec DevTools
2. Vérifier qu'il n'y a **AUCUN** fichier CSS custom chargé
3. **Résultat attendu** :
   - ✅ Seulement Tailwind CDN
   - ❌ Pas de `<link rel="stylesheet" href="/static/css/custom.css">`

---

## 🐛 Tests de Bugs Potentiels

### Bug 1 : Session Expirée

1. Se connecter
2. Supprimer les cookies du navigateur
3. Rafraîchir la page
4. **Résultat attendu** :
   - 🔓 Retour à l'état déconnecté
   - 🚫 Boutons ➕ masqués

### Bug 2 : Token CSRF

1. Ouvrir la page de login
2. Inspecter le formulaire
3. **Résultat attendu** :
   - ✅ Présence d'un champ `csrf_token` caché
   - 🔒 Protection contre CSRF activée

### Bug 3 : SQL Injection (Sécurité)

1. Essayer de se connecter avec :
   - Email : `' OR 1=1 --`
   - Password : `anything`
2. **Résultat attendu** :
   - ❌ Connexion échoue
   - 🛡️ Aucune injection SQL possible (prepared statements)

---

## 📝 Checklist Finale

- [ ] ✅ Inscription fonctionne
- [ ] ✅ Connexion fonctionne
- [ ] ✅ Déconnexion fonctionne
- [ ] ✅ Ajout au calendrier fonctionne
- [ ] ✅ Suppression du calendrier fonctionne
- [ ] ✅ Protection des routes (@login_required)
- [ ] ✅ Validation des formulaires (email unique, password min 6)
- [ ] ✅ Messages flash affichés correctement
- [ ] ✅ Notifications JavaScript temporaires
- [ ] ✅ Responsive mobile
- [ ] ✅ PWA toujours fonctionnelle
- [ ] ✅ Pas de custom CSS (Tailwind only)
- [ ] ✅ Emojis dans les logs (🎬, ✅, ❌, etc.)
- [ ] ✅ Database SQLite avec indexes

---

## 🚀 Prochaines Améliorations Possibles

1. **Export iCal** : Exporter le calendrier au format `.ics`
2. **Notifications Push** : Rappel 1h avant la séance
3. **Partage** : Partager son calendrier avec des amis
4. **Notes** : Ajouter des notes sur chaque séance
5. **Favoris** : Marquer des cinémas favoris
6. **Filtres** : Filtrer le calendrier par cinéma/date
7. **Tri** : Trier par date, cinéma, film
8. **Recherche** : Chercher dans le calendrier
9. **Statistiques** : Films les plus ajoutés, cinéma préféré
10. **OAuth** : Connexion avec Google/Facebook

---

**Bon test ! 🎬✨**
