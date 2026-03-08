import type { FilmListItem } from '../types/components';

const NO_POSTER = '/images/no-poster.svg';

interface FilmCardProps {
  film: FilmListItem;
  onClick: (film: FilmListItem) => void;
}

export function FilmCard({ film, onClick }: FilmCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(film)}
      className="ticket-card vintage-texture spotlight-glow cursor-pointer overflow-hidden w-full text-left"
    >
      <div className="relative">
        <img
          src={film.posterUrl ?? NO_POSTER}
          alt={film.title}
          className="w-full h-56 sm:h-64 md:h-72 lg:h-80 object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = NO_POSTER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-velours via-transparent to-transparent opacity-60" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h2 className="font-playfair text-base sm:text-lg font-bold text-creme-ecran drop-shadow-lg line-clamp-2">
            {film.title}
          </h2>
          {film.year != null && (
            <p className="font-crimson text-xs text-or-antique mt-0.5 italic">
              {film.year}
            </p>
          )}
        </div>
      </div>
      <div className="h-2 bg-gradient-to-r from-transparent via-sepia-chaud to-transparent opacity-30" />
    </button>
  );
}
