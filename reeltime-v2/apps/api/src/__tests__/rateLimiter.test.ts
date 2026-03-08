import { describe, it, expect } from 'vitest';
import { RateLimiter } from '../utils/rateLimiter.js';

describe('RateLimiter', () => {
  it('enforces minimum delay between calls', async () => {
    const limiter = new RateLimiter(100);

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // The second call should have waited ~100ms
    expect(elapsed).toBeGreaterThanOrEqual(90); // allow small variance
  });

  it('does not delay the first call', async () => {
    const limiter = new RateLimiter(200);

    const start = Date.now();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // First call should be near-instant
    expect(elapsed).toBeLessThan(50);
  });

  it('multiple sequential calls respect delay', async () => {
    const limiter = new RateLimiter(50);

    const start = Date.now();
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    const elapsed = Date.now() - start;

    // 3 calls with 50ms delay = at least ~100ms (2 waits)
    expect(elapsed).toBeGreaterThanOrEqual(90);
  });
});
