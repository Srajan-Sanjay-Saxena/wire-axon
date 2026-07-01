interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableStatuses: number[];
  retryOnNetworkError: boolean;
}

interface RetryableError {
  response?: { status: number };
  code?: string;
}

export type { RetryConfig , RetryableError };