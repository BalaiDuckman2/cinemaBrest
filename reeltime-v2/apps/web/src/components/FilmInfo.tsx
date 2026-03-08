import { useState } from 'react';
import type { FilmListItem } from '../types/components';

const NO_POSTER = '/images/no-poster.svg';

interface FilmInfoProps {
  film: FilmListItem;
}

export function FilmInfo({ film }: FilmInfoProps) {
  const [synopsisExpanded, setSynopsisExpanded] = useState(false);

  return (
    <div>
      {/* Poster with gradient overlay */}
      <div className="relative">
        <img
          src={film.posterUrl ?? NO_POSTER}
          alt={film.title}
          className="h-56 w-full object-cover"
          onError={(e) => {
            e.currentTarget.src = NO_POSTER;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir-velours/80 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4">
          <h2 className="font-playfair text-headline text-creme-ecran">
            {film.title}
          </h2>
          <div className="mt-1 flex items-center gap-3">
            <span className="font-crimson text-body text-beige-papier/80">
              {film.year}
              {film.filmAge != null && film.filmAge > 0
                ? ` (${film.filmAge} ans)`
                : ''}
            </span>
            {film.rating != null && (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rouge-cinema font-bebas text-caption text-creme-ecran">
                {film.rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 p-4">
        {/* Genres */}
        {film.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {film.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full bg-beige-papier px-2 py-0.5 font-crimson text-caption text-sepia-chaud"
              >
                {genre}
              </span>
            ))}
          </div>
        )}

        {/* Director */}
        {film.director && (
          <p className="font-crimson text-body text-noir-velours">
            <span className="text-sepia-chaud">R&eacute;alisation : </span>
            {film.director}
          </p>
        )}

        {/* Cast */}
        {film.cast.length > 0 && (
          <p className="font-crimson text-body text-noir-velours">
            <span className="text-sepia-chaud">Avec : </span>
            {film.cast.join(', ')}
          </p>
        )}

        {/* Runtime */}
        {film.runtime != null && film.runtime > 0 && (
          <p className="font-crimson text-body text-sepia-chaud">
            {Math.floor(film.runtime / 60) > 0
              ? `${Math.floor(film.runtime / 60)}h `
              : ''}
            {(film.runtime % 60).toString().padStart(2, '0')}min
          </p>
        )}

        {/* Synopsis */}
        {film.synopsis && (
          <div>
            <p
              className={`font-crimson text-body text-noir-velours/80 transition-all duration-200/80 ${
                synopsisExpanded ? '' : 'line-clamp-3'
              }`}
            >
              {film.synopsis}
            </p>
            <button
              type="button"
              onClick={() => setSynopsisExpanded(!synopsisExpanded)}
              className="mt-1 font-crimson text-caption text-rouge-cinema hover:text-bordeaux-profond"
            >
              {synopsisExpanded ? 'Voir moins' : 'Voir plus'}
            </button>
          </div>
        )}

        {/* Letterboxd link */}
        {film.letterboxdUrl && (
          <a
            href={film.letterboxdUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-crimson text-caption text-rouge-cinema hover:text-bordeaux-profond"
          >
            Voir sur Letterboxd
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-3.5 w-3.5"
            >
              <path
                fillRule="evenodd"
                d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5zm7.25-.182a.75.75 0 01.75-.75h3.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0V6.56l-5.22 5.22a.75.75 0 11-1.06-1.06l5.22-5.22h-2.19a.75.75 0 01-.75-.75z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}
