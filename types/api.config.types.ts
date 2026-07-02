import type { InternalAxiosRequestConfig } from 'axios';

type HttpMethodsType = 'get' | 'post' | 'delete' | 'patch';
type AllowedKeysType = `${HttpMethodsType}:${string}`;

/** Subset of axios request config exposed to consumers */
type ApiConfig = Omit<Pick<
  InternalAxiosRequestConfig,
  'headers' | 'params' | 'timeout' | 'signal'
>, 'headers'> & { headers?: InternalAxiosRequestConfig['headers'] };

export type { HttpMethodsType, AllowedKeysType, ApiConfig };
