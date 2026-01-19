from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, make_response
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_compress import Compress
from flask_talisman import Talisman
from datetime import timedelta
from dotenv import load_dotenv
from zoneinfo import ZoneInfo
from threading import Thread
from os import getenv
from functools import wraps
import html
import secrets

load_dotenv()

# IMPORT DES MODULES
from modules.api import *
from modules.curl import *
from modules.database import db
from modules.auto_refresh import AutoRefresh
from modules.auth import User, bcrypt
from modules.forms import LoginForm, RegisterForm
import modules.monitoring as monitoring

print("🔍 Chargement des cinémas...")

try:
    theaters = [Theater(data["node"]) for data in
                requests.get("https://www.allocine.fr/_/localization_city/Brest", timeout=10).json()["values"]["theaters"]]
    
    theaters += [Theater(data["node"]) for data in
                 requests.get("https://www.allocine.fr/_/localization_city/Landerneau", timeout=10).json()["values"]["theaters"]]

    theaters += [Theater(data["node"]) for data in
                 requests.get("https://www.allocine.fr/_/localization_city/Lannion", timeout=10).json()["values"]["theaters"]]

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


def generate_letterboxd_url(title: str, year: int = None) -> str:
    """Génère une URL Letterboxd pour un film

    Args:
        title: Titre du film
        year: Année de sortie (optionnel, pour affiner la recherche)

    Returns:
        URL de recherche Letterboxd
    """
    import urllib.parse

    # Nettoyer le titre pour l'URL
    # Remplacer les espaces par des tirets, enlever les caractères spéciaux
    clean_title = title.lower()
    clean_title = clean_title.replace("'", "")
    clean_title = clean_title.replace("'", "")
    clean_title = clean_title.replace(":", "")
    clean_title = clean_title.replace(".", "")
    clean_title = clean_title.replace(",", "")
    clean_title = clean_title.replace("!", "")
    clean_title = clean_title.replace("?", "")
    clean_title = clean_title.replace("é", "e").replace("è", "e").replace("ê", "e")
    clean_title = clean_title.replace("à", "a").replace("â", "a")
    clean_title = clean_title.replace("ô", "o")
    clean_title = clean_title.replace("ù", "u").replace("û", "u")
    clean_title = clean_title.replace("ç", "c")
    clean_title = clean_title.replace("  ", " ")
    clean_title = clean_title.strip()

    # URL encode pour gérer les espaces et caractères spéciaux
    encoded_title = urllib.parse.quote(clean_title)

    # Format Letterboxd : https://letterboxd.com/search/films/{titre}/
    return f"https://letterboxd.com/search/films/{encoded_title}/"


# Cache mémoire pour les semaines complètes (ultra-rapide)
_week_cache = {}
# NOTE: Vider le cache en redémarrant l'application si les versions ne s'affichent pas correctement

def getShowtimesWeek(week_offset=0):
    """Récupère toutes les séances de la semaine en format tableau

    Args:
        week_offset: Décalage en semaines (0=semaine actuelle, 1=suivante, -1=précédente)
    """
    # Vérifier le cache de semaine d'abord (instantané!)
    # Inclure la date actuelle dans la clé pour invalider le cache à minuit
    current_date = datetime.now(timezone).date()
    cache_key = f"week_{week_offset}_date_{current_date}"
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
                "url": generate_letterboxd_url(movie.title, movie.releaseYear),
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
        
        # Filtrer les séances passées pour aujourd'hui uniquement
        current_datetime = datetime.now(timezone)
        
        # S'assurer que startsAt a une timezone
        showtime_dt = showtime.startsAt
        if showtime_dt.tzinfo is None:
            showtime_dt = showtime_dt.replace(tzinfo=timezone)
        
        # Créer l'objet séance avec horaire et version
        # Traduire les versions AlloCiné en français
        version_map = {
            "DUBBED": "VF",
            "ORIGINAL": "VO",
            "LOCAL_LANGUAGE": "VF",
            "LOCAL": "VF"  # Parfois AlloCiné renvoie "local" en minuscules
        }
        # Normaliser en uppercase pour éviter les problèmes de casse
        raw_version = showtime.diffusionVersion.upper() if showtime.diffusionVersion else ""
        version = version_map.get(raw_version, showtime.diffusionVersion)
        
        showtime_info = {
            "time": showtime.startsAt.strftime("%H:%M"),
            "version": version  # VF, VO, VOST, etc.
        }
        
        if showtime_dt.date() == current_datetime.date():
            # Ne garder que les séances futures
            if showtime_dt > current_datetime:
                data[movie.title]["seances_table"][theater.name][day_index].append(showtime_info)
        else:
            # Pour les autres jours, afficher toutes les séances
            data[movie.title]["seances_table"][theater.name][day_index].append(showtime_info)

    # Calculer le nombre total de séances pour chaque film
    for movie_data in data.values():
        total_showtimes = 0
        for cinema_data in movie_data["seances_table"].values():
            for day_times in cinema_data.values():
                total_showtimes += len(day_times)
        movie_data["total_showtimes"] = total_showtimes

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
            "date": day.strftime("%Y-%m-%d"),  # Format YYYY-MM-DD pour le calendrier
            "jour_complet": f"{translate_day(day.weekday())} {day.day}"
        })

    # Sauvegarder dans le cache de semaine pour accès instantané
    result = (data, week_dates)
    _week_cache[cache_key] = result
    
    return result

print("=" * 60)
print("🎬 Chargement des séances de cinéma avec base de données")
print("=" * 60)

# Nettoyer les anciennes séances de la BDD (plus de 60 jours = 2 mois)
deleted = db.delete_old_seances(days_to_keep=60)
if deleted > 0:
    print(f"🗑️  {deleted} anciennes séances supprimées de la BDD")

stats = db.get_stats()
print(f"📊 BDD: {stats['cinemas']} cinémas, {stats['films']} films, {stats['seances']} séances sur {stats['dates']} dates")
print()

# Chargement initial (2 premiers mois au démarrage)
# Désactivé en mode debug pour démarrage rapide
SKIP_PRELOAD = getenv("SKIP_PRELOAD", "false").lower() == "true"

if not SKIP_PRELOAD:
    print("📅 Préchargement des 2 prochains mois (60 jours)...")
    print("⏳ Cela peut prendre quelques minutes lors du premier démarrage...")
    print("💡 Conseil : Ajoutez SKIP_PRELOAD=true dans .env pour tests rapides")

    # Précharger les 8 prochaines semaines
    for week in range(8):
        try:
            showtimes_week, _ = getShowtimesWeek(week)
            print(f"✓ Semaine +{week}: {len(showtimes_week)} films chargés")
        except Exception as e:
            print(f"⚠️  Erreur semaine +{week}: {e}")

    # Afficher les stats finales de la BDD
    stats = db.get_stats()
    print(f"✓ BDD finale: {stats['seances']} séances sur {stats['dates']} dates")
else:
    print("⚡ Mode développement : Préchargement désactivé (démarrage rapide)")
    print("💡 Les données seront chargées à la demande")

print("=" * 60)
print()


app = Flask(__name__)
app.config['SECRET_KEY'] = getenv('SECRET_KEY', secrets.token_hex(32))

# ═══════════════════════════════════════════════════════════
# 🔒 CONFIGURATION PRODUCTION - SÉCURITÉ & PERFORMANCE
# ═══════════════════════════════════════════════════════════

# 1. Compression Gzip (réduit la taille des réponses de 70-80%)
Compress(app)

# 2. Rate Limiting (protection contre les abus)
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# 3. Headers de sécurité HTTPS (Flask-Talisman)
# Désactivé en développement, activé automatiquement en production via FORCE_HTTPS
if getenv('FORCE_HTTPS', 'false').lower() == 'true':
    csp = {
        'default-src': "'self'",
        'script-src': [
            "'self'",
            "'unsafe-inline'",  # Nécessaire pour Tailwind CDN et scripts inline
            "https://cdn.tailwindcss.com",
            "https://cdn.jsdelivr.net",
        ],
        'style-src': [
            "'self'",
            "'unsafe-inline'",  # Nécessaire pour Tailwind
            "https://cdn.tailwindcss.com",
        ],
        'img-src': [
            "'self'",
            "data:",  # Pour les images base64
            "https://fr.web.img6.acsta.net",  # AlloCiné posters
        ],
        'font-src': ["'self'", "data:"],
        'connect-src': ["'self'"],
    }
    
    Talisman(
        app,
        force_https=True,
        strict_transport_security=True,
        content_security_policy=csp,
        content_security_policy_nonce_in=['script-src'],
    )
    print("🔒 Mode HTTPS activé (Flask-Talisman)")
else:
    print("⚠️  Mode développement (HTTPS désactivé)")

# Décorateur pour désactiver le cache navigateur
def no_cache(view):
    """Désactive le cache HTTP pour éviter les problèmes après login/logout."""
    @wraps(view)
    def no_cache_wrapper(*args, **kwargs):
        response = make_response(view(*args, **kwargs))
        response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'
        return response
    return no_cache_wrapper

# Configuration Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'
login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page'
login_manager.login_message_category = 'info'

# Initialiser Bcrypt
bcrypt.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    """Charge un utilisateur depuis la BDD pour Flask-Login."""
    user_data = db.get_user_by_id(int(user_id))
    if user_data:
        return User(user_data['id'], user_data['email'], user_data.get('name'))
    return None

# Cache HTML pour rendu instantané
_html_cache = {}

@app.route('/healthcheck')
@limiter.exempt  # Pas de rate limiting pour le healthcheck
def healthcheck():
    return 'ok'

# ============ ROUTES D'AUTHENTIFICATION ============

@app.route('/register', methods=['GET', 'POST'])
@limiter.limit("5 per hour")  # 🔒 Protection contre les créations de comptes abusives
def register():
    """Page d'inscription."""
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = RegisterForm()
    
    if form.validate_on_submit():
        # Créer le hash du mot de passe
        password_hash = User.hash_password(form.password.data)
        
        # Créer l'utilisateur
        user_id = db.create_user(
            email=form.email.data,
            password_hash=password_hash,
            name=form.name.data or None
        )
        
        if user_id:
            flash('Compte créé avec succès ! Vous pouvez maintenant vous connecter.', 'success')
            return redirect(url_for('login'))
        else:
            flash('Erreur lors de la création du compte', 'error')
    
    return render_template('register.html', form=form)

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("10 per minute")  # 🔒 Protection contre les tentatives de brute-force
@no_cache
def login():
    """Page de connexion."""
    if current_user.is_authenticated:
        return redirect(url_for('home'))
    
    form = LoginForm()
    
    if form.validate_on_submit():
        # Récupérer l'utilisateur
        user_data = db.get_user_by_email(form.email.data)
        
        if user_data and User.check_password(form.password.data, user_data['password_hash']):
            # Créer l'objet User et connecter
            user = User(user_data['id'], user_data['email'], user_data.get('name'))
            login_user(user, remember=form.remember.data)
            
            # Mettre à jour la dernière connexion
            db.update_last_login(user.id)
            
            flash(f'Bienvenue {user.name} ! 🎬', 'success')
            
            # Rediriger vers la page demandée ou l'accueil
            next_page = request.args.get('next')
            return redirect(next_page) if next_page else redirect(url_for('home'))
        else:
            flash('Email ou mot de passe incorrect', 'error')
    
    return render_template('login.html', form=form)

@app.route('/logout')
@login_required
@no_cache
def logout():
    """Déconnexion de l'utilisateur."""
    logout_user()
    flash('Vous êtes déconnecté. À bientôt ! 👋', 'success')
    return redirect(url_for('home'))

# ============ ROUTES DU CALENDRIER ============

@app.route('/my-calendar')
@login_required
@no_cache
def my_calendar():
    """Page du calendrier personnel de l'utilisateur."""
    watchlist = db.get_user_watchlist(current_user.id)
    return render_template('calendar.html', watchlist=watchlist)

@app.route('/add-to-calendar', methods=['POST'])
@limiter.limit("30 per minute")  # 🔒 Protection contre l'ajout massif de séances
@login_required
def add_to_calendar():
    """Ajoute une séance au calendrier."""
    film_title = request.form.get('film_title')
    cinema = request.form.get('cinema')
    showtime_date = request.form.get('showtime_date')
    showtime_time = request.form.get('showtime_time')
    film_url = request.form.get('film_url')
    film_poster = request.form.get('film_poster')
    showtime_version = request.form.get('showtime_version')
    
    # Vérifier si déjà ajouté
    if db.is_in_watchlist(current_user.id, film_title, cinema, showtime_date, showtime_time):
        return jsonify({'success': False, 'message': 'Déjà dans votre calendrier'})
    
    # Ajouter au calendrier
    db.add_to_watchlist(
        user_id=current_user.id,
        film_title=film_title,
        cinema=cinema,
        showtime_date=showtime_date,
        showtime_time=showtime_time,
        film_url=film_url,
        film_poster=film_poster,
        showtime_version=showtime_version
    )
    
    return jsonify({'success': True, 'message': 'Ajouté à votre calendrier !'})

@app.route('/remove-from-calendar/<int:watchlist_id>', methods=['POST'])
@login_required
def remove_from_calendar(watchlist_id):
    """Supprime une séance du calendrier."""
    success = db.remove_from_watchlist(watchlist_id, current_user.id)
    
    # Si appelé depuis la page calendrier (formulaire), rediriger
    # Si appelé depuis AJAX (page d'accueil), retourner JSON
    if request.form.get('redirect') == 'calendar':
        if success:
            flash('Séance supprimée de votre calendrier', 'success')
        else:
            flash('Erreur lors de la suppression', 'error')
        return redirect(url_for('my_calendar'))
    else:
        # Réponse JSON pour AJAX
        if success:
            return jsonify({'success': True, 'message': 'Séance supprimée'}), 200
        else:
            return jsonify({'success': False, 'message': 'Erreur lors de la suppression'}), 400

@app.route('/api/my-watchlist')
@login_required
def api_my_watchlist():
    """API pour récupérer la watchlist de l'utilisateur (pour coloration des horaires)."""
    watchlist = db.get_user_watchlist(current_user.id)
    # Retourner les clés nécessaires pour identifier et supprimer les séances
    simplified = [{
        'id': item['id'],  # IMPORTANT pour la suppression
        'film_title': item['film_title'],
        'cinema': item['cinema'],
        'showtime_date': item['showtime_date'],
        'showtime_time': item['showtime_time']
    } for item in watchlist]
    return jsonify(simplified)

# ============ ROUTES EXISTANTES ============

@app.route('/manifest.json')
def manifest():
    """Servir le manifest PWA"""
    return app.send_static_file('manifest.json')

@app.route('/sw.js')
def service_worker():
    """Servir le Service Worker"""
    return app.send_static_file('sw.js')

@app.route('/api/films')
@limiter.limit("60 per minute")
def api_films():
    """API pour récupérer les films d'une semaine en JSON (pour chargement dynamique)"""
    min_age = request.args.get("age", default=0, type=int)
    week_offset = request.args.get("week", default=0, type=int)
    
    # Récupérer les données de la semaine
    films_to_show, week_dates_display = getShowtimesWeek(week_offset)
    
    # Filtrage des films par âge minimal
    if min_age > 0:
        films_to_show = [f for f in films_to_show if f.get("filmAge") and f["filmAge"] >= min_age]
    
    # Calculer la période de la semaine pour l'affichage
    first_day = week_dates_display[0]
    last_day = week_dates_display[-1]
    if first_day['mois'] == last_day['mois']:
        week_period = f"{first_day['chiffre']}-{last_day['chiffre']} {last_day['mois']}"
    else:
        week_period = f"{first_day['chiffre']} {first_day['mois']} - {last_day['chiffre']} {last_day['mois']}"
    
    return jsonify({
        'films': films_to_show,
        'dates': week_dates_display,
        'week_period': week_period,
        'week_offset': week_offset
    })

@app.route('/')
@no_cache
def home():
    min_age = request.args.get("age", default=0, type=int)
    week_offset = request.args.get("week", default=0, type=int)  # Décalage de semaine

    # Clé de cache HTML basée sur les paramètres + état de connexion + date actuelle
    user_id = current_user.id if current_user.is_authenticated else 'guest'
    current_date = datetime.now(timezone).date()
    html_cache_key = f"html_week{week_offset}_age{min_age}_user{user_id}_date{current_date}"

    # Vérifier le cache HTML (instantané !)
    if html_cache_key in _html_cache:
        return _html_cache[html_cache_key]

    useragent = request.headers.get('User-Agent', '')
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

    if useragent and useragent.startswith("curl/"):
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

# Démarrer le système de rafraîchissement automatique quotidien à minuit
# Auto-refresh des données toutes les nuits à 00h
# On passe les références des caches pour qu'ils soient vidés à minuit
auto_refresh = AutoRefresh(theaters, refresh_hour=0, week_cache=_week_cache, html_cache=_html_cache)
auto_refresh.start()

if __name__ == '__main__':
    app.run(host=getenv("HOST"), port=getenv("PORT"), debug=False)