import { normalizeText } from '../../utils/normalizeText';

describe('normalizeText', () => {
  it('removes acute accents', () => {
    expect(normalizeText('éàù')).toBe('eau');
  });

  it('removes grave accents', () => {
    expect(normalizeText('è')).toBe('e');
  });

  it('removes circumflex accents', () => {
    expect(normalizeText('ê')).toBe('e');
    expect(normalizeText('ô')).toBe('o');
  });

  it('removes cedilla', () => {
    expect(normalizeText('ç')).toBe('c');
  });

  it('removes diaeresis', () => {
    expect(normalizeText('ë')).toBe('e');
    expect(normalizeText('ï')).toBe('i');
    expect(normalizeText('ü')).toBe('u');
  });

  it('converts to lowercase', () => {
    expect(normalizeText('HELLO')).toBe('hello');
    expect(normalizeText('BoNjOuR')).toBe('bonjour');
  });

  it('handles combined accents and uppercase', () => {
    expect(normalizeText('Éléphant')).toBe('elephant');
    expect(normalizeText('François')).toBe('francois');
    expect(normalizeText('Amélie')).toBe('amelie');
  });

  it('handles empty string', () => {
    expect(normalizeText('')).toBe('');
  });

  it('handles string with no accents', () => {
    expect(normalizeText('hello world')).toBe('hello world');
  });

  it('preserves numbers and special characters', () => {
    expect(normalizeText('Film #1 (2024)')).toBe('film #1 (2024)');
  });
});
