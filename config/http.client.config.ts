import { BaseAuthAxios } from "@base/base.auth..js";
import { MiddlewareConfig } from "@config/middleware.config.js";
import { RetryConfig } from "@config/retry.engine.config.js";

export interface ServiceConfig {
  baseURL: string;
  withCredentials: boolean;
  middleware?: MiddlewareConfig;
  retry?: Partial<RetryConfig>;
  auth?: BaseAuthAxios;
}