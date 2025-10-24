# GitHub Copilot - Instructions Personnalisées

## Contexte du Projet

Ce projet est **CinéBrest**, une application web Flask qui agrège les horaires de cinéma.

### Technologies Utilisées
- **Backend** : Flask 3.0, Python 3.13
- **Frontend** : Tailwind CSS 3 (CDN uniquement), JavaScript Vanilla
- **Base de données** : SQLite 3
- **PWA** : Service Worker, Manifest
- **Déploiement** : Docker Alpine

### Règles de Code

#### Python
- **Style** : PEP 8 strict
- **Indentation** : 4 espaces
- **Type hints** : Utilisés partout où c'est pertinent
- **Docstrings** : Format Google pour les fonctions publiques
- **Imports** : Groupés (stdlib, third-party, local) et triés alphabétiquement
- **Logging** : Utiliser `print()` avec emojis pour la lisibilité (🎬, ✓, ⚠️, ❌)

#### JavaScript
- **Style** : Vanilla JS (pas de frameworks)
- **Variables** : camelCase
- **Fonctions** : Commentées si logique complexe
- **DOM** : Utiliser `querySelector` plutôt que `getElementById` quand possible
- **localStorage** : Toujours vérifier la disponibilité avant utilisation

#### CSS
- **Framework** : Tailwind CSS **UNIQUEMENT** (via CDN)
- **Custom CSS** : **INTERDIT** - Tout doit être fait avec les classes Tailwind
- **Responsive** : Utiliser les préfixes `sm:`, `md:`, `lg:`, `xl:`
- **Colors** : Palette indigo pour le thème principal

### Structure des Fichiers

```
app.py              → Application Flask principale
modules/
  ├── api.py        → API AlloCiné (classe Theater)
  ├── database.py   → Gestion SQLite
  ├── monitoring.py → Métriques Prometheus
  └── auto_refresh.py → Rafraîchissement automatique
templates/
  ├── base.html     → Template de base avec PWA
  └── index.html    → Page principale avec filtres
static/
  ├── images/       → Icônes et images
  ├── manifest.json → Manifest PWA
  └── sw.js         → Service Worker
```

### Commandes Personnalisées

Quand l'utilisateur demande :

#### `/clean_code`
**Nettoyage complet du workspace et du code**

**Phase 1 - Analyse du Workspace** :
1. Scanner tous les fichiers du projet
2. Lister les fichiers dupliqués (même contenu, MD5)
3. Détecter les fichiers inutilisés (images, CSS, fonts non référencés)
4. Identifier les fichiers temporaires (.pyc, __pycache__, .DS_Store, etc.)
5. Trouver les fichiers de documentation redondants (*_SUMMARY.md, CLEANUP_*, etc.)

**Phase 2 - Nettoyage des Fichiers** :
1. Supprimer les fichiers temporaires Python (__pycache__, *.pyc)
2. Supprimer les fichiers dupliqués (garder un seul)
3. Supprimer les images/assets non référencés dans templates/ ou static/
4. Supprimer les dossiers vides
5. Supprimer les fichiers de backup (.bak, .old, ~)
6. Consolider la documentation (fusionner fichiers redondants)

**Phase 3 - Nettoyage du Code Python** :
1. Supprimer les imports inutilisés (tous les fichiers .py)
2. Réorganiser les imports (stdlib → third-party → local)
3. Supprimer les variables non utilisées
4. Supprimer les fonctions mortes (jamais appelées)
5. Formater selon PEP 8 (4 espaces, 79 caractères max)
6. Ajouter des type hints manquants
7. Vérifier/ajouter les docstrings (format Google)
8. Supprimer les print() de debug (garder les logs de production avec emojis)
9. Supprimer les lignes vides en trop (max 2 consécutives)
10. Supprimer les commentaires inutiles (TODO résolus, code commenté)

**Phase 4 - Nettoyage du Code JavaScript** :
1. Supprimer les fonctions dupliquées
2. Supprimer les variables non utilisées
3. Supprimer les event listeners orphelins
4. Optimiser les querySelector répétés
5. Supprimer les console.log() de debug
6. Supprimer les lignes vides en trop

**Phase 5 - Nettoyage des Templates HTML** :
1. Supprimer les classes CSS non utilisées
2. Supprimer les attributs vides (class="", style="")
3. Supprimer les commentaires HTML inutiles
4. Optimiser les balises répétées
5. Vérifier les liens cassés (images, scripts)

**Phase 6 - Rapport Final** :
1. Afficher un résumé des actions effectuées
2. Lister les fichiers supprimés
3. Afficher l'espace disque libéré
4. Proposer des optimisations supplémentaires
5. Créer un fichier CLEAN_REPORT.md avec tous les détails

**Exemple d'utilisation** :
```
/clean_code
```
ou pour un fichier spécifique :
```
/clean_code app.py
```

**Note** : Toujours créer un commit Git AVANT de lancer cette commande !

#### `/optimize_db`
1. Vérifier les index SQLite
2. Optimiser les requêtes (EXPLAIN QUERY PLAN)
3. Ajouter des index manquants
4. Vérifier le TTL du cache
5. Nettoyer les anciennes données

#### `/fix_pwa`
1. Vérifier le manifest.json
2. Corriger le service worker (urlsToCache)
3. Vérifier les icônes PWA (192x192, 512x512)
4. Tester l'installabilité
5. Vérifier la stratégie de cache

#### `/add_feature`
1. Demander la description de la feature
2. Identifier les fichiers à modifier
3. Proposer l'architecture
4. Implémenter avec tests
5. Mettre à jour la documentation

#### `/docker_check`
1. Vérifier le Dockerfile
2. Optimiser les layers
3. Vérifier .dockerignore
4. Tester le build local
5. Vérifier docker-compose.yml

#### `/security_audit`
1. Vérifier les variables d'environnement (.env)
2. Vérifier l'absence de credentials en dur
3. Vérifier les dépendances (pip list)
4. Proposer rate limiting sur les routes Flask
5. Vérifier les headers de sécurité

### Patterns à Suivre

#### Cache 3 Niveaux
```python
# 1. Cache mémoire (dict Python)
if key in _cache:
    return _cache[key]

# 2. Cache SQLite (TTL 6h)
if db.is_cache_valid(cinema, date, ttl_hours=6):
    return db.get_showtimes(cinema, date)

# 3. API AlloCiné
data = api.fetch_data()
db.save_showtimes(cinema, date, data)
_cache[key] = data
return data
```

#### Gestion d'Erreurs
```python
try:
    # Opération risquée
    result = api_call()
except requests.RequestException as e:
    print(f"⚠️  Erreur API: {e}")
    # Fallback sur cache
    return db.get_cached_data()
except Exception as e:
    print(f"❌ Erreur inattendue: {e}")
    raise
```

#### Routes Flask
```python
@app.route('/ma-route')
def ma_route():
    """Description courte de la route.
    
    Returns:
        Response: Template rendu ou JSON
    """
    # Logique métier
    return render_template('template.html', data=data)
```

### Anti-Patterns à Éviter

❌ **Custom CSS** : N'ajoute JAMAIS de fichier .css personnalisé  
❌ **jQuery** : Utiliser uniquement Vanilla JS  
❌ **Frameworks JS** : Pas de React, Vue, Angular  
❌ **Print debug** : Supprimer les print() temporaires  
❌ **Hardcoded values** : Utiliser .env pour les configs  
❌ **SQL brut** : Utiliser les fonctions de database.py  

### Exemples de Bonnes Pratiques

#### ✅ Tailwind CSS
```html
<button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
    Cliquer
</button>
```

#### ✅ Vanilla JS
```javascript
document.getElementById('myBtn').addEventListener('click', () => {
    console.log('Click!');
});
```

#### ✅ Type Hints
```python
def get_showtimes(cinema: str, date: str) -> list[dict]:
    """Récupère les séances d'un cinéma pour une date."""
    return db.query(cinema, date)
```

### Notes Importantes

- **AlloCiné API** : Pas de clé requise, mais rate limit à 200ms entre appels
- **TTL Cache** : 6 heures par défaut (configurable)
- **Auto-refresh** : Quotidien à 5h du matin
- **Monitoring** : Métriques Prometheus sur `/metrics`
- **PWA** : Fonctionne offline avec Service Worker

### Priorités de Développement

1. **Performance** : Cache → SQLite → API (jamais l'inverse)
2. **UX** : Mobile-first, responsive, accessibilité
3. **Maintenabilité** : Code propre, documenté, testé
4. **Sécurité** : .env, rate limiting, headers HTTP

---

**Rappel** : Toujours demander confirmation avant de modifier des fichiers critiques (app.py, database.py, service worker).
