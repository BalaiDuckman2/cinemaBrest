interface WeekNavigatorProps {
  weekOffset: number;
  weekLabel: string;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

export function WeekNavigator({
  weekOffset,
  weekLabel,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  return (
    <div className="bg-beige-papier border-2 border-sepia-chaud rounded-xl md:rounded-2xl p-3 sm:p-5 mb-4 sm:mb-6 shadow-md">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-center">
          <button
            type="button"
            onClick={onPrevWeek}
            aria-label="Semaine precedente"
            className="font-bebas px-3 sm:px-6 py-2 sm:py-2.5 bg-creme-ecran hover:bg-or-antique/20 border-2 border-sepia-chaud hover:border-rouge-cinema rounded-lg sm:rounded-xl text-noir-velours text-sm sm:text-base uppercase tracking-wide transition-all duration-200 hover:-translate-x-1"
          >
            <span className="hidden sm:inline">&larr; Précédent</span>
            <span className="sm:hidden">&larr;</span>
          </button>

          <div className="font-crimson px-3 sm:px-8 py-2 sm:py-2.5 bg-rouge-cinema border-2 border-bordeaux-profond rounded-lg sm:rounded-xl text-creme-ecran text-xs sm:text-base font-semibold text-center flex-1 sm:flex-none shadow-md">
            <span className="hidden sm:inline">📅 </span>
            {weekLabel}
          </div>

          <button
            type="button"
            onClick={onNextWeek}
            aria-label="Semaine suivante"
            className="font-bebas px-3 sm:px-6 py-2 sm:py-2.5 bg-creme-ecran hover:bg-or-antique/20 border-2 border-sepia-chaud hover:border-rouge-cinema rounded-lg sm:rounded-xl text-noir-velours text-sm sm:text-base uppercase tracking-wide transition-all duration-200 hover:translate-x-1"
          >
            <span className="hidden sm:inline">Suivant &rarr;</span>
            <span className="sm:hidden">&rarr;</span>
          </button>
        </div>

        {weekOffset !== 0 && (
          <button
            type="button"
            onClick={onToday}
            className="font-bebas px-3 sm:px-4 py-2 sm:py-2.5 bg-jaune-marquise hover:bg-or-antique border-2 border-or-antique rounded-lg sm:rounded-xl text-noir-velours text-sm sm:text-base font-bold uppercase tracking-wide transition-all duration-200 hover:scale-105 shadow-lg"
          >
            <span className="hidden sm:inline">🎬 Aujourd&apos;hui</span>
            <span className="sm:hidden">Aujourd&apos;hui</span>
          </button>
        )}
      </div>
    </div>
  );
}
