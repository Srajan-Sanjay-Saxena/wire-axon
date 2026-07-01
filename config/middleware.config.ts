import { AxiosResponse, InternalAxiosRequestConfig } from 'axios';

type RequestMiddleware = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

type ResponseMiddleware = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>;

type ErrorMiddleware = (error: unknown) => unknown | Promise<unknown>;

interface MiddlewareConfig<
  TRequest extends RequestMiddleware[] = RequestMiddleware[],
  TResponse extends ResponseMiddleware[] = ResponseMiddleware[],
  TError extends ErrorMiddleware[] = ErrorMiddleware[],
> {
  onRequest?: TRequest;
  onResponse?: TResponse;
  onError?: TError;
}

export type {
  RequestMiddleware,
  ResponseMiddleware,
  ErrorMiddleware,
  MiddlewareConfig,
};
