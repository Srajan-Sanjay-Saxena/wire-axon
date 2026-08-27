import { BaseAuthAxios } from '@base/base.auth..js';
import { LoggerConfig } from '@config/auth.config.js';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

/**
 * CookieStrategy — for apps that rely on httpOnly cookies.
 * Browser handles cookie attachment automatically.
 * This strategy just ensures withCredentials is set and handles 401.
 */

export class CookieStrategy extends BaseAuthAxios {
  constructor(config?: LoggerConfig) {
    super(config);
  }

  attachCredentials(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    config.withCredentials = true;
    return config;
  }

  shouldIntercept(_error: unknown): boolean {
    return false;
  }

  override handleUnauthorized(){
    if (this.logger) {
      this.logger.warn('Session expired — cookie invalidated by server');
    }
    return Promise.reject(new Error('Session expired'));
  }
}
