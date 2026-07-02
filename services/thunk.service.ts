import { BaseApiService } from '@base/http.client.base.js';
import type { ServiceConfig } from '@config/http.client.config.js';
import {
  ValidatedGetConfig,
  ValidatedMutationConfig,
  ValidatedUrl,
} from '@lib/api.brand.types.js';
import { AllowedKeysType } from '@lib/api.config.types.js';
import axios from 'axios';
import type { AxiosResponse, AxiosError } from 'axios';

export class AsyncThunkApiService extends BaseApiService {
  constructor(config: ServiceConfig) {
    super(config);
  }

  protected async executeRequest<TResData>(
    method: 'get' | 'post' | 'delete' | 'patch',
    url: ValidatedUrl,
    config: ValidatedGetConfig | ValidatedMutationConfig,
    signal?: AbortSignal
  ): Promise<AxiosResponse<TResData>> {
    const axiosConfig = { ...config, signal };
    const finalURL = this.baseURL + url;

    try {
      if (method === 'get') {
        return await this.axiosInstance.get<TResData>(finalURL, axiosConfig);
      }

      const mutationConfig = config as ValidatedMutationConfig;
      return await this.axiosInstance[method]<TResData>(
        finalURL,
        mutationConfig.data,
        axiosConfig
      );
    } catch (error) {
      const axiosError = error as AxiosError;

      if (axios.isCancel(error)) {
        console.debug('Request cancelled:', method, url);
      }

      const errorObj = new Error(axiosError.message);
      Object.assign(errorObj, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
      });
      throw errorObj;
    }
  }

  public cancelRequest(key: AllowedKeysType): void {
    this.cancellationService.cancelRequest(key);
  }
}
