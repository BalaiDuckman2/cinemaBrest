# 📱 PWA - Progressive Web App

## ✨ Fonctionnalités PWA Implémentées

Votre site **CinéBrest** est maintenant une PWA complète !

### 🎯 Avantages de la PWA

1. **📲 Installation sur mobile**
   - Ajoutez l'app à l'écran d'accueil
   - Lancez-la comme une app native
   - Expérience plein écran (sans barre d'adresse)

2. **⚡ Mode offline**
   - Fonctionne sans connexion internet
   - Cache intelligent des ressources
   - Données sauvegardées localement

3. **🚀 Performances**
   - Chargement ultra-rapide
   - Cache des assets statiques
   - Stratégie Network First

4. **🔔 Notifications (prêt)**
   - Architecture prête pour push notifications
   - Peut notifier des nouvelles séances

## 📁 Fichiers PWA

- **`static/manifest.json`** : Configuration PWA
- **`static/sw.js`** : Service Worker (cache & offline)
- **`templates/base.html`** : Meta tags PWA + bouton installation
- **`app.py`** : Routes `/manifest.json` et `/sw.js`

## 🔧 Installation

### Sur Android (Chrome/Edge)
1. Ouvrez le site
2. Cliquez sur le bouton "Installer l'app" dans le header
3. Ou menu ⋮ → "Installer l'application"

### Sur iOS (Safari)
1. Ouvrez le site
2. Appuyez sur le bouton Partager 
3. "Sur l'écran d'accueil"

### Sur Desktop (Chrome/Edge)
1. Icône ⊕ dans la barre d'adresse
2. "Installer CinéBrest"

## 🎨 Personnalisation

### Icônes
Remplacez les fichiers :
- `static/images/icon-192.png` (192x192)
- `static/images/icon-512.png` (512x512)

### Couleurs
Modifiez dans `manifest.json` :
```json
{
  "theme_color": "#6366f1",
  "background_color": "#1a1a2e"
}
```

### Cache
Ajustez la stratégie dans `static/sw.js` :
- **Network First** : Toujours frais, fallback cache
- **Cache First** : Ultra rapide, update en arrière-plan
- **Stale While Revalidate** : Rapide + mise à jour

## 🧪 Test

### Vérifier l'installation
1. Ouvrez DevTools (F12)
2. Onglet **Application**
3. Vérifiez :
   - ✅ Manifest
   - ✅ Service Workers
   - ✅ Cache Storage

### Test offline
1. Ouvrez DevTools
2. Network → **Offline**
3. Rechargez la page → doit fonctionner !

## 📊 Lighthouse Score

Testez votre PWA :
1. DevTools → Lighthouse
2. Sélectionnez "Progressive Web App"
3. Générer le rapport
4. Score idéal : 100/100 ✨

## 🚀 Déploiement

**Important** : La PWA nécessite **HTTPS** en production !

### Options
- ✅ Vercel / Netlify (HTTPS auto)
- ✅ Cloudflare Pages
- ✅ Nginx avec Let's Encrypt
- ❌ HTTP simple (ne marche pas)

## 🔐 Sécurité

- Service Worker **seulement sur HTTPS**
- Exception : `localhost` pour le dev
- Certificat SSL obligatoire en production

---

**Fait avec 💜 pour CinéBrest**
