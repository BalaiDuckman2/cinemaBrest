import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { ToastProvider } from '../ui/Toast';
import { SoireeBar } from '../soiree/SoireeBar';
import { useSoireeStore } from '../../stores/soireeStore';

export function Layout() {
  const hasPlan = useSoireeStore((s) => s.items.length > 0);

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* padding-bottom quand la barre Ma soirée est visible : aucun contenu masqué */}
        <main className={`flex-1${hasPlan ? ' pb-24' : ''}`}>
          <Outlet />
        </main>
        <Footer />
        <SoireeBar />
      </div>
    </ToastProvider>
  );
}
