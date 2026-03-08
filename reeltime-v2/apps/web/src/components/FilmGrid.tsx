import type { FilmListItem } from '../types/components';
import { FilmCard } from './FilmCard';

interface FilmGridProps {
  films: FilmListItem[];
  onFilmClick: (film: FilmListItem) => void;
}

export function FilmGrid({ films, onFilmClick }: FilmGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
      {films.map((film) => (
        <FilmCard key={film.id} film={film} onClick={onFilmClick} />
      ))}
    </div>
  );
}
