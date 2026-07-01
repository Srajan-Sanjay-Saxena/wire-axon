// Core services
export { ApiServiceFactory } from "./services/api.factory.service.js";
export { BaseApiService } from "./base/http.client.base.js";
export { TanStackApiService } from "./services/tanstack.service.js";
export { AsyncThunkApiService } from "./services/thunk.service.js";
export { RequestCancellationManager } from "./features/cancellation.feature.js";

// Features
export {
  RetryEngine,
  DEFAULT_RETRY_CONFIG,
} from "./features/retry.engine.feature.js";
export { MiddlewarePipeline } from "./features/middleware.pipeline.feature.js";

// Auth
export { BaseAuthAxios } from "./base/base.auth..js";
export { BearerTokenStrategy } from "./auth/strategy/jwt.bearer.token.strategy.js";
export { CookieStrategy } from "./auth/strategy/jwt.cookie.strategy.js";
export { RefreshTokenStrategy } from "./auth/strategy/access-refresh.token.strategy.js";
export { ConsoleLogger } from "./auth/logger/logger.adapter.js";

// Validation
export { ApiValidationService } from "./helper/validation.manager.js";

// Hooks
export { useApiQuery } from "./hooks/useQueryApiService.js";
export { useApiMutation } from "./hooks/useMutationApiService.js";
export { useScratchQuery } from "./hooks/useScratchServiceQuery.js";
export { useScratchMutation } from "./hooks/useScratchServiceMutation.js";

// Types
export type { ServiceConfig } from "./config/http.client.config.js";
export type { RetryConfig } from "./config/retry.engine.config.js";
export type {
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  MiddlewareConfig,
} from "./config/middleware.config.js";
export type {
  LoggerAdapter,
  LoggerConfig,
  BaseAuthConfig,
} from "./config/auth.config.js";
export type {
  RefreshTokenConfig,
  FailedRequestConfig,
  InterceptedRequestModifiedAxiosError,
} from "./types/axios-custom.types.js";
export type {
  HttpMethodsType,
  AllowedKeysType,
  ApiConfig,
} from "./types/api.config.types.js";
export type {
  ValidatedUrl,
  ValidatedBody,
  ValidatedGetConfig,
  ValidatedMutationConfig,
} from "./types/api.brand.types.js";
export type { AxiosError, AxiosResponse } from "axios";
