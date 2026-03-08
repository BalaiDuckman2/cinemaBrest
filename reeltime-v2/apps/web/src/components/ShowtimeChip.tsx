import { useState } from 'react';
import type { ShowtimeEntry } from '../types/components';

const VERSION_STYLES: Record<string, string> = {
  VF: 'bg-rouge-cinema/20 text-rouge-cinema border-rouge-cinema/30',
  VO: 'bg-or-antique/20 text-noir-velours border-or-antique/30',
  VOST: 'bg-sepia-chaud/20 text-sepia-chaud border-sepia-chaud/30',
};

interface ShowtimeChipProps {
  showtime: ShowtimeEntry;
  compact?: boolean;
  isInWatchlist?: boolean;
  onToggleWatchlist?: () => void;
}

export function ShowtimeChip({
  showtime,
  compact = false,
  isInWatchlist = false,
  onToggleWatchlist,
}: ShowtimeChipProps) {
  const [animating, setAnimating] = useState(false);

  const versionStyle =
    VERSION_STYLES[showtime.version] ??
    'bg-beige-papier text-noir-velours border-beige-papier';

  const hasBooking = !!showtime.bookingUrl;

  const chipBase = isInWatchlist
    ? 'border-or-antique/40 bg-or-antique/20'
    : 'border-sepia-chaud/10 bg-beige-papier/50 hover:bg-beige-papier';

  const handleClick = () => {
    if (onToggleWatchlist) {
      setAnimating(true);
      onToggleWatchlist();
      setTimeout(() => setAnimating(false), 200);
    } else if (hasBooking) {
      window.open(showtime.bookingUrl!, '_blank', 'noopener');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!hasBooking && !onToggleWatchlist}
      aria-label={`Seance a ${showtime.time} en ${showtime.version} au ${showtime.cinemaName}${isInWatchlist ? ' (dans votre calendrier)' : ''}`}
      className={`relative inline-flex flex-col items-start rounded-lg border px-3 py-1.5 transition-all ${chipBase} ${
        hasBooking || onToggleWatchlist ? 'cursor-pointer' : 'cursor-default'
      } ${animating ? 'scale-95' : 'scale-100'}`}
    >
      {/* Bookmark indicator */}
      {isInWatchlist && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-or-antique text-noir-velours">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5">
            <path d="M3.75 2a.75.75 0 0 0-.75.75v10.5a.75.75 0 0 0 1.28.53L8 10.06l3.72 3.72a.75.75 0 0 0 1.28-.53V2.75A.75.75 0 0 0 12.25 2h-8.5Z" />
          </svg>
        </span>
      )}

      <div className="flex items-center gap-2">
        <span className="font-bebas text-label text-noir-velours">
          {showtime.time}
        </span>
        <span
          className={`rounded border px-1.5 py-0.5 font-bebas text-[10px] leading-none ${versionStyle}`}
        >
          {showtime.version}
        </span>
      </div>
      {!compact && (
        <span className="mt-0.5 font-crimson text-caption text-sepia-chaud">
          {showtime.cinemaName}
        </span>
      )}
    </button>
  );
}
