import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../ui/Toast';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ isOpen, onClose }: DeleteAccountModalProps) {
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { showToast } = useToast();

  if (!isOpen) return null;

  const canDelete = confirmText === 'SUPPRIMER';

  const handleDelete = async () => {
    if (!canDelete) return;
    setIsDeleting(true);
    setError('');

    try {
      await apiFetch<void>('/api/v1/me', {
        method: 'DELETE',
        body: JSON.stringify({ confirm: true }),
      });
      showToast({ message: 'Compte supprime avec succes' });
      logout();
      navigate('/');
    } catch {
      setError('Erreur lors de la suppression du compte');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setConfirmText('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-velours/60 px-4">
      <div className="w-full max-w-md rounded-lg border border-rouge-cinema/30 bg-creme-ecran p-6 shadow-vintage">
        <h2 className="mb-2 font-playfair text-xl text-rouge-cinema">
          Supprimer mon compte
        </h2>

        <div className="mb-4 rounded border border-rouge-cinema/20 bg-rouge-cinema/5 p-3">
          <p className="font-crimson text-sm text-noir-velours">
            Cette action est <strong>irreversible</strong>. Toutes vos donnees seront
            definitivement supprimees :
          </p>
          <ul className="mt-2 list-inside list-disc font-crimson text-sm text-sepia-chaud">
            <li>Votre profil et informations personnelles</li>
            <li>Votre liste de seances sauvegardees</li>
            <li>Vos alertes de films</li>
          </ul>
        </div>

        <label className="mb-1 block font-bebas text-label tracking-wider text-sepia-chaud">
          Tapez SUPPRIMER pour confirmer
        </label>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="SUPPRIMER"
          autoComplete="off"
          className="mb-4 w-full rounded border border-sepia-chaud/30 bg-beige-papier px-3 py-2 font-crimson text-body text-noir-velours placeholder:text-sepia-chaud/30 focus:border-rouge-cinema focus:outline-none"
        />

        {error && (
          <p className="mb-3 font-crimson text-sm text-rouge-cinema">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 rounded border border-sepia-chaud/30 bg-beige-papier py-2 font-bebas text-label tracking-wider text-sepia-chaud transition-colors hover:bg-sepia-chaud/10"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || isDeleting}
            className="flex-1 rounded bg-rouge-cinema py-2 font-bebas text-label tracking-wider text-creme-ecran transition-colors hover:bg-bordeaux-profond disabled:opacity-40"
          >
            {isDeleting ? 'Suppression...' : 'Confirmer la suppression'}
          </button>
        </div>
      </div>
    </div>
  );
}
