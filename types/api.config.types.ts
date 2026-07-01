import type { InternalAxiosRequestConfig } from 'axios';

type HttpMethodsType = 'get' | 'post' | 'delete' | 'patch';
type AllowedKeysType = `${HttpMethodsType}:${string}`;

/** Subset of axios request config exposed to consumers */
type ApiConfig = Pick<
  InternalAxiosRequestConfig,
  'headers' | 'params' | 'timeout' | 'signal'
>;

export type { HttpMethodsType, AllowedKeysType, ApiConfig };
