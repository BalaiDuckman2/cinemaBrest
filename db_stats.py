"""
Script pour afficher les statistiques de la base de données
"""
from modules.database import db

stats = db.get_stats()

print("=" * 60)
print("📊 STATISTIQUES DE LA BASE DE DONNÉES")
print("=" * 60)
print(f"🎬 Cinémas:  {stats['cinemas']}")
print(f"🎞️  Films:    {stats['films']}")
print(f"📅 Séances:  {stats['seances']}")
print(f"📆 Dates:    {stats['dates']}")
print("=" * 60)
