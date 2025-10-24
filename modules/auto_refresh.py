"""
Système de rafraîchissement automatique du cache
Rafraîchit les données tous les jours à 5h du matin
"""
import time
import logging
from datetime import datetime, timedelta
from threading import Thread

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AutoRefresh:
    def __init__(self, theaters, refresh_hour: int = 5):
        """
        Initialize auto-refresh system
        
        Args:
            theaters: Liste des cinémas à rafraîchir
            refresh_hour: Heure du rafraîchissement quotidien (défaut: 5h du matin)
        """
        self.theaters = theaters
        self.refresh_hour = refresh_hour
        self.running = False
        self.thread = None
        
    def start(self):
        """Démarre le rafraîchissement automatique en arrière-plan"""
        if self.running:
            logger.warning("Auto-refresh déjà en cours d'exécution")
            return
            
        self.running = True
        self.thread = Thread(target=self._refresh_loop, daemon=True)
        self.thread.start()
        logger.info(f"🔄 Auto-refresh démarré (quotidien à {self.refresh_hour}h)")
        
    def stop(self):
        """Arrête le rafraîchissement automatique"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("⏹️  Auto-refresh arrêté")
        
    def _refresh_loop(self):
        """Boucle principale de rafraîchissement quotidien"""
        while self.running:
            try:
                # Calculer le temps jusqu'au prochain rafraîchissement à 5h
                now = datetime.now()
                next_refresh = now.replace(hour=self.refresh_hour, minute=0, second=0, microsecond=0)
                
                # Si on a dépassé 5h aujourd'hui, planifier pour demain
                if now >= next_refresh:
                    next_refresh += timedelta(days=1)
                
                # Calculer le temps d'attente en secondes
                wait_seconds = (next_refresh - now).total_seconds()
                
                logger.info(f"⏰ Prochain rafraîchissement prévu à {next_refresh.strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Attendre jusqu'à l'heure prévue
                time.sleep(wait_seconds)
                
                # Lancer le rafraîchissement
                if self.running:  # Vérifier qu'on n'a pas été arrêté pendant le sommeil
                    self._refresh_all()
                    
            except Exception as e:
                logger.error(f"❌ Erreur lors du rafraîchissement automatique: {e}")
                # Attendre 1 heure avant de réessayer en cas d'erreur
                time.sleep(3600)
            
    def _refresh_all(self):
        """Rafraîchit les données pour les 2 prochains mois (60 jours)"""
        logger.info("🔄 Début du rafraîchissement automatique (2 mois de données)...")
        start_time = time.time()
        
        # Rafraîchir les 60 prochains jours (environ 2 mois)
        today = datetime.now().date()
        dates = [today + timedelta(days=i) for i in range(60)]
        
        total_showtimes = 0
        total_dates = len(dates)
        
        for idx, date in enumerate(dates, 1):
            date_str = date.strftime("%Y-%m-%d")
            
            for theater in self.theaters:
                try:
                    # Force le rechargement depuis l'API
                    showtimes = theater.getShowtimes(date_str, force_refresh=True)
                    total_showtimes += len(showtimes)
                except Exception as e:
                    logger.error(f"❌ Erreur pour {theater.name} - {date_str}: {e}")
            
            # Log de progression tous les 7 jours
            if idx % 7 == 0:
                logger.info(f"📅 Progression: {idx}/{total_dates} jours ({idx//7} semaines)")
                    
        elapsed = time.time() - start_time
        logger.info(f"✓ Rafraîchissement terminé : {total_showtimes} séances sur 60 jours en {elapsed:.1f}s")
