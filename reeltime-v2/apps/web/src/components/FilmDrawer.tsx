import { useEffect, useRef, useState } from 'react';
import type { FilmListItem, ShowtimeEntry } from '../types/components';
import { FilmShowtimes } from './FilmShowtimes';
import { SequencePanel } from './SequencePanel';
import { BottomSheet } from './ui/BottomSheet';

const NO_POSTER = '/images/no-poster.svg';

interface FilmDrawerProps {
  film: FilmListItem | null;
  isOpen: boolean;
  onClose: () => void;
  /** Catalogue complet, active l'enchaînement de séances. */
  films?: FilmListItem[];
  cityOf?: (cinemaId: string) => string | undefined;
  /** Appelé quand l'utilisateur choisit un autre film dans les suggestions. */
  onFilmSelect?: (film: FilmListItem) => void;
}

function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

export function FilmDrawer({ film, isOpen, onClose, films, cityOf, onFilmSelect }: FilmDrawerProps) {
  const [chainAnchor, setChainAnchor] = useState<ShowtimeEntry | null>(null);
  const filmId = film?.id;
  const bodyRef = useRef<HTMLDivElement>(null);

  // Changer de film réinitialise la vue enchaînement et remonte le contenu.
  useEffect(() => {
    setChainAnchor(null);
    bodyRef.current?.scrollIntoView({ block: 'start' });
  }, [filmId]);

  if (!film) return null;

  const chainEnabled = films != null && cityOf != null;
  const runtimeStr = formatRuntime(film.runtime);

  return (
    <BottomSheet open={isOpen} onClose={onClose} label={`Details du film ${film.title}`}>
      <div ref={bodyRef} className="px-4 sm:px-6 pb-8">
        <div className="flex gap-4 mb-6 mt-4">
          <img
            src={film.posterUrl ?? NO_POSTER}
            alt={film.title}
            className="w-24 h-36 object-cover rounded-lg shadow-lg flex-shrink-0 border-2 border-sepia-chaud"
            onError={(e) => { e.currentTarget.src = NO_POSTER; }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-playfair text-2xl font-bold text-noir-velours leading-tight">
              {film.title}
            </h3>
            <p className="font-crimson text-sepia-chaud text-sm mt-1 italic">
              {film.year ? `${film.year}` : ''}
              {film.year && runtimeStr ? ' · ' : ''}
              {runtimeStr}
            </p>
            {film.filmAge != null && film.filmAge > 0 && (
              <span className="font-bebas inline-block mt-2 bg-or-antique/20 text-sepia-chaud px-2 py-1 rounded text-xs uppercase tracking-wide border border-or-antique/40">
                Il y a {film.filmAge} ans
              </span>
            )}
            {film.letterboxdRating != null && (
              <p className="font-crimson text-or-antique text-sm mt-2">
                ★ {film.letterboxdRating.toFixed(1)} Letterboxd
              </p>
            )}
            {film.letterboxdUrl && (
              <a
                href={film.letterboxdUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-crimson inline-flex items-center gap-1 mt-2 text-rouge-cinema text-sm hover:text-bordeaux-profond underline"
              >
                Voir sur Letterboxd
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        </div>

        <div className="mb-6">
          <svg viewBox="0 0 200 20" className="w-full h-5" aria-hidden="true">
            <line x1="0" y1="10" x2="80" y2="10" stroke="#F9A825" strokeWidth="2" />
            <circle cx="100" cy="10" r="6" fill="#D32F2F" stroke="#F9A825" strokeWidth="2" />
            <line x1="120" y1="10" x2="200" y2="10" stroke="#F9A825" strokeWidth="2" />
          </svg>
        </div>

        {chainAnchor && chainEnabled ? (
          <SequencePanel
            anchorFilm={film}
            anchor={chainAnchor}
            films={films}
            cityOf={cityOf}
            onBack={() => setChainAnchor(null)}
            onFilmClick={(f) => {
              setChainAnchor(null);
              onFilmSelect?.(f);
            }}
          />
        ) : (
          <>
            <FilmShowtimes
              showtimes={film.showtimes}
              film={film}
              onChain={chainEnabled ? setChainAnchor : undefined}
              cityOf={cityOf}
            />

            <div className="border-t-2 border-sepia-chaud/30 pt-6 space-y-3 text-sm">
              {film.director && (
                <p className="font-crimson text-noir-velours">
                  <span className="font-bold text-rouge-cinema">Réalisateur:</span> {film.director}
                </p>
              )}
              {film.genres.length > 0 && (
                <p className="font-crimson text-noir-velours">
                  <span className="font-bold text-rouge-cinema">Genre:</span> {film.genres.join(', ')}
                </p>
              )}
              {film.cast.length > 0 && (
                <p className="font-crimson text-noir-velours">
                  <span className="font-bold text-rouge-cinema">Casting:</span> {film.cast.join(', ')}
                </p>
              )}
              {film.synopsis && (
                <p className="font-crimson text-sepia-chaud text-xs mt-4 leading-relaxed italic">
                  {film.synopsis}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
