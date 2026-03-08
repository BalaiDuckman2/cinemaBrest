import { useState } from 'react';
import { useWatchlist, type WatchlistItem } from '../hooks/useWatchlist';
import { useToast } from '../components/ui/Toast';
import { EmptyState } from '../components/EmptyState';

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_FR = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const dayName = DAYS_FR[date.getDay()];
  const num = date.getDate();
  const month = MONTHS_FR[date.getMonth()];
  const year = date.getFullYear();
  return `${dayName} ${num} ${month} ${year}`;
}

function groupByDate(items: WatchlistItem[]): Record<string, WatchlistItem[]> {
  const groups: Record<string, WatchlistItem[]> = {};
  for (const item of items) {
    if (!groups[item.date]) groups[item.date] = [];
    groups[item.date].push(item);
  }
  // Sort items within each date by time
  for (const date of Object.keys(groups)) {
    groups[date].sort((a, b) => a.time.localeCompare(b.time));
  }
  return groups;
}

const VERSION_BADGE: Record<string, string> = {
  VF: 'bg-rouge-cinema/20 text-rouge-cinema',
  VO: 'bg-or-antique/20 text-noir-velours',
  VOST: 'bg-sepia-chaud/20 text-sepia-chaud',
};

export function WatchlistPage() {
  const { items, isLoading, addMutation, removeMutation } = useWatchlist();
  const { showToast } = useToast();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const handleRemove = (item: WatchlistItem) => {
    // Start fade-out animation
    setRemovingIds((prev) => new Set(prev).add(item.id));

    setTimeout(() => {
      removeMutation.mutate(item.id);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 300);

    showToast({
      message: 'Retire du calendrier',
      action: {
        label: 'Annuler',
        onClick: () => {
          setRemovingIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          addMutation.mutate({
            filmTitle: item.filmTitle,
            cinemaName: item.cinemaName,
            date: item.date,
            time: item.time,
            version: item.version,
            bookingUrl: item.bookingUrl,
            posterUrl: item.posterUrl,
          });
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-center font-bebas text-display tracking-wider text-noir-velours">
          Mon calendrier
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-lg bg-beige-papier/50 p-4">
              <div className="mb-3 h-5 w-48 rounded bg-sepia-chaud/20" />
              <div className="flex gap-3">
                <div className="h-[72px] w-[48px] rounded bg-sepia-chaud/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded bg-sepia-chaud/20" />
                  <div className="h-3 w-1/2 rounded bg-sepia-chaud/20" />
                  <div className="h-3 w-1/4 rounded bg-sepia-chaud/20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-center font-bebas text-display tracking-wider text-noir-velours">
          Mon calendrier
        </h1>
        <EmptyState
          message="Votre calendrier est vide"
          actionLabel="Parcourir les films"
          onAction={() => { window.location.href = '/'; }}
        />
      </div>
    );
  }

  const grouped = groupByDate(items);
  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-center font-bebas text-display tracking-wider text-noir-velours">
        Mon calendrier
      </h1>

      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date}>
            <h2 className="mb-3 font-bebas text-subtitle uppercase text-rouge-cinema">
              {formatDateLong(date)}
            </h2>
            <div className="space-y-2">
              {grouped[date].map((item) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3 rounded-lg border border-sepia-chaud/20 bg-beige-papier p-3 shadow-sm transition-all duration-300 ${
                    removingIds.has(item.id) ? 'scale-95 opacity-0' : 'opacity-100'
                  }`}
                >
                  {/* Poster thumbnail */}
                  {item.posterUrl ? (
                    <img
                      src={item.posterUrl}
                      alt={item.filmTitle}
                      className="h-[72px] w-[48px] flex-shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-[72px] w-[48px] flex-shrink-0 items-center justify-center rounded bg-sepia-chaud/10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5 text-sepia-chaud/40">
                        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
                      </svg>
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-playfair text-body font-semibold text-noir-velours">
                      {item.filmTitle}
                    </p>
                    <p className="font-crimson text-caption text-sepia-chaud">
                      {item.cinemaName}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="font-bebas text-label text-noir-velours">
                        {item.time}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 font-bebas text-[10px] leading-none ${
                          VERSION_BADGE[item.version] ?? 'bg-beige-papier text-noir-velours'
                        }`}
                      >
                        {item.version}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {item.bookingUrl && (
                      <a
                        href={item.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-full text-sepia-chaud transition-colors hover:bg-sepia-chaud/10 hover:text-rouge-cinema"
                        aria-label="Reserver"
                        title="Reserver"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                          <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Zm14.47-1.22a.75.75 0 0 0-1.06-1.06l-4.97 4.97a.75.75 0 1 0 1.06 1.06l4.97-4.97Z" clipRule="evenodd" />
                          <path fillRule="evenodd" d="M13.5 2.75a.75.75 0 0 1 .75-.75h4a.75.75 0 0 1 .75.75v4a.75.75 0 0 1-1.5 0V4.06l-.97.97a.75.75 0 0 1-1.06-1.06l.97-.97H14.25a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                        </svg>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-sepia-chaud transition-colors hover:bg-rouge-cinema/10 hover:text-rouge-cinema"
                      aria-label="Retirer du calendrier"
                      title="Retirer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
