"""
Gestion de l'authentification des utilisateurs
Flask-Login + Bcrypt pour la sécurité
"""
from flask_login import UserMixin
from flask_bcrypt import Bcrypt
from typing import Optional

bcrypt = Bcrypt()


class User(UserMixin):
    """Classe utilisateur pour Flask-Login."""
    
    def __init__(self, user_id: int, email: str, name: str = None):
        self.id = user_id
        self.email = email
        self.name = name or email.split('@')[0]
    
    def __repr__(self):
        return f'<User {self.email}>'
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash un mot de passe avec bcrypt.
        
        Args:
            password: Mot de passe en clair
            
        Returns:
            str: Hash bcrypt du mot de passe
        """
        return bcrypt.generate_password_hash(password).decode('utf-8')
    
    @staticmethod
    def check_password(password: str, password_hash: str) -> bool:
        """Vérifie un mot de passe contre son hash.
        
        Args:
            password: Mot de passe en clair
            password_hash: Hash bcrypt
            
        Returns:
            bool: True si le mot de passe correspond
        """
        return bcrypt.check_password_hash(password_hash, password)
