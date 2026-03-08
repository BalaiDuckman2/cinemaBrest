import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export function Header() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);

  return (
    <header className="stage-curtain film-strip-border sticky top-0 z-50 shadow-xl">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <span className="text-3xl sm:text-4xl">🎬</span>
            <div>
              <h1 className="font-bebas text-2xl sm:text-3xl md:text-4xl text-creme-ecran uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                ReelTime
              </h1>
              <p className="font-crimson text-xs sm:text-sm text-creme-ecran/80 italic hidden sm:block">
                Vos séances ciné en temps réel
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/watchlist"
                  className="font-bebas px-3 py-2 bg-or-antique/20 hover:bg-or-antique/30 border border-or-antique/40 rounded-lg text-creme-ecran text-sm uppercase tracking-wide transition-all duration-200 flex items-center gap-2 flex-shrink-0"
                >
                  <span>📅</span>
                  <span className="hidden sm:inline">Calendrier</span>
                </Link>
                <button
                  onClick={logout}
                  className="font-bebas px-3 py-2 bg-noir-velours/30 hover:bg-noir-velours/50 border border-sepia-chaud rounded-lg text-creme-ecran text-sm uppercase tracking-wide transition-all duration-200 flex items-center gap-2 flex-shrink-0"
                >
                  <span>👋</span>
                  <span className="hidden sm:inline">Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="font-bebas px-3 py-2 bg-or-antique/20 hover:bg-or-antique/30 border border-or-antique/40 rounded-lg text-creme-ecran text-sm uppercase tracking-wide transition-all duration-200 flex-shrink-0"
                >
                  <span className="hidden sm:inline">Connexion</span>
                  <span className="sm:hidden">🔐</span>
                </Link>
                <Link
                  to="/register"
                  className="font-bebas px-3 py-2 bg-jaune-marquise hover:bg-or-antique rounded-lg text-noir-velours text-sm uppercase tracking-wide font-bold transition-all duration-200 flex-shrink-0 shadow-lg"
                >
                  <span className="hidden sm:inline">Inscription</span>
                  <span className="sm:hidden">➕</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
