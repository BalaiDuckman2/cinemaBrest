"""
Formulaires Flask-WTF pour l'authentification
"""
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, BooleanField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from modules.database import db


class RegisterForm(FlaskForm):
    """Formulaire d'inscription."""
    
    email = StringField('Email', validators=[
        DataRequired(message="L'email est requis"),
        Email(message="Email invalide")
    ])
    
    name = StringField('Nom (optionnel)', validators=[
        Length(max=100, message="Nom trop long (max 100 caractères)")
    ])
    
    password = PasswordField('Mot de passe', validators=[
        DataRequired(message="Le mot de passe est requis"),
        Length(min=6, message="Le mot de passe doit faire au moins 6 caractères")
    ])
    
    confirm_password = PasswordField('Confirmer le mot de passe', validators=[
        DataRequired(message="Veuillez confirmer le mot de passe"),
        EqualTo('password', message="Les mots de passe ne correspondent pas")
    ])
    
    submit = SubmitField('S\'inscrire')
    
    def validate_email(self, email):
        """Vérifie que l'email n'existe pas déjà."""
        user = db.get_user_by_email(email.data)
        if user:
            raise ValidationError('Cet email est déjà utilisé')


class LoginForm(FlaskForm):
    """Formulaire de connexion."""
    
    email = StringField('Email', validators=[
        DataRequired(message="L'email est requis"),
        Email(message="Email invalide")
    ])
    
    password = PasswordField('Mot de passe', validators=[
        DataRequired(message="Le mot de passe est requis")
    ])
    
    remember = BooleanField('Se souvenir de moi')
    
    submit = SubmitField('Se connecter')
