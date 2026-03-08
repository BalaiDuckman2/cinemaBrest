import { useState, type FormEvent } from 'react';
import { useAlerts, type AlertCriteria } from '../../hooks/useAlerts';
import { useCinemas } from '../../hooks/useCinemas';
import { useToast } from '../ui/Toast';

interface AlertFormProps {
  defaultTitle?: string;
  onClose: () => void;
}

export function AlertForm({ defaultTitle = '', onClose }: AlertFormProps) {
  const { createAlert, isCreating } = useAlerts();
  const { data: cinemas = [] } = useCinemas();
  const { showToast } = useToast();

  const [filmTitle, setFilmTitle] = useState(defaultTitle);
  const [cinemaId, setCinemaId] = useState('');
  const [version, setVersion] = useState<'VO' | 'VF' | 'VOST' | ''>('');
  const [minTime, setMinTime] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!filmTitle.trim()) {
      setError('Le titre du film est requis');
      return;
    }

    if (minTime && !/^\d{2}:\d{2}$/.test(minTime)) {
      setError('Format d\'heure invalide (HH:MM)');
      return;
    }

    const criteria: AlertCriteria = {};
    if (cinemaId) criteria.cinemaId = cinemaId;
    if (version) criteria.version = version;
    if (minTime) criteria.minTime = minTime;

    try {
      const response = await createAlert({ filmTitle: filmTitle.trim(), criteria });
      showToast({ message: 'Alerte creee' });
      if (response.data.immediateMatch && response.data.matchMessage) {
        showToast({ message: response.data.matchMessage });
      }
      onClose();
    } catch {
      setError('Erreur lors de la creation de l\'alerte');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-noir-velours/60 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-sepia-chaud/20 bg-creme-ecran p-6 shadow-vintage"
      >
        <h3 className="mb-4 font-playfair text-headline text-noir-velours">
          Creer une alerte
        </h3>
        <p className="mb-4 font-crimson text-sm text-sepia-chaud">
          Vous serez notifie lorsque ce film sera a l'affiche.
        </p>

        {error && (
          <p className="mb-3 font-crimson text-sm text-rouge-cinema">{error}</p>
        )}

        {/* Film title */}
        <label className="mb-1 block font-bebas text-label tracking-wider text-sepia-chaud">
          Titre du film
        </label>
        <input
          type="text"
          value={filmTitle}
          onChange={(e) => setFilmTitle(e.target.value)}
          required
          className="mb-4 w-full rounded border border-sepia-chaud/30 bg-beige-papier px-3 py-2 font-crimson text-body text-noir-velours placeholder:text-sepia-chaud/50 focus:border-rouge-cinema focus:outline-none"
          placeholder="Ex: Le Comte de Monte-Cristo"
        />

        {/* Cinema select */}
        <label className="mb-1 block font-bebas text-label tracking-wider text-sepia-chaud">
          Cinema (optionnel)
        </label>
        <select
          value={cinemaId}
          onChange={(e) => setCinemaId(e.target.value)}
          className="mb-4 w-full rounded border border-sepia-chaud/30 bg-beige-papier px-3 py-2 font-crimson text-body text-noir-velours focus:border-rouge-cinema focus:outline-none"
        >
          <option value="">Tous les cinemas</option>
          {cinemas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.city})
            </option>
          ))}
        </select>

        {/* Version radio */}
        <label className="mb-2 block font-bebas text-label tracking-wider text-sepia-chaud">
          Version (optionnel)
        </label>
        <div className="mb-4 flex gap-4">
          {(['', 'VO', 'VF', 'VOST'] as const).map((v) => (
            <label key={v || 'all'} className="flex items-center gap-1 font-crimson text-sm text-noir-velours">
              <input
                type="radio"
                name="version"
                checked={version === v}
                onChange={() => setVersion(v)}
                className="accent-rouge-cinema"
              />
              {v || 'Toutes'}
            </label>
          ))}
        </div>

        {/* Min time */}
        <label className="mb-1 block font-bebas text-label tracking-wider text-sepia-chaud">
          Heure minimum (optionnel)
        </label>
        <input
          type="time"
          value={minTime}
          onChange={(e) => setMinTime(e.target.value)}
          className="mb-6 w-full rounded border border-sepia-chaud/30 bg-beige-papier px-3 py-2 font-crimson text-body text-noir-velours focus:border-rouge-cinema focus:outline-none"
        />

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded border border-sepia-chaud/30 bg-beige-papier py-2 font-bebas text-label tracking-wider text-sepia-chaud transition-colors hover:bg-sepia-chaud/10"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isCreating}
            className="flex-1 rounded bg-rouge-cinema py-2 font-bebas text-label tracking-wider text-creme-ecran transition-colors hover:bg-bordeaux-profond disabled:opacity-50"
          >
            {isCreating ? 'Creation...' : 'Creer l\'alerte'}
          </button>
        </div>
      </form>
    </div>
  );
}
