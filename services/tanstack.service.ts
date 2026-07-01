import { BaseApiService } from '@base/http.client.base.js';
import type { ServiceConfig } from '@config/http.client.config.js';
import {
  ValidatedGetConfig,
  ValidatedMutationConfig,
  ValidatedUrl,
} from '@lib/api.brand.types.js';
import type { AxiosResponse } from 'axios';

export class TanStackApiService extends BaseApiService {
  constructor(
    baseURL: string,
    withCredentials: boolean,
    config?: Omit<ServiceConfig, 'baseURL' | 'withCredentials'>
  ) {
    super(baseURL, withCredentials, config);
  }

  protected async executeRequest<TResData>(
    method: 'get' | 'post' | 'delete' | 'patch',
    url: ValidatedUrl,
    config: ValidatedGetConfig | ValidatedMutationConfig,
    signal?: AbortSignal
  ): Promise<AxiosResponse<TResData>> {
    const finalURL = this.baseURL + url;
    const axiosConfig = { ...config, signal };

    if (method === 'get') {
      return this.axiosInstance.get<TResData>(finalURL, axiosConfig);
    }

    const mutationConfig = config as ValidatedMutationConfig;
    return this.axiosInstance[method]<TResData>(
      finalURL,
      mutationConfig.data,
      axiosConfig
    );
  }
}
