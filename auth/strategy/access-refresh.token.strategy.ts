import type { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { BaseAuthAxios } from "@base/base.auth..js";
import {
  FailedRequestConfig,
  InterceptedRequestModifiedAxiosError,
  RefreshTokenConfig,
} from "@lib/axios-custom.types.js";

interface QueuedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

export class RefreshTokenStrategy extends BaseAuthAxios {
  private getAccessToken: () => string | null;

  protected refreshAccessTokenFunc: RefreshTokenConfig["refreshAccessTokenFunc"];

  private onRefreshFailure: () => void;

  private tokenHeaderKey: string;

  private tokenPrefix: string;

  private isRefreshTokenRequestOngoing = false;

  private failedQueue: QueuedRequest[] = [];

  constructor(config: RefreshTokenConfig) {
    super(config);
    this.getAccessToken = config.getAccessToken;
    this.refreshAccessTokenFunc = config.refreshAccessTokenFunc;
    this.onRefreshFailure = config.onRefreshFailure;
    this.tokenHeaderKey = config.tokenHeaderKey ?? "Authorization";
    this.tokenPrefix = config.tokenPrefix ?? "Bearer";
  }

  attachCredentials(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    const token = this.getAccessToken();
    if (token) {
      config.headers[this.tokenHeaderKey] = `${this.tokenPrefix} ${token}`;
    }
    config.withCredentials = true;
    return config;
  }

  shouldIntercept(error: InterceptedRequestModifiedAxiosError): boolean {
    if (!error || typeof error !== "object") return false;

    return error.response?.status === 401 && !error.config?._retry;
  }

  async handleUnauthorized(
    axiosInstance: AxiosInstance,
    failedRequest: FailedRequestConfig,
  ): Promise<unknown> {
    if (this.isRefreshTokenRequestOngoing) {
      if (this.logger) {
        this.logger.debug("Refresh in progress — queuing request", {
          url: failedRequest.url,
        });
      }

      return new Promise<string>((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        failedRequest.headers[this.tokenHeaderKey] =
          `${this.tokenPrefix} ${newToken}`;
        return axiosInstance(failedRequest);
      });
    }

    failedRequest._retry = true;
    this.isRefreshTokenRequestOngoing = true;
    if (this.logger) {
      this.logger.info("Starting token refresh");
    }

    try {
      const tokens = await this.refreshAccessTokenFunc();
      if (this.logger) {
        this.logger.info("Token refreshed successfully");
      }

      this.processQueue(null, tokens.accessToken);

      failedRequest.headers[this.tokenHeaderKey] =
        `${this.tokenPrefix} ${tokens.accessToken}`;
      return axiosInstance(failedRequest);
    } catch (refreshError: unknown) {
      if (this.logger) {
        this.logger.error("Token refresh failed", {
          error:
            refreshError instanceof Error
              ? refreshError.message
              : "Unknown error",
        });
      }
      this.processQueue(refreshError, null);
      this.onRefreshFailure();
      return Promise.reject(refreshError);
    } finally {
      this.isRefreshTokenRequestOngoing = false;
    }
  }

  private processQueue(error: unknown, token: string | null): void {
    this.failedQueue.forEach(({ resolve, reject }) => {
      error ? reject(error) : resolve(token!);
    });
    this.failedQueue = [];
  }
}
