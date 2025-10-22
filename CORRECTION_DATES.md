# 🗓️ Correction des Dates de Sortie des Films

## 🐛 Problème identifié

Les films affichaient **2025** comme année de sortie alors que beaucoup sont sortis il y a plusieurs années.

**Exemple** :
- Film sorti en 1999 → Affichait "2025"
- Film de 2010 → Affichait "2025"

## 🔍 Cause du problème

L'API AlloCiné retourne plusieurs dates dans le champ `releases[]` :
- **Released** : Sortie originale du film (ex: 1999)
- **Re-released** : Ressorties en salles (ex: 2025)
- **DVD** : Sortie DVD/Blu-ray
- Etc.

**Ancien code** (bugué) :
```python
release_date_str = data["releases"][0]["releaseDate"]["date"]
self.releaseYear = self.releaseDate.year
```

Le problème : prenait la **première** entrée du tableau, qui est souvent une ressortie récente.

## ✅ Solution implémentée

### Nouvelle stratégie à 2 niveaux

**Priorité 1 : `productionYear`** (le plus fiable)
```python
if data.get("productionYear"):
    self.releaseYear = int(data["productionYear"])
```

**Avantages** :
- Année de production réelle
- Pas affectée par les ressorties
- Directement fournie par l'API

**Priorité 2 : Chercher `"Released"` dans `releases[]`**
```python
for release in data["releases"]:
    if release.get("name") == "Released":
        # Utiliser cette date
```

**Avantages** :
- Cible spécifiquement la sortie originale
- Ignore les ressorties/rééditions
- Fallback si productionYear absent

**Priorité 3 : Premier élément** (dernier recours)
```python
if len(data["releases"]) > 0:
    release_date_str = data["releases"][0]["releaseDate"]["date"]
```

## 📊 Code complet

```python
# Date de sortie et calcul de l'âge du film
self.releaseDate = None
self.releaseYear = None
self.filmAge = None

# Priorité 1: Utiliser productionYear si disponible (plus fiable)
if data.get("productionYear"):
    try:
        self.releaseYear = int(data["productionYear"])
        self.filmAge = datetime.now().year - self.releaseYear
    except:
        pass

# Priorité 2: Chercher la sortie originale dans releases
if self.releaseYear is None and data.get("releases"):
    try:
        # Chercher la release avec name="Released" (sortie originale)
        for release in data["releases"]:
            if release.get("name") == "Released" and release.get("releaseDate", {}).get("date"):
                release_date_str = release["releaseDate"]["date"]
                self.releaseDate = datetime.fromisoformat(release_date_str)
                self.releaseYear = self.releaseDate.year
                self.filmAge = datetime.now().year - self.releaseYear
                break
        
        # Si pas de "Released", prendre le premier
        if self.releaseYear is None and len(data["releases"]) > 0:
            release_date_str = data["releases"][0]["releaseDate"]["date"]
            self.releaseDate = datetime.fromisoformat(release_date_str)
            self.releaseYear = self.releaseDate.year
            self.filmAge = datetime.now().year - self.releaseYear
    except:
        pass
```

## 🔄 Migration après correction

Après avoir corrigé le code, il faut **vider le cache** pour recharger avec les bonnes dates :

```bash
python clear_cache.py
```

Puis redémarrer l'application :
```bash
python app.py
```

## 📈 Résultats

### Avant
```
Film: Le Parrain
Année affichée: 2025
Âge calculé: 0 ans
Badge: 📅 Sortie : 2025
```

### Après
```
Film: Le Parrain
Année affichée: 1972
Âge calculé: 53 ans
Badge: 📅 Sortie : 1972
```

## 🎯 Cas particuliers gérés

### Film récent (2024-2025)
✅ Affiche correctement l'année
✅ Âge = 0 ou 1 an

### Film classique (< 2000)
✅ Utilise productionYear
✅ Calcul d'âge correct (20-100 ans)

### Film sans productionYear
✅ Cherche "Released" dans releases[]
✅ Fallback sur premier élément

### Film sans aucune date
✅ releaseYear = None
✅ Pas d'affichage d'année
✅ Pas de crash

## 🧪 Tests de validation

### Test 1 : Film ancien avec ressortie
```
Données API:
  productionYear: 1999
  releases[0]: {name: "Re-released", date: "2025-10-15"}
  releases[1]: {name: "Released", date: "1999-03-31"}

Résultat:
  ✓ releaseYear = 1999 (productionYear)
  ✓ filmAge = 26 ans
```

### Test 2 : Film récent
```
Données API:
  productionYear: 2024
  releases[0]: {name: "Released", date: "2024-05-22"}

Résultat:
  ✓ releaseYear = 2024
  ✓ filmAge = 1 an
```

### Test 3 : Film sans productionYear
```
Données API:
  productionYear: null
  releases[0]: {name: "Released", date: "2010-12-15"}

Résultat:
  ✓ releaseYear = 2010 (de releases)
  ✓ filmAge = 15 ans
```

## 🎬 Impact sur les filtres

Les filtres par âge fonctionnent maintenant correctement :

**Filtre "+50 ans"** :
- ❌ Avant : Aucun film (tous affichés comme 2025)
- ✅ Après : Films de 1975 et avant

**Filtre "+20 ans"** :
- ❌ Avant : Aucun film
- ✅ Après : Films de 2005 et avant

**Filtre "+5 ans"** :
- ❌ Avant : Quelques films aléatoires
- ✅ Après : Films de 2020 et avant

## 📝 Recommandations

### Pour les développeurs
1. Toujours vider le cache après modification de `api.py`
2. Tester avec différents types de films (récents, anciens, ressorties)
3. Vérifier les logs pour détecter les erreurs de parsing

### Pour les utilisateurs
1. Si les dates semblent incorrectes : `python clear_cache.py`
2. Utiliser les filtres par âge pour trouver les classiques
3. Le badge de sortie confirme la date affichée

---

**✅ Les dates de sortie sont maintenant correctes et fiables !**
