export interface CinemaIdParam {
  id: number;
}

export interface CinemaShowtimesQuery {
  date: string; // YYYY-MM-DD
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(dateStr: string): boolean {
  if (!DATE_REGEX.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function parseCinemaIdParam(params: Record<string, unknown>): CinemaIdParam {
  const raw = params.id;
  const num = Number(raw);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('id must be a positive integer');
  }
  return { id: num };
}

export function parseCinemaShowtimesQuery(query: Record<string, unknown>): CinemaShowtimesQuery {
  const raw = query.date;
  if (raw === undefined || raw === null || raw === '') {
    // Default to today (Europe/Paris)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' });
    return { date: formatter.format(now) };
  }
  const dateStr = String(raw);
  if (!isValidDate(dateStr)) {
    throw new Error('Date must be in YYYY-MM-DD format');
  }
  return { date: dateStr };
}
