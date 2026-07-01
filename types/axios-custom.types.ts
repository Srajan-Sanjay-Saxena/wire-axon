import { BaseAuthConfig, LoggerConfig } from "@config/auth.config.js";
import { AxiosError, InternalAxiosRequestConfig } from "axios";

type RefreshTokenConfig = BaseAuthConfig & LoggerConfig;
type FailedRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type InterceptedRequestModifiedAxiosError = Omit<AxiosError, 'config'> & {
  config: FailedRequestConfig;
};

export type { RefreshTokenConfig, FailedRequestConfig, InterceptedRequestModifiedAxiosError };