import { describe, it, expect } from 'vitest';
import { parseCinemaIdParam, parseCinemaShowtimesQuery } from '../schemas/cinemaSchemas.js';

describe('parseCinemaIdParam', () => {
  it('parses valid positive integer id', () => {
    expect(parseCinemaIdParam({ id: '1' })).toEqual({ id: 1 });
    expect(parseCinemaIdParam({ id: 42 })).toEqual({ id: 42 });
  });

  it('throws for zero id', () => {
    expect(() => parseCinemaIdParam({ id: '0' })).toThrow();
  });

  it('throws for negative id', () => {
    expect(() => parseCinemaIdParam({ id: '-1' })).toThrow();
  });

  it('throws for non-numeric id', () => {
    expect(() => parseCinemaIdParam({ id: 'abc' })).toThrow();
  });
});

describe('parseCinemaShowtimesQuery', () => {
  it('parses valid YYYY-MM-DD date', () => {
    expect(parseCinemaShowtimesQuery({ date: '2025-01-15' })).toEqual({ date: '2025-01-15' });
  });

  it('defaults to today when date is omitted', () => {
    const result = parseCinemaShowtimesQuery({});
    // Should be a valid date string
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('defaults to today for undefined date', () => {
    const result = parseCinemaShowtimesQuery({ date: undefined });
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('defaults to today for empty string date', () => {
    const result = parseCinemaShowtimesQuery({ date: '' });
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('throws for invalid date format', () => {
    expect(() => parseCinemaShowtimesQuery({ date: '15-01-2025' })).toThrow();
    expect(() => parseCinemaShowtimesQuery({ date: 'not-a-date' })).toThrow();
  });

  it('throws for invalid date values (e.g., Feb 30)', () => {
    expect(() => parseCinemaShowtimesQuery({ date: '2025-02-30' })).toThrow();
  });
});
