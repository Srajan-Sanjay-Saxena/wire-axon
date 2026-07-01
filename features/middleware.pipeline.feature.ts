import type { ErrorMiddleware, MiddlewareConfig, RequestMiddleware, ResponseMiddleware } from '@config/middleware.config.js';


export class MiddlewarePipeline<
  TRequest extends RequestMiddleware[] = RequestMiddleware[],
  TResponse extends ResponseMiddleware[] = ResponseMiddleware[],
  TError extends ErrorMiddleware[] = ErrorMiddleware[],
> {
  private requestMiddlewares: TRequest;

  private responseMiddlewares: TResponse;

  private errorMiddlewares: TError;

  constructor(config?: MiddlewareConfig<TRequest, TResponse, TError>) {
    this.requestMiddlewares = (config?.onRequest ?? []) as TRequest;
    this.responseMiddlewares = (config?.onResponse ?? []) as TResponse;
    this.errorMiddlewares = (config?.onError ?? []) as TError;
  }

  addRequestMiddleware<TReq extends RequestMiddleware>(
    middleware: TReq
  ): MiddlewarePipeline<[...TRequest, TReq], TResponse, TError>;
  addRequestMiddleware(middleware: RequestMiddleware) {
    (this.requestMiddlewares as RequestMiddleware[]).push(middleware);
    return this as MiddlewarePipeline<any, any, any>;
  }

  addResponseMiddleware<TResp extends ResponseMiddleware>(
    middleware: TResp
  ): MiddlewarePipeline<TRequest, [...TResponse, TResp], TError>;
  addResponseMiddleware(middleware: ResponseMiddleware) {
    (this.responseMiddlewares as ResponseMiddleware[]).push(middleware);
    return this as MiddlewarePipeline<any, any, any>;
  }

  addErrorMiddleware<TErr extends ErrorMiddleware>(
    middleware: TErr
  ): MiddlewarePipeline<TRequest, TResponse, [...TError, TErr]>;
  addErrorMiddleware(middleware: ErrorMiddleware) {
    (this.errorMiddlewares as ErrorMiddleware[]).push(middleware);
    return this as MiddlewarePipeline<any, any, any>;
  }

  getRequestMiddlewares(): TRequest {
    return this.requestMiddlewares;
  }

  getResponseMiddlewares(): TResponse {
    return this.responseMiddlewares;
  }

  getErrorMiddlewares(): TError {
    return this.errorMiddlewares;
  }
}
