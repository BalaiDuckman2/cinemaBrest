import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFiltersStore } from '../../stores/filtersStore';
import { useSoireeStore } from '../../stores/soireeStore';

/** Durée de l'impulsion visuelle du badge, alignée sur l'animation CSS. */
const PULSE_MS = 400;

export function MobileTabBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const setViewMode = useFiltersStore((s) => s.setViewMode);
  const count = useSoireeStore((s) =>
    Object.values(s.soirees).reduce((n, items) => n + items.length, 0),
  );

  // Sans la barre « Ma soirée » sur mobile, l'incrément du badge est le seul
  // retour visuel d'un ajout : il doit se remarquer.
  const [pulse, setPulse] = useState(false);
  const prevCount = useRef(count);
  useEffect(() => {
    if (count > prevCount.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), PULSE_MS);
      prevCount.current = count;
      return () => clearTimeout(timer);
    }
    prevCount.current = count;
  }, [count]);

  const onHome = pathname === '/';
  const tabs = [
    {
      key: 'grid',
      // La vue Planning est réservée au desktop : sur mobile l'accueil est
      // toujours l'affiche, l'onglet reste donc actif quel que soit `viewMode`.
      icon: '🎥',
      label: 'Affiche',
      active: onHome,
      badge: undefined as number | undefined,
      onClick: () => {
        setViewMode('grid');
        if (!onHome) navigate('/');
      },
    },
    {
      key: 'planifier',
      icon: '🍿',
      label: 'Planifier',
      active: pathname === '/soiree',
      badge: undefined as number | undefined,
      onClick: () => navigate('/soiree'),
    },
    {
      key: 'soirees',
      icon: '🎟',
      label: 'Soirées',
      active: pathname === '/mes-soirees',
      badge: count,
      onClick: () => navigate('/mes-soirees'),
    },
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-beige-papier border-t-2 border-sepia-chaud shadow-2xl pb-[env(safe-area-inset-bottom)]"
    >
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={tab.onClick}
          aria-current={tab.active ? 'page' : undefined}
          className={`flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] font-bebas text-[11px] uppercase tracking-wide transition-colors ${
            tab.active ? 'text-rouge-cinema' : 'text-sepia-chaud'
          }`}
        >
          <span className="relative text-xl leading-none" aria-hidden="true">
            {tab.icon}
            {tab.badge != null && tab.badge > 0 && (
              <span
                className={`absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rouge-cinema text-creme-ecran text-[11px] font-bebas ${
                  pulse ? 'badge-pulse' : ''
                }`}
              >
                {tab.badge}
              </span>
            )}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
