"""
Script pour initialiser les tables d'authentification et de calendrier.
À exécuter une seule fois après le déploiement.
"""

from modules.database import db

if __name__ == '__main__':
    print("🎬 Initialisation de la base de données...")
    db.init_database()
    print("✅ Tables users et user_watchlist créées avec succès !")
    print("📊 Statistiques:")
    stats = db.get_stats()
    print(f"  - Cinémas: {stats['cinemas']}")
    print(f"  - Films en cache: {stats['films']}")
    print("✨ Base de données prête !")
