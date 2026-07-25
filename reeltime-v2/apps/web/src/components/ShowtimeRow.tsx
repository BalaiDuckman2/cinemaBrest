import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { getCinemaShortName } from '../utils/cinemaNames';
import { AddToSoireeButton } from './soiree/AddToSoireeButton';

interface ShowtimeRowProps {
  showtime: ShowtimeEntry;
  film: Pick<FilmListItem, 'id' | 'title' | 'posterUrl' | 'runtime'>;
  city: string | undefined;
  /** Affiche le bouton d'enchaînement (desktop uniquement). */
  onChain?: (st: ShowtimeEntry) => void;
  /** Nom du cinéma, masqué quand il est déjà porté par un en-tête de groupe. */
  showCinema?: boolean;
}

export function ShowtimeRow({
  showtime,
  film,
  city,
  onChain,
  showCinema = true,
}: ShowtimeRowProps) {
  const bookable = showtime.bookingUrl != null;
  const cinemaShort = getCinemaShortName(showtime.cinemaName);

  const inner = (
    <>
      {/* Bloc heure, avec le décrochage « ticket » hérité des anciennes pastilles. */}
      <span className="relative font-bebas shrink-0 w-16 text-center text-lg text-creme-ecran bg-rouge-cinema border-2 border-or-antique rounded-md py-1">
        {showtime.time}
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-creme-ecran rounded-bl-lg"
        />
      </span>
      <span className="flex-1 min-w-0 font-crimson text-sm text-noir-velours truncate">
        {showCinema && cinemaShort}
        {showCinema && showtime.version ? ' · ' : ''}
        {showtime.version}
      </span>
    </>
  );

  return (
    <div className="flex items-center gap-3 min-h-[56px] border-b border-sepia-chaud/20 last:border-0">
      {bookable ? (
        <a
          href={showtime.bookingUrl!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Réserver ${film.title} à ${showtime.time} au ${cinemaShort}`}
          className="flex flex-1 min-w-0 items-center gap-3 py-2 pr-2 hover:bg-beige-papier/60 rounded-lg transition-colors"
        >
          {inner}
        </a>
      ) : (
        <div
          aria-disabled="true"
          title="Réservation en ligne non disponible"
          className="flex flex-1 min-w-0 items-center gap-3 py-2 pr-2 opacity-50"
        >
          {inner}
        </div>
      )}

      {onChain && (
        <button
          type="button"
          onClick={() => onChain(showtime)}
          title="Que voir avant ou après cette séance ?"
          aria-label={`Enchaîner avec une autre séance autour de ${showtime.time}`}
          className="hidden md:flex w-11 h-11 shrink-0 items-center justify-center rounded-md border-2 border-sepia-chaud bg-beige-papier text-sepia-chaud hover:text-rouge-cinema hover:border-rouge-cinema transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.172 13.828a4 4 0 010-5.656l3-3a4 4 0 015.656 5.656l-1.5 1.5" />
          </svg>
        </button>
      )}

      <AddToSoireeButton film={film} showtime={showtime} city={city} className="w-11 h-11 shrink-0" />
    </div>
  );
}
