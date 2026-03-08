import { describe, it, expect } from 'vitest';
import { buildCacheKey } from '../types/cache.js';

describe('buildCacheKey', () => {
  it('builds correct key format', () => {
    expect(buildCacheKey('P0153', '2025-01-15')).toBe('showtimes:P0153:2025-01-15');
  });

  it('handles different cinema IDs', () => {
    expect(buildCacheKey('G02PD', '2025-06-30')).toBe('showtimes:G02PD:2025-06-30');
  });
});
