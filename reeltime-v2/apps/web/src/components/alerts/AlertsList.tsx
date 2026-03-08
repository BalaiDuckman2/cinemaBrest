import { useState } from 'react';
import { useAlerts, type AlertItem, type AlertCriteria } from '../../hooks/useAlerts';
import { useCinemas } from '../../hooks/useCinemas';
import { useToast } from '../ui/Toast';

function StatusBadge({ status }: { status: 'active' | 'triggered' | 'expired' }) {
  const styles = {
    active: 'bg-green-700 text-creme-ecran',
    triggered: 'bg-or-antique text-noir-velours',
    expired: 'bg-beige-papier text-sepia-chaud',
  };
  const labels = { active: 'Actif', triggered: 'Declenche', expired: 'Expire' };

  return (
    <span className={`inline-block rounded-sm px-2 py-0.5 font-bebas text-xs tracking-wider ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function buildCriteriaSummary(criteria: AlertCriteria, cinemas: Array<{ id: string; name: string }>): string {
  const parts: string[] = [];
  if (criteria.cinemaId) {
    const cinema = cinemas.find((c) => c.id === criteria.cinemaId);
    parts.push(cinema?.name ?? criteria.cinemaId);
  }
  if (criteria.version) parts.push(criteria.version);
  if (criteria.minTime) parts.push(`apres ${criteria.minTime}`);
  return parts.length > 0 ? parts.join(', ') : 'Tous les criteres';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function AlertListItem({
  alert,
  cinemas,
  onDelete,
}: {
  alert: AlertItem;
  cinemas: Array<{ id: string; name: string }>;
  onDelete: (id: string) => void;
}) {
  const [fading, setFading] = useState(false);

  const handleDelete = () => {
    setFading(true);
    setTimeout(() => onDelete(alert.id), 300);
  };

  return (
    <div
      className={`flex items-start justify-between gap-4 rounded border border-sepia-chaud/20 bg-beige-papier p-4 transition-all duration-300 ${
        fading ? 'scale-95 opacity-0' : 'opacity-100'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h4 className="truncate font-playfair text-base font-semibold text-noir-velours">
            {alert.filmTitle}
          </h4>
          <StatusBadge status={alert.status} />
        </div>
        <p className="mt-1 font-crimson text-sm text-sepia-chaud">
          {buildCriteriaSummary(alert.criteria, cinemas)}
        </p>
        <p className="mt-0.5 font-crimson text-xs text-sepia-chaud/70">
          Creee le {formatDate(alert.createdAt)}
          {alert.triggeredAt && (
            <> &mdash; Declenchee le {formatDate(alert.triggeredAt)}</>
          )}
        </p>
      </div>

      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        title="Supprimer l'alerte"
        className="mt-1 shrink-0 rounded p-1 text-sepia-chaud/50 transition-colors hover:text-rouge-cinema"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

export function AlertsList() {
  const { alerts, isLoading, deleteAlert } = useAlerts();
  const { data: cinemas = [] } = useCinemas();
  const { showToast } = useToast();

  const handleDelete = (id: string) => {
    deleteAlert(id);
    showToast({ message: 'Alerte supprimee' });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded border border-sepia-chaud/10 bg-beige-papier" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <p className="py-6 text-center font-crimson text-body text-sepia-chaud/70">
        Aucune alerte configuree
      </p>
    );
  }

  // Sort by creation date descending
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-3">
      {sorted.map((alert) => (
        <AlertListItem
          key={alert.id}
          alert={alert}
          cinemas={cinemas}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
