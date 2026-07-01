export { BaseAuthAxios } from '@base/base.auth..js';
export { BearerTokenStrategy } from '@auth/strategy/jwt.bearer.token.strategy.js';
export { CookieStrategy } from '@auth/strategy/jwt.cookie.strategy.js';
export { RefreshTokenStrategy } from '@auth/strategy/access-refresh.token.strategy.js';
export { ConsoleLogger } from '@auth/logger/logger.adapter.js';
export type { LoggerAdapter, LoggerConfig, BaseAuthConfig } from '@config/auth.config.js';
export type {
  RefreshTokenConfig,
  FailedRequestConfig,
  InterceptedRequestModifiedAxiosError,
} from '@lib/axios-custom.types.js';
