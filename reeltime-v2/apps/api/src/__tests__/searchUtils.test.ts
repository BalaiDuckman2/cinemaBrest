import { describe, it, expect } from 'vitest';
import { normalizeText, matchesSearch } from '../utils/searchUtils.js';

describe('normalizeText', () => {
  it('removes accents', () => {
    expect(normalizeText('éàûöç')).toBe('eauoc');
  });

  it('converts to lowercase', () => {
    expect(normalizeText('HELLO World')).toBe('hello world');
  });

  it('trims whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('handles combined accents and case', () => {
    expect(normalizeText('L\'Étoile de Noël')).toBe('l\'etoile de noel');
  });

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('');
  });
});

describe('matchesSearch', () => {
  it('matches case insensitively', () => {
    expect(matchesSearch('Nosferatu', 'nosf')).toBe(true);
    expect(matchesSearch('HELLO', 'hello')).toBe(true);
  });

  it('matches accent insensitively (étoile matches etoile)', () => {
    expect(matchesSearch('L\'Étoile de Noël', 'etoile')).toBe(true);
    expect(matchesSearch('Amélie', 'amelie')).toBe(true);
  });

  it('matches accented query against plain text', () => {
    expect(matchesSearch('Amelie', 'amélie')).toBe(true);
  });

  it('returns true for empty query (matches everything)', () => {
    expect(matchesSearch('Any Film Title', '')).toBe(true);
  });

  it('returns false when text does not contain query', () => {
    expect(matchesSearch('Nosferatu', 'batman')).toBe(false);
  });

  it('supports partial matching', () => {
    expect(matchesSearch('Le Comte de Monte-Cristo', 'monte')).toBe(true);
  });
});
