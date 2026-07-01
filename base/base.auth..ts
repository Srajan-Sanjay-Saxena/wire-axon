import { LoggerAdapter, LoggerConfig } from '@config/auth.config.js';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

export abstract class BaseAuthAxios {
  protected logger: LoggerAdapter | undefined;

  constructor(config?: LoggerConfig) {
    this.logger = config?.logger ?? undefined;
  }

  /**
   * Attach credentials to outgoing request config.
   * Each strategy decides HOW credentials are attached (header, cookie, etc.)
   */
  abstract attachCredentials(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig;

  /**
   * Determine if this error should trigger re-authentication.
   * e.g., 401 status code
   */
  abstract shouldIntercept(error: unknown): boolean;

  /**
   * Handle the unauthorized response.
   * Could be: refresh token, redirect to login, or do nothing.
   * Returns the retried response or rejects.
   */
  abstract handleUnauthorized(
    axiosInstance: AxiosInstance,
    failedRequest: InternalAxiosRequestConfig
  ): Promise<unknown>;

  /**
   * Attach this strategy to an axios instance.
   * Sets up request + response interceptors.
   */
  attach(axiosInstance: AxiosInstance): void {
    // Request interceptor — attach credentials
    axiosInstance.interceptors.request.use(
      (config) => {
        if (this.logger) {
          this.logger.debug('Attaching credentials to request', {
            url: config.url,
          });
        }
        return this.attachCredentials(config);
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor — handle 401
    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (!this.shouldIntercept(error)) {
          return Promise.reject(error);
        }
        if (this.logger) {
          this.logger.warn('Unauthorized response intercepted', {
            url: error.config?.url,
            status: error.response?.status,
          });
        }

        return this.handleUnauthorized(axiosInstance, error.config);
      }
    );
  }
}
