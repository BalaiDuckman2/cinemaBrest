import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useAlerts } from '../hooks/useAlerts';
import { AlertsList } from '../components/alerts';
import { DeleteAccountModal } from '../components/auth/DeleteAccountModal';

export function ProfilePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logout = useAuthStore((s) => s.logout);
  const { alerts } = useAlerts();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Profile card */}
      <div className="rounded-lg border border-sepia-chaud/20 bg-beige-papier p-8 shadow-vintage">
        <h1 className="mb-6 text-center font-playfair text-headline text-noir-velours">
          Mon profil
        </h1>

        {user && (
          <div className="space-y-4">
            {/* Email */}
            <div>
              <span className="font-bebas text-label tracking-wider text-sepia-chaud">Email</span>
              <p className="font-crimson text-body text-noir-velours">{user.email}</p>
            </div>

            {/* Name */}
            <div>
              <span className="font-bebas text-label tracking-wider text-sepia-chaud">Nom</span>
              <p className="font-crimson text-body text-noir-velours">
                {user.name ?? 'Non renseigne'}
              </p>
            </div>

            {/* Member since */}
            <div>
              <span className="font-bebas text-label tracking-wider text-sepia-chaud">
                Membre depuis
              </span>
              <p className="font-crimson text-body text-noir-velours">{formattedDate}</p>
            </div>

            {/* Divider */}
            <div className="border-t border-sepia-chaud/20 pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded bg-rouge-cinema py-3 font-bebas text-label tracking-wider text-creme-ecran transition-colors hover:bg-bordeaux-profond"
              >
                Se deconnecter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Alerts section */}
      {isAuthenticated && (
        <div className="mt-8 rounded-lg border border-sepia-chaud/20 bg-beige-papier p-8 shadow-vintage">
          <h2 className="mb-4 font-playfair text-xl text-noir-velours">
            Mes alertes{' '}
            {alerts.length > 0 && (
              <span className="ml-1 inline-block rounded-full bg-rouge-cinema px-2 py-0.5 font-bebas text-xs text-creme-ecran">
                {alerts.length}
              </span>
            )}
          </h2>
          <AlertsList />
        </div>
      )}

      {/* Danger zone - Account deletion */}
      {isAuthenticated && (
        <div className="mt-8 rounded-lg border border-rouge-cinema/20 bg-beige-papier p-8">
          <h2 className="mb-2 font-playfair text-lg text-rouge-cinema">
            Zone de danger
          </h2>
          <p className="mb-4 font-crimson text-sm text-sepia-chaud">
            La suppression de votre compte est definitive et irreversible.
          </p>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="rounded border border-rouge-cinema bg-transparent px-4 py-2 font-bebas text-label tracking-wider text-rouge-cinema transition-colors hover:bg-rouge-cinema hover:text-creme-ecran"
          >
            Supprimer mon compte
          </button>
        </div>
      )}

      {/* Delete account confirmation modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </div>
  );
}
