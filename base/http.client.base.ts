import { MiddlewarePipeline } from "@features/middleware.pipeline.feature.js";
import { RetryEngine } from "@features/retry.engine.feature.js";
import {
  ValidatedBody,
  ValidatedGetConfig,
  ValidatedMutationConfig,
  ValidatedUrl,
} from "@lib/api.brand.types.js";
import { AllowedKeysType } from "@lib/api.config.types.js";
import { ServiceConfig } from "@config/http.client.config.js";
import { RequestCancellationManager } from "@features/cancellation.feature.js";
import type { AxiosInstance, AxiosResponse } from "axios";
import axios from "axios";

export abstract class BaseApiService {
  protected axiosInstance: AxiosInstance;
  protected cancellationService: RequestCancellationManager;
  protected middlewarePipeline: MiddlewarePipeline;
  protected retryEngine: RetryEngine;
  protected baseURL: string;

  constructor(config: ServiceConfig) {
    const { baseURL, withCredentials, middleware, retry, auth } = config;

    this.baseURL = baseURL;
    this.axiosInstance = axios.create({ baseURL, withCredentials });
    this.cancellationService = new RequestCancellationManager();
    this.middlewarePipeline = new MiddlewarePipeline(middleware);
    this.retryEngine = new RetryEngine(retry);

    if (auth) {
      auth.attach(this.axiosInstance);
    }

    this.setupMiddleware();
  }

  private setupMiddleware(): void {
    const requestMiddlewares = this.middlewarePipeline.getRequestMiddlewares();
    const responseMiddlewares = this.middlewarePipeline.getResponseMiddlewares();
    const errorMiddlewares = this.middlewarePipeline.getErrorMiddlewares();

    requestMiddlewares.forEach((middleware) => {
      this.axiosInstance.interceptors.request.use(async (config) =>
        middleware(config),
      );
    });

    responseMiddlewares.forEach((middleware) => {
      this.axiosInstance.interceptors.response.use(async (response) =>
        middleware(response),
      );
    });

    errorMiddlewares.forEach((middleware) => {
      this.axiosInstance.interceptors.response.use(undefined, async (error) => {
        try {
          return await middleware(error);
        } catch (e) {
          return Promise.reject(e);
        }
      });
    });
  }

  protected abstract executeRequest<TResData>(
    method: "get",
    url: ValidatedUrl,
    config: ValidatedGetConfig,
    signal?: AbortSignal,
  ): Promise<AxiosResponse<TResData>>;

  protected abstract executeRequest<TResData>(
    method: "post" | "patch" | "delete",
    url: ValidatedUrl,
    config: ValidatedMutationConfig,
    signal?: AbortSignal,
  ): Promise<AxiosResponse<TResData>>;

  public async get<TResData>(
    url: ValidatedUrl,
    config: ValidatedGetConfig = {} as ValidatedGetConfig,
  ): Promise<AxiosResponse<TResData>> {
    const key = `get:${url}` as AllowedKeysType;
    const signal = this.cancellationService.getSignal(key);
    try {
      return await this.retryEngine.execute(() =>
        this.executeRequest<TResData>("get", url, config, signal),
      );
    } finally {
      this.cancellationService.remove(key);
    }
  }

  public async post<TResData>(
    url: ValidatedUrl,
    body: ValidatedBody,
    config: ValidatedMutationConfig = {} as ValidatedMutationConfig,
  ): Promise<AxiosResponse<TResData>> {
    const key = `post:${url}` as AllowedKeysType;
    const signal = this.cancellationService.getSignal(key);
    try {
      const mergedConfig = { ...config, data: body };
      return await this.retryEngine.execute(() =>
        this.executeRequest<TResData>("post", url, mergedConfig, signal),
      );
    } finally {
      this.cancellationService.remove(key);
    }
  }

  public async patch<TResData>(
    url: ValidatedUrl,
    body: ValidatedBody,
    config: ValidatedMutationConfig = {} as ValidatedMutationConfig,
  ): Promise<AxiosResponse<TResData>> {
    const key = `patch:${url}` as AllowedKeysType;
    const signal = this.cancellationService.getSignal(key);
    try {
      const mergedConfig = { ...config, data: body };
      return await this.retryEngine.execute(() =>
        this.executeRequest<TResData>("patch", url, mergedConfig, signal),
      );
    } finally {
      this.cancellationService.remove(key);
    }
  }

  public async delete<TResData>(
    url: ValidatedUrl,
    body?: ValidatedBody,
    config: ValidatedMutationConfig = {} as ValidatedMutationConfig,
  ): Promise<AxiosResponse<TResData>> {
    const key = `delete:${url}` as AllowedKeysType;
    const signal = this.cancellationService.getSignal(key);
    try {
      const mergedConfig = { ...config, data: body };
      return await this.retryEngine.execute(() =>
        this.executeRequest<TResData>("delete", url, mergedConfig, signal),
      );
    } finally {
      this.cancellationService.remove(key);
    }
  }

  public cancelAllRequests(): void {
    this.cancellationService.cancelAll();
  }

  public getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}
