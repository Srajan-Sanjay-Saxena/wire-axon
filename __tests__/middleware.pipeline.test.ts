import { describe, it, expect, vi } from 'vitest';
import { MiddlewarePipeline } from '../features/middleware.pipeline.feature.js';
import type { InternalAxiosRequestConfig, AxiosResponse } from 'axios';

const mockRequest = { url: '/test' } as InternalAxiosRequestConfig;
const mockResponse = { status: 200, data: {} } as AxiosResponse;

describe('MiddlewarePipeline — construction', () => {
  it('initialises with empty arrays when no config provided', () => {
    const pipeline = new MiddlewarePipeline();
    expect(pipeline.getRequestMiddlewares()).toEqual([]);
    expect(pipeline.getResponseMiddlewares()).toEqual([]);
    expect(pipeline.getErrorMiddlewares()).toEqual([]);
  });

  it('initialises with provided middleware arrays', () => {
    const reqMw = vi.fn((c: InternalAxiosRequestConfig) => c);
    const pipeline = new MiddlewarePipeline({ onRequest: [reqMw] });
    expect(pipeline.getRequestMiddlewares()).toHaveLength(1);
  });
});

describe('MiddlewarePipeline — addRequestMiddleware', () => {
  it('adds middleware and returns pipeline for chaining', () => {
    const pipeline = new MiddlewarePipeline();
    const mw = vi.fn((c: InternalAxiosRequestConfig) => c);
    const result = pipeline.addRequestMiddleware(mw);
    expect(pipeline.getRequestMiddlewares()).toHaveLength(1);
    expect(result).toBe(pipeline);
  });

  it('preserves order of added middlewares', () => {
    const pipeline = new MiddlewarePipeline();
    const mw1 = vi.fn((c: InternalAxiosRequestConfig) => c);
    const mw2 = vi.fn((c: InternalAxiosRequestConfig) => c);
    pipeline.addRequestMiddleware(mw1).addRequestMiddleware(mw2);
    const mws = pipeline.getRequestMiddlewares();
    expect(mws[0]).toBe(mw1);
    expect(mws[1]).toBe(mw2);
  });
});

describe('MiddlewarePipeline — addResponseMiddleware', () => {
  it('adds response middleware', () => {
    const pipeline = new MiddlewarePipeline();
    const mw = vi.fn((r: AxiosResponse) => r);
    pipeline.addResponseMiddleware(mw);
    expect(pipeline.getResponseMiddlewares()).toHaveLength(1);
  });
});

describe('MiddlewarePipeline — addErrorMiddleware', () => {
  it('adds error middleware', () => {
    const pipeline = new MiddlewarePipeline();
    const mw = vi.fn((e: unknown) => e);
    pipeline.addErrorMiddleware(mw);
    expect(pipeline.getErrorMiddlewares()).toHaveLength(1);
  });
});

describe('MiddlewarePipeline — middleware execution', () => {
  it('request middleware mutates config correctly', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.addRequestMiddleware((config) => ({
      ...config,
      headers: { Authorization: 'Bearer token' } as any,
    }));

    const mws = pipeline.getRequestMiddlewares();
    const result = await mws[0](mockRequest);
    expect((result.headers as any).Authorization).toBe('Bearer token');
  });

  it('response middleware mutates response correctly', async () => {
    const pipeline = new MiddlewarePipeline();
    pipeline.addResponseMiddleware((res) => ({ ...res, data: { transformed: true } }));

    const mws = pipeline.getResponseMiddlewares();
    const result = await mws[0](mockResponse);
    expect(result.data).toEqual({ transformed: true });
  });

  it('error middleware receives and returns error', async () => {
    const pipeline = new MiddlewarePipeline();
    const error = new Error('request failed');
    pipeline.addErrorMiddleware((e) => Promise.reject(e));

    const mws = pipeline.getErrorMiddlewares();
    await expect(mws[0](error)).rejects.toThrow('request failed');
  });
});
