"""
Script pour vider complètement la base de données
"""
from modules.database import db

print("🗑️  Vidage de la base de données...")
db.clear_all()

stats = db.get_stats()
print("✓ Base de données vidée!")
print(f"📊 BDD: {stats['cinemas']} cinémas, {stats['films']} films, {stats['seances']} séances")
