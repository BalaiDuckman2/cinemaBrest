import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useScrollLock } from '../../hooks/useScrollLock';
import { ownsDragGesture, shouldDismiss, type DragSample } from '../../utils/gestures';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** aria-label du dialogue. */
  label: string;
  /** Hauteur maximale CSS, défaut '85vh'. */
  maxHeight?: string;
  children: ReactNode;
}

/** Distance de glissement au bout de laquelle le fond est totalement transparent. */
const BACKDROP_FADE_PX = 400;
/** Tolérance avant de décider qu'un mouvement est un glissement et non un scroll. */
const DRAG_START_PX = 4;
/** Durée de l'animation d'entrée/sortie, alignée sur duration-300. */
const ANIM_MS = 300;

export function BottomSheet({
  open,
  onClose,
  label,
  maxHeight = '85vh',
  children,
}: BottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);

  // Montage puis animation d'entrée sur deux frames, pour que la transition
  // parte bien de translate-y-full.
  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() =>
        requestAnimationFrame(() => setAnimating(true)),
      );
      return () => cancelAnimationFrame(id);
    }
    setAnimating(false);
    const timer = setTimeout(() => setMounted(false), ANIM_MS);
    return () => clearTimeout(timer);
  }, [open]);

  // Remise à zéro des styles inline laissés par un précédent glissement.
  useEffect(() => {
    if (!open) return;
    if (sheetRef.current) sheetRef.current.style.transform = '';
    if (backdropRef.current) backdropRef.current.style.opacity = '';
  }, [open]);

  useEffect(() => {
    if (mounted) sheetRef.current?.focus();
  }, [mounted]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Glissement. Les écouteurs sont posés à la main : le onTouchMove de React
  // ne permet pas de bloquer le scroll de la page de façon fiable.
  useEffect(() => {
    const sheet = sheetRef.current;
    if (!sheet || !mounted) return;

    let startY = 0;
    let delta = 0;
    let dragging = false;
    // Vrai quand le geste a commencé sur un contrôle qui le possède déjà : la
    // feuille se tient alors à l'écart jusqu'au prochain touchstart.
    let handedOver = false;
    let samples: DragSample[] = [];

    const onStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      delta = 0;
      dragging = false;
      handedOver = ownsDragGesture(e.target);
      samples = [{ y: startY, t: e.timeStamp }];
    };

    const onMove = (e: TouchEvent) => {
      if (handedOver) return;
      const y = e.touches[0].clientY;
      const dy = y - startY;

      if (!dragging) {
        // On ne prend la main que si le contenu est déjà en haut : sinon le
        // geste appartient au scroll interne.
        const atTop = (contentRef.current?.scrollTop ?? 0) <= 0;
        if (dy > DRAG_START_PX && atTop) {
          dragging = true;
          sheet.style.willChange = 'transform';
          sheet.style.transition = 'none';
        } else {
          return;
        }
      }
      if (dy < 0) return;

      e.preventDefault();
      delta = dy;
      samples.push({ y, t: e.timeStamp });
      if (samples.length > 5) samples.shift();

      sheet.style.transform = `translateY(${dy}px)`;
      if (backdropRef.current) {
        backdropRef.current.style.opacity = String(Math.max(0, 1 - dy / BACKDROP_FADE_PX));
      }
    };

    const onEnd = () => {
      handedOver = false;
      if (!dragging) return;
      sheet.style.willChange = '';
      sheet.style.transition = '';
      if (shouldDismiss(delta, samples)) {
        onClose();
      } else {
        sheet.style.transform = '';
        if (backdropRef.current) backdropRef.current.style.opacity = '';
      }
      dragging = false;
      delta = 0;
    };

    sheet.addEventListener('touchstart', onStart, { passive: true });
    sheet.addEventListener('touchmove', onMove, { passive: false });
    sheet.addEventListener('touchend', onEnd);
    sheet.addEventListener('touchcancel', onEnd);
    return () => {
      sheet.removeEventListener('touchstart', onStart);
      sheet.removeEventListener('touchmove', onMove);
      sheet.removeEventListener('touchend', onEnd);
      sheet.removeEventListener('touchcancel', onEnd);
    };
  }, [mounted, onClose]);

  if (!mounted) return null;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={label}>
      <div
        ref={backdropRef}
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-noir-velours/70 z-40 transition-opacity duration-300 ${
          animating ? 'opacity-100' : 'opacity-0'
        }`}
      />

      <div
        ref={sheetRef}
        tabIndex={-1}
        className={`fixed inset-x-0 bottom-0 max-w-4xl mx-auto z-50 outline-none transition-transform duration-300 ease-out ${
          animating ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div
          className="bg-creme-ecran rounded-t-3xl overflow-hidden shadow-2xl border-t-4 border-rouge-cinema"
          style={{ maxHeight }}
        >
          <div className="sticky top-0 bg-creme-ecran pt-3 pb-2 z-10 flex items-center justify-between px-4 border-b border-sepia-chaud/20">
            <div className="w-11" />
            <div className="w-16 h-1.5 bg-or-antique rounded-full shadow-inner" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="w-11 h-11 flex items-center justify-center text-sepia-chaud hover:text-rouge-cinema transition rounded-full hover:bg-beige-papier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div
            ref={contentRef}
            className="overflow-y-auto overscroll-contain"
            style={{ maxHeight: `calc(${maxHeight} - 56px)` }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
