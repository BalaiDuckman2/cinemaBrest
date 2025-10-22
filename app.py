from flask import Flask, render_template, request, redirect, url_for
from datetime import timedelta
from dotenv import load_dotenv
from zoneinfo import ZoneInfo
from threading import Thread
from os import getenv
import html

load_dotenv()

# IMPORT DES MODULES
from modules.api import *
from modules.curl import *
from modules.database import db
import modules.monitoring as monitoring

print("🔍 Chargement des cinémas...")

try:
    theaters = [Theater(data["node"]) for data in
                requests.get("https://www.allocine.fr/_/localization_city/Brest", timeout=10).json()["values"]["theaters"]]
    
    theaters += [Theater(data["node"]) for data in 
                 requests.get("https://www.allocine.fr/_/localization_city/Landerneau", timeout=10).json()["values"]["theaters"]]
    
    print(f"✓ {len(theaters)} cinémas chargés")
except Exception as e:
    print(f"❌ Erreur lors du chargement des cinémas: {e}")
    print("⚠️  Vérifiez votre connexion internet")
    exit(1)

timezone = ZoneInfo(getenv("TIMEZONE"))

def translate_month(num: int) -> str:
    months = ["janv", "févr", "mars", "avr", "mai", "juin",
              "juil", "août", "sept", "oct", "nov", "déc"]
    return months[num - 1] if 1 <= num <= len(months) else "???"


def translate_day(weekday: int) -> str:
    days = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"]
    return days[weekday] if 0 <= weekday < len(days) else "???"


def getShowtimes(date):
    showtimes: list[Showtime] = []

    for theater in theaters:
        showtimes.extend(theater.getShowtimes(date))

    data = {}

    for showtime in showtimes:
        movie = showtime.movie
        theater = showtime.theater

        if showtime.movie.title not in data.keys():
            data[movie.title] = {
                "title": movie.title,
                "duree": movie.runtime,
                "genres": ", ".join(movie.genres),
                "casting": ", ".join(movie.cast),
                "realisateur": movie.director,
                "synopsis": html.unescape(movie.synopsis),
                "affiche": movie.affiche,
                "director": movie.director,
                "wantToSee": movie.wantToSee,
                "url": f"https://www.allocine.fr/film/fichefilm_gen_cfilm={movie.id}.html",
                "releaseYear": movie.releaseYear,
                "filmAge": movie.filmAge,
                "seances": {}
            }

        if theater.name not in data[movie.title]["seances"].keys():
            data[movie.title]["seances"][theater.name] = []

        data[movie.title]["seances"][theater.name].append(showtime.startsAt.strftime("%H:%M"))

    data = data.values()

    data = sorted(data, key=lambda x: x["wantToSee"], reverse=True)

    return data

# Cache mémoire pour les semaines complètes (ultra-rapide)
_week_cache = {}

def getShowtimesWeek(week_offset=0):
    """Récupère toutes les séances de la semaine en format tableau
    
    Args:
        week_offset: Décalage en semaines (0=semaine actuelle, 1=suivante, -1=précédente)
    """
    # Vérifier le cache de semaine d'abord (instantané!)
    cache_key = f"week_{week_offset}"
    if cache_key in _week_cache:
        return _week_cache[cache_key]
    
    showtimes_all: list[Showtime] = []

    # Récupérer toutes les séances des 7 jours avec le décalage de semaine
    base_date = datetime.now(timezone) + timedelta(weeks=week_offset)
    for i in range(0, 7):
        date = base_date + timedelta(days=i)
        for theater in theaters:
            showtimes_all.extend(theater.getShowtimes(date))

    data = {}

    for showtime in showtimes_all:
        movie = showtime.movie
        theater = showtime.theater
        
        # Index du jour (0-6) relatif au début de la semaine affichée
        day_index = (showtime.startsAt.date() - base_date.date()).days
        
        if showtime.movie.title not in data.keys():
            data[movie.title] = {
                "title": movie.title,
                "duree": movie.runtime,
                "genres": ", ".join(movie.genres),
                "casting": ", ".join(movie.cast),
                "realisateur": movie.director,
                "synopsis": html.unescape(movie.synopsis),
                "affiche": movie.affiche,
                "director": movie.director,
                "wantToSee": movie.wantToSee,
                "url": f"https://www.allocine.fr/film/fichefilm_gen_cfilm={movie.id}.html",
                "releaseYear": movie.releaseYear,
                "filmAge": movie.filmAge,
                "seances_table": {}  # Structure: {cinema_name: {day_index: [times]}}
            }

        # Initialiser le cinéma s'il n'existe pas
        if theater.name not in data[movie.title]["seances_table"]:
            data[movie.title]["seances_table"][theater.name] = {}
        
        # Initialiser le jour pour ce cinéma s'il n'existe pas
        if day_index not in data[movie.title]["seances_table"][theater.name]:
            data[movie.title]["seances_table"][theater.name][day_index] = []
        
        # Ajouter l'heure de séance
        data[movie.title]["seances_table"][theater.name][day_index].append(
            showtime.startsAt.strftime("%H:%M")
        )

    data = data.values()
    data = sorted(data, key=lambda x: x["wantToSee"], reverse=True)

    # Retourner aussi les dates de la semaine pour l'affichage
    week_dates = []
    for i in range(0, 7):
        day = base_date + timedelta(days=i)
        week_dates.append({
            "jour": translate_day(day.weekday()),
            "chiffre": day.day,
            "mois": translate_month(day.month),
            "index": i,
            "jour_complet": f"{translate_day(day.weekday())} {day.day}"
        })

    # Sauvegarder dans le cache de semaine pour accès instantané
    result = (data, week_dates)
    _week_cache[cache_key] = result
    
    return result

print("=" * 60)
print("🎬 Chargement des séances de cinéma avec base de données")
print("=" * 60)

# Nettoyer les anciennes séances de la BDD (plus de 1 jour)
deleted = db.delete_old_seances(days_to_keep=1)
if deleted > 0:
    print(f"🗑️  {deleted} anciennes séances supprimées de la BDD")

stats = db.get_stats()
print(f"📊 BDD: {stats['cinemas']} cinémas, {stats['films']} films, {stats['seances']} séances sur {stats['dates']} dates")
print()

# Chargement de la vue semaine au démarrage (pour préchauffer la BDD)
print("📅 Préchargement de la semaine actuelle...")
showtimes_week, week_dates_default = getShowtimesWeek(0)
print(f"✓ {len(showtimes_week)} films trouvés pour la semaine!")

# Afficher les stats finales de la BDD
stats = db.get_stats()
print(f"✓ BDD: {stats['seances']} séances sur {stats['dates']} dates")
print("=" * 60)
print()


app = Flask(__name__)

# Cache HTML pour rendu instantané
_html_cache = {}

@app.route('/healthcheck')
def healthcheck():
    return 'ok'

@app.route('/')
def home():
    min_age = request.args.get("age", default=0, type=int)
    week_offset = request.args.get("week", default=0, type=int)  # Décalage de semaine

    # Clé de cache HTML basée sur les paramètres
    html_cache_key = f"html_week{week_offset}_age{min_age}"
    
    # Vérifier le cache HTML (instantané !)
    if html_cache_key in _html_cache:
        return _html_cache[html_cache_key]

    useragent = request.headers.get('User-Agent')
    Thread(target=monitoring.log, kwargs={
        'ip': request.environ.get("HTTP_X_FORWARDED_FOR", request.remote_addr),
        'useragent': useragent,
        'day': 0
    }).start()

    # Toujours en vue semaine maintenant
    films_to_show, week_dates_display = getShowtimesWeek(week_offset)
    
    # Filtrage des films par âge minimal
    if min_age > 0:
        films_to_show = [f for f in films_to_show if f.get("filmAge") and f["filmAge"] >= min_age]

    if useragent.startswith("curl/"):
        return handle_curl(films_to_show, f"Semaine {week_offset}")

    # Calculer la période de la semaine pour l'affichage
    first_day = week_dates_display[0]
    last_day = week_dates_display[-1]
    if first_day['mois'] == last_day['mois']:
        week_period = f"{first_day['chiffre']}-{last_day['chiffre']} {last_day['mois']}"
    else:
        week_period = f"{first_day['chiffre']} {first_day['mois']} - {last_day['chiffre']} {last_day['mois']}"

    html_response = render_template('index.html',
                           films=films_to_show,
                           dates=week_dates_display,
                           min_age=min_age,
                           week_offset=week_offset,
                           week_period=week_period,
                           JAWG_API_KEY=getenv("JAWG_API_KEY"))
    
    # Sauvegarder le HTML dans le cache pour les prochaines requêtes
    _html_cache[html_cache_key] = html_response
    
    return html_response

if __name__ == '__main__':
    app.run(host=getenv("HOST"), port=getenv("PORT"))