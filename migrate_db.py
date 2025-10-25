"""
Migration de la base de données : Ajout des colonnes watched et watched_at
"""
import sqlite3
import os

print("🔧 Migration de la base de données...")

# Utiliser le bon chemin de BDD
data_dir = os.path.join(os.path.dirname(__file__), 'data')
db_path = os.path.join(data_dir, 'cinema.db') if os.path.exists(data_dir) else 'cinema.db'

print(f"📁 Base de données: {db_path}")

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    # Vérifier si les colonnes existent déjà
    cursor.execute("PRAGMA table_info(user_watchlist)")
    columns = [row[1] for row in cursor.fetchall()]
    
    if 'watched' not in columns:
        print("📝 Ajout de la colonne 'watched'...")
        cursor.execute("ALTER TABLE user_watchlist ADD COLUMN watched BOOLEAN DEFAULT 0")
        print("✅ Colonne 'watched' ajoutée")
    else:
        print("✓ Colonne 'watched' déjà présente")
    
    if 'watched_at' not in columns:
        print("📝 Ajout de la colonne 'watched_at'...")
        cursor.execute("ALTER TABLE user_watchlist ADD COLUMN watched_at TIMESTAMP")
        print("✅ Colonne 'watched_at' ajoutée")
    else:
        print("✓ Colonne 'watched_at' déjà présente")
    
    conn.commit()
    print("\n🎉 Migration terminée avec succès !")
    
except Exception as e:
    print(f"❌ Erreur lors de la migration: {e}")
    conn.rollback()
finally:
    conn.close()
