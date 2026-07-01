interface LoggerAdapter {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

interface BaseAuthConfig {
  getAccessToken: () => string | null;
  refreshAccessTokenFunc: () => Promise<{ accessToken: string }>;
  onRefreshFailure: () => void;
  tokenHeaderKey?: string;
  tokenPrefix?: string;
}

interface LoggerConfig {
  logger: LoggerAdapter | undefined;
}

export type { LoggerAdapter, LoggerConfig, BaseAuthConfig };
