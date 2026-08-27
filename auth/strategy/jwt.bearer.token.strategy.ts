import { BaseAuthAxios } from '@base/base.auth..js';
import { BaseAuthConfig, LoggerConfig } from '@config/auth.config.js';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type BearerTokenConfig = Pick<
  BaseAuthConfig,
  'getAccessToken' | 'tokenHeaderKey' | 'tokenPrefix'
> &
  LoggerConfig;

export class BearerTokenStrategy extends BaseAuthAxios {
  private getAccessToken: () => string | null;

  private tokenHeaderKey: string;

  private tokenPrefix: string;

  constructor(config: BearerTokenConfig) {
    super(config);
    this.getAccessToken = config.getAccessToken;
    this.tokenHeaderKey = config.tokenHeaderKey ?? 'Authorization';
    this.tokenPrefix = config.tokenPrefix ?? 'Bearer';
  }

  attachCredentials(
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig {
    const token = this.getAccessToken();
    if (token) {
      config.headers[this.tokenHeaderKey] = `${this.tokenPrefix} ${token}`;
    }
    return config;
  }

  shouldIntercept(_error: unknown): boolean {
    return false;
  }

  override handleUnauthorized(){
    if (this.logger) {
      this.logger.error('Unauthorized — no refresh strategy configured');
    }
    return Promise.reject(new Error('Unauthorized'));
  }
}
