function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class RateLimiter {
  private lastCallTime = 0;
  private readonly minDelayMs: number;

  constructor(minDelayMs: number = 200) {
    this.minDelayMs = minDelayMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastCallTime;
    if (elapsed < this.minDelayMs) {
      await sleep(this.minDelayMs - elapsed);
    }
    this.lastCallTime = Date.now();
  }
}
