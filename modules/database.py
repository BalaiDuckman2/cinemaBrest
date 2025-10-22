"""
Base de données pour stocker les cinémas, films et séances
Structure relationnelle propre avec SQLite
"""
import sqlite3
from datetime import datetime, timedelta
from typing import List, Optional, Tuple
import json

class CinemaDatabase:
    def __init__(self, db_path: str = "cinema.db"):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Crée une connexion à la base de données"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Pour accéder aux colonnes par nom
        return conn
    
    def init_database(self):
        """Initialise le schéma de la base de données"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Table des cinémas
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS cinemas (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                location_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table des films
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS films (
                id INTEGER PRIMARY KEY,
                allocine_id INTEGER UNIQUE,
                title TEXT NOT NULL,
                poster_url TEXT,
                release_year INTEGER,
                production_year INTEGER,
                film_age INTEGER,
                data_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Table des séances
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS seances (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                cinema_id INTEGER NOT NULL,
                film_id INTEGER NOT NULL,
                starts_at TIMESTAMP NOT NULL,
                date TEXT NOT NULL,
                diffusion_version TEXT,
                services_json TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
                FOREIGN KEY (film_id) REFERENCES films(id) ON DELETE CASCADE
            )
        """)
        
        # Index pour améliorer les performances
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_seances_cinema_date 
            ON seances(cinema_id, date)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_seances_date 
            ON seances(date)
        """)
        
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_films_allocine 
            ON films(allocine_id)
        """)
        
        # Table de metadata pour suivre les mises à jour
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        conn.close()
    
    def save_cinema(self, cinema_id: str, name: str, location: dict) -> str:
        """Sauvegarde ou met à jour un cinéma"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO cinemas (id, name, location_json, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                location_json = excluded.location_json,
                updated_at = CURRENT_TIMESTAMP
        """, (cinema_id, name, json.dumps(location)))
        
        conn.commit()
        conn.close()
        return cinema_id
    
    def save_film(self, allocine_id: int, title: str, poster_url: str, 
                  release_year: int, production_year: int, film_age: int, 
                  data: dict) -> int:
        """Sauvegarde ou met à jour un film"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO films (allocine_id, title, poster_url, release_year, 
                             production_year, film_age, data_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(allocine_id) DO UPDATE SET
                title = excluded.title,
                poster_url = excluded.poster_url,
                release_year = excluded.release_year,
                production_year = excluded.production_year,
                film_age = excluded.film_age,
                data_json = excluded.data_json,
                updated_at = CURRENT_TIMESTAMP
            RETURNING id
        """, (allocine_id, title, poster_url, release_year, production_year, 
              film_age, json.dumps(data)))
        
        film_id = cursor.fetchone()[0]
        conn.commit()
        conn.close()
        return film_id
    
    def save_seance(self, cinema_id: str, film_id: int, starts_at: datetime,
                    date_str: str, diffusion_version: str, services: list):
        """Sauvegarde une séance"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Vérifier si la séance existe déjà (même cinema, film, heure)
        cursor.execute("""
            SELECT id FROM seances 
            WHERE cinema_id = ? AND film_id = ? AND starts_at = ?
        """, (cinema_id, film_id, starts_at.isoformat()))
        
        existing = cursor.fetchone()
        
        if not existing:
            cursor.execute("""
                INSERT INTO seances (cinema_id, film_id, starts_at, date, 
                                   diffusion_version, services_json, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (cinema_id, film_id, starts_at.isoformat(), date_str,
                  diffusion_version, json.dumps(services)))
        else:
            # Mettre à jour si elle existe
            cursor.execute("""
                UPDATE seances 
                SET diffusion_version = ?, services_json = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (diffusion_version, json.dumps(services), existing[0]))
        
        conn.commit()
        conn.close()
    
    def get_seances_by_date(self, cinema_id: str, date_str: str) -> List[dict]:
        """Récupère toutes les séances d'un cinéma pour une date donnée"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT 
                s.starts_at, s.diffusion_version, s.services_json,
                f.allocine_id, f.title, f.poster_url, f.release_year,
                f.production_year, f.film_age, f.data_json,
                c.id as cinema_id, c.name as cinema_name, c.location_json
            FROM seances s
            JOIN films f ON s.film_id = f.id
            JOIN cinemas c ON s.cinema_id = c.id
            WHERE s.cinema_id = ? AND s.date = ?
            ORDER BY f.title, s.starts_at
        """, (cinema_id, date_str))
        
        results = []
        for row in cursor.fetchall():
            results.append({
                'starts_at': row['starts_at'],
                'diffusion_version': row['diffusion_version'],
                'services': json.loads(row['services_json']),
                'film': {
                    'allocine_id': row['allocine_id'],
                    'title': row['title'],
                    'poster_url': row['poster_url'],
                    'release_year': row['release_year'],
                    'production_year': row['production_year'],
                    'film_age': row['film_age'],
                    'data': json.loads(row['data_json'])
                },
                'cinema': {
                    'id': row['cinema_id'],
                    'name': row['cinema_name'],
                    'location': json.loads(row['location_json'])
                }
            })
        
        conn.close()
        return results
    
    def has_seances_for_date(self, cinema_id: str, date_str: str) -> bool:
        """Vérifie si on a déjà des séances pour ce cinéma à cette date"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT COUNT(*) as count FROM seances 
            WHERE cinema_id = ? AND date = ?
        """, (cinema_id, date_str))
        
        count = cursor.fetchone()['count']
        conn.close()
        return count > 0
    
    def get_last_update(self, cinema_id: str, date_str: str) -> Optional[datetime]:
        """Récupère la date de dernière mise à jour pour un cinéma/date"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT MAX(updated_at) as last_update FROM seances
            WHERE cinema_id = ? AND date = ?
        """, (cinema_id, date_str))
        
        result = cursor.fetchone()
        conn.close()
        
        if result and result['last_update']:
            return datetime.fromisoformat(result['last_update'])
        return None
    
    def should_refresh(self, cinema_id: str, date_str: str, max_age_hours: int = 1) -> bool:
        """Détermine si les données doivent être rafraîchies"""
        last_update = self.get_last_update(cinema_id, date_str)
        
        if last_update is None:
            return True  # Pas de données, il faut les charger
        
        age = datetime.now() - last_update
        return age > timedelta(hours=max_age_hours)
    
    def delete_old_seances(self, days_to_keep: int = 1):
        """Supprime les séances de plus de N jours"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cutoff_date = (datetime.now() - timedelta(days=days_to_keep)).strftime("%Y-%m-%d")
        
        cursor.execute("""
            DELETE FROM seances WHERE date < ?
        """, (cutoff_date,))
        
        deleted = cursor.rowcount
        conn.commit()
        conn.close()
        
        return deleted
    
    def get_stats(self) -> dict:
        """Récupère des statistiques sur la base de données"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as count FROM cinemas")
        cinemas_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM films")
        films_count = cursor.fetchone()['count']
        
        cursor.execute("SELECT COUNT(*) as count FROM seances")
        seances_count = cursor.fetchone()['count']
        
        cursor.execute("""
            SELECT COUNT(DISTINCT date) as count FROM seances
        """)
        dates_count = cursor.fetchone()['count']
        
        conn.close()
        
        return {
            'cinemas': cinemas_count,
            'films': films_count,
            'seances': seances_count,
            'dates': dates_count
        }
    
    def clear_all(self):
        """Vide toutes les données (pour debug)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("DELETE FROM seances")
        cursor.execute("DELETE FROM films")
        cursor.execute("DELETE FROM cinemas")
        cursor.execute("DELETE FROM metadata")
        
        conn.commit()
        conn.close()

# Instance globale
db = CinemaDatabase()
