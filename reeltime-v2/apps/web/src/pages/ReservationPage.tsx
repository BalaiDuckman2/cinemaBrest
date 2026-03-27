import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { ShowtimeEntry } from '../types/components';

const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

const NO_POSTER = '/images/no-poster.svg';

interface ReservationFilm {
  title: string;
  year: number;
  posterUrl: string | null;
  runtime: number | null;
  director: string | null;
  genres: string[];
}

interface ReservationState {
  film: ReservationFilm;
  showtime: ShowtimeEntry;
}

function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

function formatDateFr(datetime: string): string {
  const date = new Date(datetime);
  const dayName = DAYS_FR[date.getDay()];
  const dayNumber = date.getDate();
  const monthName = MONTHS_FR[date.getMonth()];
  return `${dayName} ${dayNumber} ${monthName}`;
}

export function ReservationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as ReservationState | null;

  useEffect(() => {
    if (!state?.film || !state?.showtime) {
      navigate('/', { replace: true });
    }
  }, [state, navigate]);

  if (!state?.film || !state?.showtime) return null;

  const { film, showtime } = state;
  const runtimeStr = formatRuntime(film.runtime);
  const dateStr = formatDateFr(showtime.datetime);

  return (
    <div className="min-h-screen bg-beige-papier py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back link */}
        <Link
          to="/"
          className="font-crimson text-rouge-cinema hover:text-bordeaux-profond inline-flex items-center gap-2 mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux films
        </Link>

        {/* Ticket card */}
        <div className="ticket-card vintage-texture p-6 sm:p-8">
          {/* Title */}
          <h1 className="font-bebas text-rouge-cinema text-3xl uppercase tracking-wider text-center mb-2">
            Votre Séance
          </h1>

          {/* Art Deco Divider */}
          <div className="mb-6">
            <svg viewBox="0 0 200 20" className="w-full h-5">
              <line x1="0" y1="10" x2="80" y2="10" stroke="#F9A825" strokeWidth="2" />
              <circle cx="100" cy="10" r="6" fill="#D32F2F" stroke="#F9A825" strokeWidth="2" />
              <line x1="120" y1="10" x2="200" y2="10" stroke="#F9A825" strokeWidth="2" />
            </svg>
          </div>

          {/* Film info */}
          <div className="flex gap-4 mb-6">
            <img
              src={film.posterUrl ?? NO_POSTER}
              alt={film.title}
              className="w-24 h-36 object-cover rounded-lg shadow-lg flex-shrink-0 border-2 border-sepia-chaud"
              onError={(e) => { e.currentTarget.src = NO_POSTER; }}
            />
            <div className="flex-1 min-w-0">
              <h2 className="font-playfair text-2xl font-bold text-noir-velours leading-tight">
                {film.title}
              </h2>
              <p className="font-crimson text-sepia-chaud text-sm mt-1 italic">
                {film.year ? `${film.year}` : ''}
                {film.year && runtimeStr ? ' · ' : ''}
                {runtimeStr}
              </p>
              {film.director && (
                <p className="font-crimson text-noir-velours text-sm mt-2">
                  <span className="font-bold text-rouge-cinema">Réalisateur:</span> {film.director}
                </p>
              )}
              {film.genres.length > 0 && (
                <p className="font-crimson text-noir-velours text-sm mt-1">
                  <span className="font-bold text-rouge-cinema">Genre:</span> {film.genres.join(', ')}
                </p>
              )}
            </div>
          </div>

          {/* Perforated separator */}
          <div className="border-t-2 border-dashed border-sepia-chaud/40 my-6" />

          {/* Showtime details */}
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <span className="w-1.5 h-5 bg-rouge-cinema rounded-full" />
              <span className="font-bebas text-noir-velours text-lg uppercase tracking-wider">
                {showtime.cinemaName}
              </span>
            </div>

            <p className="font-crimson text-sepia-chaud text-base capitalize">
              {dateStr}
            </p>

            <p className="font-bebas text-rouge-cinema text-5xl tracking-wide">
              {showtime.time}
            </p>

            {showtime.version && showtime.version !== 'OTHER' && (
              <span className="font-bebas inline-block bg-or-antique/20 text-sepia-chaud px-3 py-1 rounded text-sm uppercase tracking-wide border border-or-antique/40">
                {showtime.version}
              </span>
            )}
          </div>

          {/* Perforated separator */}
          <div className="border-t-2 border-dashed border-sepia-chaud/40 my-6" />

          {/* Booking button */}
          {showtime.bookingUrl ? (
            <a
              href={showtime.bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center font-bebas text-creme-ecran uppercase tracking-wider text-lg py-3 rounded-lg border-2 border-or-antique hover:border-jaune-marquise transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #D32F2F 0%, #B71C1C 100%)' }}
            >
              Réserver
            </a>
          ) : (
            <div className="text-center">
              <button
                type="button"
                disabled
                className="w-full font-bebas text-creme-ecran uppercase tracking-wider text-lg py-3 rounded-lg border-2 border-sepia-chaud/30 opacity-50 cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #9E9E9E 0%, #757575 100%)' }}
              >
                Réserver
              </button>
              <p className="font-crimson text-sepia-chaud text-xs italic mt-2">
                Lien de réservation non disponible
              </p>
            </div>
          )}
        </div>

        {/* Secondary back link */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="font-crimson text-sepia-chaud hover:text-rouge-cinema text-sm underline transition-colors"
          >
            Retour aux films
          </Link>
        </div>
      </div>
    </div>
  );
}
