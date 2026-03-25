import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FilmListItem } from '../types/components';
import { FilmShowtimes } from './FilmShowtimes';

const NO_POSTER = '/images/no-poster.svg';

interface FilmDrawerProps {
  film: FilmListItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilmDrawer({ film, isOpen, onClose }: FilmDrawerProps) {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
        });
      });
    } else {
      setAnimating(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('drawer-active');
    } else {
      document.body.classList.remove('drawer-active');
    }
    return () => document.body.classList.remove('drawer-active');
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!visible || !film) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Details du film ${film.title}`}>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-noir-velours/70 z-40 transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom Sheet */}
      <BottomSheet film={film} onClose={onClose} animating={animating} />
    </div>,
    document.body,
  );
}

// --- Format runtime ---
function formatRuntime(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${m}min`;
}

// --- Bottom Sheet (always used, all screen sizes) ---

interface BottomSheetProps {
  film: FilmListItem;
  onClose: () => void;
  animating: boolean;
}

function BottomSheet({ film, onClose, animating }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentDelta = useRef(0);

  useEffect(() => {
    sheetRef.current?.focus();
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentDelta.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Don't allow swipe if scrolled inside content
    if (contentRef.current && contentRef.current.scrollTop > 0) return;

    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0 && sheetRef.current) {
      currentDelta.current = deltaY;
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
      sheetRef.current.style.transition = 'none';
    }
  };

  const handleTouchEnd = () => {
    if (!sheetRef.current) return;
    sheetRef.current.style.transition = '';
    if (currentDelta.current > 100) {
      onClose();
    } else {
      sheetRef.current.style.transform = '';
    }
    currentDelta.current = 0;
  };

  const runtimeStr = formatRuntime(film.runtime);

  return (
    <div
      ref={sheetRef}
      tabIndex={-1}
      id="filmDrawer"
      className={`fixed inset-x-0 bottom-0 max-w-4xl mx-auto z-50 transition-transform duration-300 ease-out outline-none ${
        animating ? 'drawer-open' : 'translate-y-full'
      }`}
    >
      {/* Curved top edge */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-32 h-6 bg-creme-ecran rounded-t-full border-t-2 border-x-2 border-sepia-chaud" />

      <div className="bg-creme-ecran rounded-t-3xl max-h-[85vh] overflow-hidden shadow-2xl border-t-4 border-rouge-cinema">
        {/* Handle bar and close button */}
        <div
          className="sticky top-0 bg-creme-ecran pt-3 pb-2 z-10 flex items-center justify-between px-4 border-b border-sepia-chaud/20"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-8" />
          <div
            className="w-16 h-1.5 bg-or-antique rounded-full cursor-pointer shadow-inner"
            onClick={onClose}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 flex items-center justify-center text-sepia-chaud hover:text-rouge-cinema transition rounded-full hover:bg-beige-papier"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div ref={contentRef} className="px-4 sm:px-6 pb-8 overflow-y-auto max-h-[calc(85vh-50px)]">
          {/* Film header: poster + title */}
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

          {/* Art Deco Divider */}
          <div className="mb-6">
            <svg viewBox="0 0 200 20" className="w-full h-5">
              <line x1="0" y1="10" x2="80" y2="10" stroke="#F9A825" strokeWidth="2" />
              <circle cx="100" cy="10" r="6" fill="#D32F2F" stroke="#F9A825" strokeWidth="2" />
              <line x1="120" y1="10" x2="200" y2="10" stroke="#F9A825" strokeWidth="2" />
            </svg>
          </div>

          {/* Showtimes */}
          <FilmShowtimes showtimes={film.showtimes} />

          {/* Secondary info */}
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
        </div>
      </div>
    </div>
  );
}
