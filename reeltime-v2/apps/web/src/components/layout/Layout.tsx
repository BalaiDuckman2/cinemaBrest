import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastProvider } from '../ui/Toast';
import { SoireeBar } from '../soiree/SoireeBar';
import { useSoireeStore } from '../../stores/soireeStore';
import { localISODate } from '../../utils/dates';

export function Layout() {
  const hasPlan = useSoireeStore((s) => Object.keys(s.soirees).length > 0);
  const purgeExpired = useSoireeStore((s) => s.purgeExpired);
  // La page Mes soirées affiche déjà tout : la barre y ferait doublon.
  const hideBar = useLocation().pathname === '/mes-soirees';
  const showBar = hasPlan && !hideBar;

  // Auto-expiration : purge au montage de l'app des soirées de dates passées,
  // même quand la barre est masquée.
  useEffect(() => {
    purgeExpired(localISODate());
  }, [purgeExpired]);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* padding-bottom quand la barre Ma soirée est visible : aucun contenu masqué */}
        <main className={`flex-1${showBar ? ' pb-24' : ''}`}>
          <Outlet />
        </main>
        <Footer />
        {showBar && <SoireeBar />}
      </div>
    </ToastProvider>
  );
}
