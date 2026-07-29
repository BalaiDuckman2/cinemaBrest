const DAYS_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const DAYS_FR_SHORT = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];
const MONTHS_FR_SHORT = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
export function localISODate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** The 7 dates (YYYY-MM-DD) starting at weekStart. */
export function weekDatesFrom(weekStart: string): string[] {
  const base = new Date(weekStart + 'T12:00:00Z');
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

/** "mar. 16" */
export function formatDayShort(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return `${DAYS_FR_SHORT[d.getUTCDay()]} ${d.getUTCDate()}`;
}

/** "Mardi 16 juin" */
export function formatDayLong(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = DAYS_FR[d.getUTCDay()];
  return `${day.charAt(0).toUpperCase()}${day.slice(1)} ${d.getUTCDate()} ${MONTHS_FR[d.getUTCMonth()]}`;
}

/** Current time "HH:MM" (zero-padded) in the user's local timezone. */
export function nowHHMM(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/** Date ISO décalée de n jours (n peut être négatif). */
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Lundi de la semaine calendaire contenant dateStr. */
export function mondayOf(dateStr: string): string {
  const dow = new Date(dateStr + 'T12:00:00Z').getUTCDay(); // 0 = dimanche
  return addDays(dateStr, -(dow === 0 ? 6 : dow - 1));
}

/** Toutes les dates de from à to inclus. Liste vide si to précède from. */
export function rangeDates(from: string, to: string): string[] {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

/** Dernier jour couvert par `weeks` semaines à partir de la semaine de today. */
export function rangeEnd(today: string, weeks: number): string {
  return addDays(mondayOf(today), weeks * 7 - 1);
}

/** Nombre de semaines à charger pour que `target` tombe dans la fenêtre. */
export function weeksNeededFor(target: string, today: string): number {
  if (target <= today) return 1;
  const from = Date.parse(mondayOf(today) + 'T12:00:00Z');
  const to = Date.parse(mondayOf(target) + 'T12:00:00Z');
  return Math.round((to - from) / (7 * 86_400_000)) + 1;
}

/**
 * Jour à présélectionner dans une semaine quand une date est obligatoire :
 * aujourd'hui si la semaine est en cours, son lundi si elle est à venir, son
 * dernier jour si elle est révolue. Retombe sur `today` tant que la semaine
 * n'est pas chargée.
 */
export function firstSelectableDate(weekDates: string[], today: string): string {
  if (weekDates.length === 0) return today;
  return weekDates.find((d) => d >= today) ?? weekDates[weekDates.length - 1];
}

/** "2 août" */
function formatDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z');
  return `${d.getUTCDate()} ${MONTHS_FR_SHORT[d.getUTCMonth()]}`;
}

/** "27 juil. - 2 août", vide tant que la meta de la semaine n'est pas là. */
export function formatWeekLabel(weekStart?: string, weekEnd?: string): string {
  if (!weekStart || !weekEnd) return '';
  return `${formatDayMonth(weekStart)} - ${formatDayMonth(weekEnd)}`;
}
