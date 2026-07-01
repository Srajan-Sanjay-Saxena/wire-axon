import { RetryConfig } from "@config/retry.engine.config.js";

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
};

export { DEFAULT_RETRY_CONFIG };