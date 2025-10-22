from datetime import datetime
import requests
import time
from .database import db

# Cache mémoire ultra-rapide pour éviter les requêtes BDD répétées
_memory_cache = {}

def _get_cache_key(cinema_id: str, date_str: str) -> str:
    return f"{cinema_id}:{date_str}"

class Movie:
    def __init__(self, data) -> None:
        self.data = data
        self.title = data["title"]
        self.id = data['internalId']
        self.allocineId = data['internalId']  # Alias pour la BDD
        self.runtime = data["runtime"]
        self.synopsis = data["synopsis"]
        self.genres = [genre['translate'] for genre in data["genres"]]
        self.wantToSee = data['stats']["wantToSeeCount"]
        try:
            self.affiche = data["poster"]["url"]
            self.poster = data["poster"]["url"]  # Alias pour la BDD
        except:
            self.affiche = "/static/images/nocontent.png"
            self.poster = "/static/images/nocontent.png"
            
        self.cast = []

        # Noms des acteurs
        for actor in data["cast"]["edges"]:
            if actor["node"]["actor"] == None: continue

            if actor["node"]["actor"]["lastName"] == None:
                actor["node"]["actor"]["lastName"] = ""
                
            if actor["node"]["actor"]["firstName"] == None:
                actor["node"]["actor"]["firstName"] = ""

            name = f'{actor["node"]["actor"]["firstName"]} {actor["node"]["actor"]["lastName"]}'
            name = name.lstrip()
            self.cast.append(name)

        # Nom du réalisateur
        if len(data["credits"]) == 0:
            self.director = "Inconnu"
        else:
            if data["credits"][0]["person"]["lastName"] == None:
                data["credits"][0]["person"]["lastName"] = ""
                
            if data["credits"][0]["person"]["firstName"] == None:
                data["credits"][0]["person"]["firstName"] = ""

            self.director = f'{data["credits"][0]["person"]["firstName"]} {data["credits"][0]["person"]["lastName"]}'
            self.director = self.director.lstrip()
        
        # Date de sortie et calcul de l'âge du film
        self.releaseDate = None
        self.releaseYear = None
        self.productionYear = None
        self.filmAge = None
        
        # Priorité 1: Utiliser productionYear si disponible (le plus fiable)
        if data.get("productionYear"):
            try:
                self.productionYear = int(data["productionYear"])
                self.releaseYear = self.productionYear
                self.filmAge = datetime.now().year - self.releaseYear
            except:
                pass
        
        # Priorité 2: Chercher dans les releases la date "Released" (sortie cinéma)
        if self.releaseYear is None and "releases" in data and data["releases"]:
            for release in data["releases"]:
                if release and release.get("name") == "Released":
                    release_date_dict = release.get("releaseDate")
                    if release_date_dict and isinstance(release_date_dict, dict) and release_date_dict.get("date"):
                        release_date_str = release_date_dict["date"]
                        try:
                            release_date = datetime.fromisoformat(release_date_str)
                            self.releaseYear = release_date.year
                            self.filmAge = datetime.now().year - self.releaseYear
                            break
                        except:
                            pass
        
        # Valeurs par défaut si rien n'a été trouvé
        if self.productionYear is None:
            self.productionYear = self.releaseYear if self.releaseYear else datetime.now().year
        if self.releaseYear is None:
            self.releaseYear = datetime.now().year
        if self.filmAge is None:
            self.filmAge = 0

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.title}>"

class Showtime:
    def __init__(self, data, theather, movie:Movie) -> None:
        self.startsAt = datetime.fromisoformat(data['startsAt'])
        self.diffusionVersion = data['diffusionVersion']
        self.services = data["service"]
        self.theater:Theater = theather
        self.movie = movie

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.movie.title} startsAt={self.startsAt}>"

class Theater:
    def __init__(self, data) -> None:
        self.name = data['name']
        self.id = data['internalId']
        self.location = data['location']

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__} name={self.name}>"

    def getShowtimes(self, date: datetime, page: int = 1, showtimes: list = None, use_db: bool = True, force_refresh: bool = False) -> list[Showtime]:
        """
        Récupère les séances pour un cinéma à une date donnée
        
        Args:
            date: Date des séances
            page: Page de pagination (usage interne)
            showtimes: Liste des séances (usage interne pour récursion)
            use_db: Utiliser la base de données (True par défaut)
            force_refresh: Forcer le rechargement depuis l'API
            
        Returns:
            Liste des séances
        """
        if showtimes is None:
            showtimes = []
        
        datestr = date.strftime("%Y-%m-%d")
        cache_key = _get_cache_key(self.id, datestr)
        
        # 1. Vérifier le cache MÉMOIRE ultra-rapide (première page seulement)
        if page == 1 and use_db and not force_refresh:
            if cache_key in _memory_cache:
                print(f"⚡ Cache mémoire pour {self.name} - {datestr}")
                return _memory_cache[cache_key]
        
        # 2. Vérifier la base de données (première page seulement)
        if page == 1 and use_db and not force_refresh:
            # Vérifier si les données doivent être rafraîchies (6h de validité)
            if not db.should_refresh(self.id, datestr, max_age_hours=6):
                print(f"✓ BDD hit pour {self.name} - {datestr}")
                # Charger depuis la base de données
                db_seances = db.get_seances_by_date(self.id, datestr)
                
                # Reconstruire les objets Python (optimisé avec cache de films)
                films_cache = {}  # Cache local pour éviter de recréer les mêmes films
                for seance_data in db_seances:
                    film_id = seance_data['film']['allocine_id']
                    
                    # Réutiliser le film si déjà créé
                    if film_id not in films_cache:
                        movie = Movie(seance_data['film']['data'])
                        movie.allocineId = seance_data['film']['allocine_id']
                        movie.title = seance_data['film']['title']
                        movie.poster = seance_data['film']['poster_url']
                        movie.releaseYear = seance_data['film']['release_year']
                        movie.productionYear = seance_data['film']['production_year']
                        movie.filmAge = seance_data['film']['film_age']
                        films_cache[film_id] = movie
                    
                    showtime_obj = Showtime.__new__(Showtime)
                    showtime_obj.startsAt = datetime.fromisoformat(seance_data['starts_at'])
                    showtime_obj.diffusionVersion = seance_data['diffusion_version']
                    showtime_obj.services = seance_data['services']
                    showtime_obj.theater = self
                    showtime_obj.movie = films_cache[film_id]
                    
                    showtimes.append(showtime_obj)
                
                # Sauvegarder dans le cache mémoire pour les prochaines requêtes
                _memory_cache[cache_key] = showtimes
                return showtimes
        
        # Pas de données en BDD ou données expirées, faire la requête API
        if page == 1:
            print(f"⟳ API call pour {self.name} - {datestr}")
            # Sauvegarder le cinéma dans la BDD si ce n'est pas déjà fait
            db.save_cinema(self.id, self.name, self.location)
        
        # Petit délai pour éviter le rate limiting de Cloudflare
        time.sleep(0.3)
        
        r = requests.get(f"https://www.allocine.fr/_/showtimes/theater-{self.id}/d-{datestr}/p-{page}/")
        
        # Gérer le rate limiting (429)
        if r.status_code == 429:
            print(f"⚠️  Rate limit atteint pour {self.name} - {datestr}")
            return showtimes if showtimes else []
        
        if r.status_code != 200:
            raise Exception(f"Error: {r.status_code} - {r.content}")
        
        try:
            data = r.json()
        except Exception as e:
            raise Exception(f"Can't parse JSON: {str(e)} - {r.content}")
        
        if data["message"] == "no.showtime.error":
            return []
        
        if data["message"] == "next.showtime.on":
            return []

        if data.get('error'):
            raise Exception(f"API Error: {data}")
        
        for movie in data['results']:
            inst = Movie(movie["movie"])
            # Récupération de toutes les versions disponibles (l'API a changé)
            movie_showtimes = []
            for key in movie["showtimes"].keys():
                movie_showtimes.extend(movie["showtimes"].get(key, []))

            for showtime_data in movie_showtimes:
                showtimes.append(Showtime(showtime_data, self, inst))
        
        # Gérer la pagination
        if int(data['pagination']['page']) < int(data['pagination']["totalPages"]):
            # Pagination : continuer avec use_db=False pour ne pas re-sauvegarder
            return self.getShowtimes(date, page + 1, showtimes, use_db=False)
        
        # Sauvegarder dans la base de données (après pagination complète)
        if use_db and page == 1:
            try:
                for showtime in showtimes:
                    # Sauvegarder le film
                    film_id = db.save_film(
                        allocine_id=showtime.movie.allocineId,
                        title=showtime.movie.title,
                        poster_url=showtime.movie.poster,
                        release_year=showtime.movie.releaseYear,
                        production_year=showtime.movie.productionYear,
                        film_age=showtime.movie.filmAge,
                        data=showtime.movie.data
                    )
                    
                    # Sauvegarder la séance
                    db.save_seance(
                        cinema_id=self.id,
                        film_id=film_id,
                        starts_at=showtime.startsAt,
                        date_str=datestr,
                        diffusion_version=showtime.diffusionVersion,
                        services=showtime.services
                    )
                
                print(f"💾 Sauvegardé {len(showtimes)} séances pour {self.name} - {datestr}")
                
                # Sauvegarder AUSSI dans le cache mémoire pour accès ultra-rapide
                _memory_cache[cache_key] = showtimes
                
            except Exception as e:
                print(f"⚠️  Erreur BDD pour {self.name}: {e}")
        
        return showtimes
    
    @staticmethod
    def new(query:str):
        r = requests.get(f"https://www.allocine.fr/_/localization_city/{query}")

        try:
            data = r.json()
        except:
            return {"error": True, "message": "Can't parse JSON", "content": r.content}

        if len(data["values"]["theaters"]) == 0:
            return {"error": True, "message": "Not found", "content": r.content}
        
        return Theater(data["values"]["theaters"][0]["node"])

if __name__ == "__main__":
    cgr = Theater.new("CGR Brest Le Celtic")
    print(f"{cgr.name} ({cgr.id})")
    print(f"{cgr.location['zip']} {cgr.location['city']}")

    showtimes = cgr.getShowtimes(datetime.today())

    print(showtimes[0])