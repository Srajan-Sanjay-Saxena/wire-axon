import {
  RetryConfig,
  RetryableError,
} from '@config/retry.engine.config.js';
import { DEFAULT_RETRY_CONFIG } from '@options/retry.default.options.js';

export class RetryEngine {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  shouldRetry(attempt: number, error: unknown): boolean {
    if (attempt >= this.config.maxRetries) return false;

    // Not an object — can't inspect, don't retry
    if (!error || typeof error !== 'object') return false;

    // Network error (no response property)
    if (!('response' in error) && this.config.retryOnNetworkError) return true;

    // Check if status code is retryable
    const { response } = (error as RetryableError);
    const status = response?.status;

    if (status && this.config.retryableStatuses.includes(status)) {
      return true;
    }

    return false;
  }

  getDelay(attempt: number): number {
    const delay = this.config.baseDelay * this.config.backoffFactor ** attempt;

    // Add jitter (±25%) to prevent thundering herd
    const jitter = delay * 0.25 * (Math.random() * 2 - 1);
    return Math.min(delay + jitter, this.config.maxDelay);
  }

  async execute<TArgs extends unknown[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    ...args: TArgs
  ): Promise<TReturn> {
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const data = await fn(...args);
        return data;
      } catch (error: unknown) {
        if (!this.shouldRetry(attempt, error)) {
          throw error;
        }

        const delay = this.getDelay(attempt);
        await this.sleep(delay);
      }
    }
    // Unreachable — last attempt always throws from catch
    throw new Error('Max retries exceeded');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
