export interface RetryOptions {
  maxAttempts: number;
  baseDelayMs: number;
  backoffMultiplier: number;
}

const defaultOptions: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 200,
  backoffMultiplier: 2,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T | null> {
  const opts = { ...defaultOptions, ...options };

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      const isRetryable = isRetryableError(err);

      if (!isRetryable || attempt === opts.maxAttempts) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(
          `[retry] All ${opts.maxAttempts} attempts exhausted: ${errMsg}. Returning null.`,
        );
        return null;
      }

      const errMsg = err instanceof Error ? err.message : String(err);
      const delay = opts.baseDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1);
      console.warn(
        `[retry] Attempt ${attempt}/${opts.maxAttempts} failed: ${errMsg}. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  return null;
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof FetchError) {
    const status = err.status;
    // Retry on 429 (rate limit) and 5xx (server errors)
    if (status === 429 || (status >= 500 && status < 600)) {
      return true;
    }
  }
  // Retry on network errors / timeouts
  if (err instanceof TypeError || err instanceof DOMException) {
    return true;
  }
  // Generic network errors
  if (err instanceof Error && err.message.includes('timeout')) {
    return true;
  }
  return true; // Default to retryable for unknown errors
}

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'FetchError';
  }
}
