import { Link, NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="stage-curtain sticky top-0 z-50 shadow-xl border-b-2 border-or-antique">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 sm:gap-4 hover:opacity-80 transition-opacity cursor-pointer flex-1 py-2"
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

          <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <NavLink
              to="/soiree"
              className={({ isActive }) =>
                `font-bebas shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg border-2 text-sm sm:text-base uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'bg-or-antique border-or-antique text-noir-velours'
                    : 'border-or-antique/70 text-creme-ecran hover:bg-or-antique/20'
                }`
              }
            >
              🍿 <span className="hidden md:inline">Planifier ma soirée</span>
              <span className="md:hidden">Planifier</span>
            </NavLink>
            <NavLink
              to="/mes-soirees"
              className={({ isActive }) =>
                `font-bebas shrink-0 px-2.5 sm:px-3 py-1.5 rounded-lg border-2 text-sm sm:text-base uppercase tracking-wide transition-colors ${
                  isActive
                    ? 'bg-or-antique border-or-antique text-noir-velours'
                    : 'border-or-antique/70 text-creme-ecran hover:bg-or-antique/20'
                }`
              }
            >
              🎟 <span className="hidden md:inline">Mes soirées</span>
              <span className="md:hidden">Soirées</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
