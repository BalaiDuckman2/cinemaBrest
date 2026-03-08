import { describe, it, expect } from 'vitest';
import {
  filmFilterSchema,
  filmSearchSchema,
  parseFilmListQuery,
  parseFilmIdParam,
} from '../schemas/filmSchemas.js';

describe('filmFilterSchema', () => {
  it('accepts valid filter input', () => {
    const result = filmFilterSchema.safeParse({
      weekOffset: 1,
      q: 'nosferatu',
      version: 'VO',
      minTime: '14:00',
      minRating: 3.5,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weekOffset).toBe(1);
      expect(result.data.q).toBe('nosferatu');
      expect(result.data.version).toBe('VO');
      expect(result.data.minTime).toBe('14:00');
      expect(result.data.minRating).toBe(3.5);
    }
  });

  it('defaults weekOffset to 0 when omitted', () => {
    const result = filmFilterSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weekOffset).toBe(0);
    }
  });

  it('rejects weekOffset > 52', () => {
    const result = filmFilterSchema.safeParse({ weekOffset: 53 });
    expect(result.success).toBe(false);
  });

  it('rejects weekOffset < -52', () => {
    const result = filmFilterSchema.safeParse({ weekOffset: -53 });
    expect(result.success).toBe(false);
  });

  it('validates version enum (only VO, VF, VOST)', () => {
    expect(filmFilterSchema.safeParse({ version: 'VO' }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ version: 'VF' }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ version: 'VOST' }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ version: 'INVALID' }).success).toBe(false);
  });

  it('validates minTime format (HH:mm)', () => {
    expect(filmFilterSchema.safeParse({ minTime: '14:30' }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ minTime: '00:00' }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ minTime: '23:59' }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ minTime: '25:00' }).success).toBe(false);
    expect(filmFilterSchema.safeParse({ minTime: '14:60' }).success).toBe(false);
    expect(filmFilterSchema.safeParse({ minTime: '2:30' }).success).toBe(false);
    expect(filmFilterSchema.safeParse({ minTime: 'invalid' }).success).toBe(false);
  });

  it('validates minRating range (0-5)', () => {
    expect(filmFilterSchema.safeParse({ minRating: 0 }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ minRating: 5 }).success).toBe(true);
    expect(filmFilterSchema.safeParse({ minRating: -1 }).success).toBe(false);
    expect(filmFilterSchema.safeParse({ minRating: 6 }).success).toBe(false);
  });

  it('coerces string numbers for weekOffset and minRating', () => {
    const result = filmFilterSchema.safeParse({
      weekOffset: '2',
      minRating: '3',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weekOffset).toBe(2);
      expect(result.data.minRating).toBe(3);
    }
  });
});

describe('filmSearchSchema', () => {
  it('accepts valid search input', () => {
    const result = filmSearchSchema.safeParse({ q: 'batman', limit: 10, offset: 5 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('batman');
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(5);
    }
  });

  it('rejects empty query', () => {
    const result = filmSearchSchema.safeParse({ q: '' });
    expect(result.success).toBe(false);
  });

  it('defaults limit to 50 and offset to 0', () => {
    const result = filmSearchSchema.safeParse({ q: 'test' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(50);
      expect(result.data.offset).toBe(0);
    }
  });

  it('rejects limit > 200', () => {
    const result = filmSearchSchema.safeParse({ q: 'test', limit: 201 });
    expect(result.success).toBe(false);
  });
});

describe('parseFilmListQuery', () => {
  it('defaults to weekOffset 0 when omitted', () => {
    expect(parseFilmListQuery({})).toEqual({ weekOffset: 0 });
    expect(parseFilmListQuery({ weekOffset: undefined })).toEqual({ weekOffset: 0 });
    expect(parseFilmListQuery({ weekOffset: '' })).toEqual({ weekOffset: 0 });
  });

  it('parses valid weekOffset', () => {
    expect(parseFilmListQuery({ weekOffset: '5' })).toEqual({ weekOffset: 5 });
    expect(parseFilmListQuery({ weekOffset: -3 })).toEqual({ weekOffset: -3 });
  });

  it('throws for invalid weekOffset', () => {
    expect(() => parseFilmListQuery({ weekOffset: '53' })).toThrow();
    expect(() => parseFilmListQuery({ weekOffset: 'abc' })).toThrow();
    expect(() => parseFilmListQuery({ weekOffset: '1.5' })).toThrow();
  });
});

describe('parseFilmIdParam', () => {
  it('parses valid positive integer id', () => {
    expect(parseFilmIdParam({ id: '42' })).toEqual({ id: 42 });
    expect(parseFilmIdParam({ id: 1 })).toEqual({ id: 1 });
  });

  it('throws for non-positive id', () => {
    expect(() => parseFilmIdParam({ id: '0' })).toThrow();
    expect(() => parseFilmIdParam({ id: '-1' })).toThrow();
  });

  it('throws for non-integer id', () => {
    expect(() => parseFilmIdParam({ id: 'abc' })).toThrow();
    expect(() => parseFilmIdParam({ id: '1.5' })).toThrow();
  });
});
