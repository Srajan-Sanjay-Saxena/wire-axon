# wire-axon

> Type-safe HTTP client for React — built on Axios, Zod, TanStack Query, and Redux Toolkit. Features branded types, Zod validation pipeline, retry with exponential backoff, request cancellation, middleware pipeline, and auth token strategies.

**Created by Srajan Saxena**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square)](https://zod.dev/)

---

## Table of Contents

- [Installation](#installation)
- [Architecture](#architecture)
- [Branded Types & Validation](#branded-types--validation)
- [Services](#services)
- [Hooks](#hooks)
  - [useApiQuery](#useapiquery)
  - [useApiMutation](#useapimutation)
  - [useScratchQuery](#usescratchquery)
  - [useScratchMutation](#usescratchmutation)
- [Auth Strategies](#auth-strategies)
- [Retry Engine](#retry-engine)
- [Middleware Pipeline](#middleware-pipeline)
- [Request Cancellation](#request-cancellation)
- [Examples](#examples)

---

## Installation

```bash
# peer dependencies
pnpm add axios zod @tanstack/react-query sonner react

# the package
pnpm add wire-axon
```

**Peer dependencies:**

| Package | Version | Required |
|---|---|---|
| `axios` | `>=1.0.0` | Yes |
| `zod` | `>=4.0.0` | Yes |
| `react` | `>=18.0.0` | Only for hooks |
| `@tanstack/react-query` | `>=5.0.0` | Only for `useApiQuery` / `useApiMutation` |
| `sonner` | `>=2.0.0` | Only for toast notifications |

---

## Architecture

```
wire-axon/
├── hooks/          → React hooks (useApiQuery, useApiMutation, useScratchQuery, useScratchMutation)
├── services/       → Service classes + factory (TanStackApiService, AsyncThunkApiService)
├── base/           → Abstract base classes (BaseApiService, BaseAuthAxios)
├── features/       → RetryEngine, MiddlewarePipeline, RequestCancellationManager
├── auth/           → Auth strategies (Bearer, Cookie, RefreshToken)
├── helper/         → ApiValidationService (Zod validation pipeline)
└── options/        → Default TanStack Query options, default retry config
```

**Import paths:**

```ts
import { useApiQuery, useApiMutation }     from 'wire-axon/hooks';
import { AsyncThunkApiService }            from 'wire-axon/services';
import { BaseApiService }                  from 'wire-axon/base';
import { RetryEngine, MiddlewarePipeline } from 'wire-axon/features';
import { BearerTokenStrategy }             from 'wire-axon/auth';
import { ApiValidationService }            from 'wire-axon/helper';
import { DEFAULT_RETRY_CONFIG }            from 'wire-axon/options';
```

---

## Branded Types & Validation

wire-axon uses **branded types** to make it impossible to pass unvalidated input to the HTTP layer at compile time.

```ts
// A branded type is a plain type with a compile-time tag
type Brand<T, TBrand> = T & { readonly __brand: TBrand };
type ValidatedUrl = Brand<string, 'ValidData'>;

// A raw string cannot be assigned to ValidatedUrl
const url: ValidatedUrl = '/api/users';           // ❌ TypeScript error
const url: ValidatedUrl = validateUrl('/api/users'); // ✅ only way through
```

**The validation pipeline:**

```
raw string
    │
    ▼
ApiValidationService.validateRequestData()
    │
    ▼
Zod schema.safeParse()
    │
    ├── ❌ throws Error with Zod message
    │
    └── ✅ returns value cast as branded type
            │
            ▼
        BaseApiService.get() / post() / patch() / delete()
            │
            ▼
        retryEngine.execute() → axios HTTP request
```

**Validation rules:**

| Input | Schema | Rules |
|---|---|---|
| `url` | `urlSchema` | Non-empty, valid absolute URL or `/`-prefixed relative path |
| `config` (GET) | `getConfigSchema` | `headers`, `params`, `timeout`, `signal` only — strict, no extra keys |
| `config` (mutation) | `mutationConfigSchema` | Same as GET + optional `data` field |
| `body` | `bodySchema` | `Record<string, any>`, must have at least one key |

**Using `ApiValidationService` directly:**

```ts
import { ApiValidationService } from 'wire-axon/helper';
import { urlSchema, getConfigSchema } from 'wire-axon/schemas'; // if needed

const { url, config } = ApiValidationService.validateRequestData(
  'get',
  { url: urlSchema, config: getConfigSchema },
  '/api/users',
  { timeout: 5000 }
);
// url   → ValidatedUrl
// config → ValidatedGetConfig
```

---

## Services

### TanStackApiService

Used internally by `useApiQuery` and `useApiMutation`. Lets errors propagate naturally so TanStack Query can catch and manage them.

```ts
import { TanStackApiService } from 'wire-axon/services';

const service = new TanStackApiService({ baseURL: 'https://api.example.com', withCredentials: true });
```

### AsyncThunkApiService

Used internally by `useScratchQuery` and `useScratchMutation`, and directly in Redux thunks. Wraps errors as plain `Error` objects with `status` and `data` attached — compatible with `createAsyncThunk`'s `rejectWithValue` pattern.

```ts
import { AsyncThunkApiService } from 'wire-axon/services';

const service = new AsyncThunkApiService({ baseURL: 'https://api.example.com', withCredentials: true });
```

### apiServiceFactory

Curried factory function for creating either service type:

```ts
import { apiServiceFactory } from 'wire-axon/services';

const tanstackService = apiServiceFactory('tanstack')({ baseURL: 'https://api.example.com', withCredentials: true });
const thunkService    = apiServiceFactory('thunk')({ baseURL: 'https://api.example.com', withCredentials: true });
```

### ServiceConfig

Full config accepted by both services:

```ts
interface ServiceConfig {
  baseURL: string;
  withCredentials: boolean;
  middleware?: MiddlewareConfig;   // request / response / error middleware
  retry?: Partial<RetryConfig>;   // override default retry behaviour
  auth?: BaseAuthAxios;           // attach an auth strategy
}
```

---

## Hooks

All hooks accept a single object argument for full IDE autocomplete support.

---

### useApiQuery

Declarative GET hook backed by TanStack Query. Data is cached, deduplicated, and background-refetched automatically.

**Signature:**

```ts
useApiQuery<TData>(inputArgs: {
  queryKey: string | string[];
  url: string;
  baseURL: string;
  featureConfig?: FeatureConfig;
  apiConfig?: Omit<ApiConfig, 'data' | 'headers'>;
  queryOptions?: Omit<UndefinedInitialDataOptions<AxiosResponse<TData>>, 'queryKey' | 'queryFn'>;
})
```

**FeatureConfig** — same as `ServiceConfig` minus `baseURL` and `withCredentials`. Use it to attach auth, middleware, or retry overrides at the hook level:

```ts
type FeatureConfig = Omit<ServiceConfig, 'baseURL' | 'withCredentials'>;
```

**Returns:**

| Field | Type | Description |
|---|---|---|
| `data` | `TData \| undefined` | Unwrapped response data |
| `response` | `AxiosResponse<TData> \| undefined` | Full axios response |
| `isLoading` | `boolean` | True on first load |
| `isError` | `boolean` | True if query failed |
| `isSuccess` | `boolean` | True if query succeeded |
| `error` | `Error \| null` | Error object if failed |
| `refetch` | `function` | Manually trigger refetch |

**Default query options:**

```ts
{
  enabled: true,
  staleTime: 5 * 60 * 1000,      // 5 minutes
  gcTime: 10 * 60 * 1000,        // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: false,
  retry: 3,
  networkMode: 'online',
}
```

**ApiConfig fields:**

```ts
type ApiConfig = {
  headers?: AxiosRequestHeaders;
  params?: Record<string, any>;
  timeout?: number;
  signal?: AbortSignal;
}
```

---

### useApiMutation

Mutation hook backed by TanStack Query for POST, PATCH, and DELETE. Handles query invalidation and toast notifications automatically.

**Signature:**

```ts
useApiMutation<TData>(inputArgs: {
  url: string;
  method: 'post' | 'patch' | 'delete';
  baseURL: string;
  featureConfig?: FeatureConfig;
  apiConfig?: ApiConfig;
  mutationOptions?: Omit<UseMutationOptions<AxiosResponse<TData>, Error, Record<string, unknown>>, 'mutationFn'>;
  invalidateQueryName?: string | string[];
  toastConfig?: {
    successConfig?: { message?: string; customToast?: React.ReactElement };
    errorConfig?: { message?: string; customToast?: React.ReactElement };
  };
})
```

**Returns:**

| Field | Type | Description |
|---|---|---|
| `mutate` | `(data: Record<string, unknown>) => void` | Trigger the mutation |
| `isPending` | `boolean` | True while request is in flight |
| `isSuccess` | `boolean` | True after successful mutation |
| `isError` | `boolean` | True if mutation failed |
| `error` | `Error \| null` | Error object if failed |

**How `invalidateQueryName` works:**

After a successful mutation, `useApiMutation` calls `queryClient.invalidateQueries({ queryKey: [invalidateQueryName] })` automatically. Any `useApiQuery` with a matching `queryKey` will refetch in the background.

**`mutationOptions` callbacks (TanStack v5 signature):**

```ts
mutationOptions: {
  onMutate: (variables) => void,                              // fires before request
  onSuccess: (data, variables, onMutateResult, context) => void,  // fires on success
  onError:   (error, variables, onMutateResult, context) => void, // fires on error
}
```

---

### useScratchQuery

Imperative GET hook — no TanStack Query cache involved. You own the state. Use when you need a GET result inside an async function chain, not on mount.

**Signature:**

```ts
useScratchQuery(inputArgs: { baseURL: string; featureConfig?: FeatureConfig })
```

**Returns:**

| Field | Type | Description |
|---|---|---|
| `get` | `<T>(args: { url, apiConfig? }) => Promise<T>` | Imperative GET call |
| `isLoading` | `boolean` | True while request is in flight |
| `isError` | `boolean` | True if last request failed |
| `error` | `Error \| null` | Error from last failed request |
| `cancelAll` | `() => void` | Abort all in-flight requests |

---

### useScratchMutation

Imperative mutation hook — no TanStack Query cache involved. Use for multi-step sequential mutations or fire-and-forget calls where you don't need TanStack Query state management.

**Signature:**

```ts
useScratchMutation(inputArgs: { baseURL: string; featureConfig?: FeatureConfig })
```

**Returns:**

| Field | Type | Description |
|---|---|---|
| `makeRequest` | `<T>(args: { method, url, data?, apiConfig? }) => Promise<AxiosResponse<T>>` | Imperative mutation call |
| `isLoading` | `boolean` | True while request is in flight |
| `isError` | `boolean` | True if last request failed |
| `error` | `Error \| null` | Error from last failed request |
| `cancelAll` | `() => void` | Abort all in-flight requests |

---

## Auth Strategies

Auth strategies attach to an axios instance via interceptors. Pass them via `ServiceConfig.auth` when constructing a service directly, or via `apiServiceFactory`.

All strategies extend `BaseAuthAxios` and implement three methods:

```ts
abstract attachCredentials(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig;
abstract shouldIntercept(error: unknown): boolean;
abstract handleUnauthorized(axiosInstance: AxiosInstance, failedRequest: InternalAxiosRequestConfig): Promise<unknown>;
```

---

### BearerTokenStrategy

Attaches a JWT Bearer token to every request. No refresh logic — use `RefreshTokenStrategy` if you need token refresh.

```ts
import { BearerTokenStrategy } from 'wire-axon/auth';

const auth = new BearerTokenStrategy({
  getAccessToken: () => localStorage.getItem('token'),
  tokenHeaderKey: 'Authorization',  // default
  tokenPrefix: 'Bearer',            // default
  logger: undefined,
});
```

---

### RefreshTokenStrategy

Attaches a Bearer token and automatically refreshes it on 401. Queues concurrent requests during refresh so only one refresh call is made.

```ts
import { RefreshTokenStrategy } from 'wire-axon/auth';

const auth = new RefreshTokenStrategy({
  getAccessToken: () => localStorage.getItem('accessToken'),
  refreshAccessTokenFunc: async () => {
    const res = await fetch('/auth/refresh', { method: 'POST', credentials: 'include' });
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    return { accessToken: data.accessToken };
  },
  onRefreshFailure: () => {
    localStorage.clear();
    window.location.href = '/login';
  },
  logger: undefined,
});
```

---

### CookieStrategy

For apps using httpOnly cookies. The browser handles cookie attachment automatically — this strategy just ensures `withCredentials: true` is set on every request.

```ts
import { CookieStrategy } from 'wire-axon/auth';

const auth = new CookieStrategy({ logger: undefined });
```

---

### LoggerAdapter

All strategies accept an optional `logger` that implements:

```ts
interface LoggerAdapter {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
```

wire-axon ships a `ConsoleLogger` adapter out of the box:

```ts
import { ConsoleLogger } from 'wire-axon/auth';

const auth = new BearerTokenStrategy({
  getAccessToken: () => localStorage.getItem('token'),
  logger: new ConsoleLogger(),
});
```

---

## Retry Engine

Built into every service. Retries failed requests with exponential backoff and ±25% jitter to prevent thundering herd.

**Default config:**

```ts
{
  maxRetries: 3,
  baseDelay: 1000,       // ms
  maxDelay: 30000,       // ms
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryOnNetworkError: true,
}
```

**Delay formula:** `min(baseDelay * backoffFactor^attempt ± 25% jitter, maxDelay)`

**Override per service:**

```ts
import { AsyncThunkApiService } from 'wire-axon/services';

const service = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,
  retry: {
    maxRetries: 5,
    baseDelay: 500,
    retryableStatuses: [500, 503],
    retryOnNetworkError: false,
  },
});
```

**Use standalone:**

```ts
import { RetryEngine } from 'wire-axon/features';

const engine = new RetryEngine({ maxRetries: 2, baseDelay: 200 });

const result = await engine.execute(async () => {
  return fetch('/api/data');
});
```

---

## Middleware Pipeline

Attach request, response, and error middleware to any service. Middleware runs in the order it is added.

```ts
import { MiddlewarePipeline } from 'wire-axon/features';
import { AsyncThunkApiService } from 'wire-axon/services';

const pipeline = new MiddlewarePipeline();

pipeline
  .addRequestMiddleware((config) => {
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  })
  .addResponseMiddleware((response) => {
    console.debug(`[${response.status}] ${response.config.url}`);
    return response;
  })
  .addErrorMiddleware(async (error) => {
    console.error('Request failed', error);
    return Promise.reject(error);
  });

const service = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,
  middleware: {
    onRequest: pipeline.getRequestMiddlewares(),
    onResponse: pipeline.getResponseMiddlewares(),
    onError: pipeline.getErrorMiddlewares(),
  },
});
```

---

## Request Cancellation

Every service instance manages its own `RequestCancellationManager`. Each request is keyed by `method:url` (e.g. `get:/api/users`). Calling the same endpoint twice cancels the first in-flight request automatically.

```ts
import { RequestCancellationManager } from 'wire-axon/features';

// Used internally — but available standalone
const manager = new RequestCancellationManager();

const signal = manager.getSignal('get:/api/users');  // AbortSignal
manager.cancelRequest('get:/api/users');             // cancel one
manager.cancelAll();                                 // cancel all
```

**In scratch hooks**, call `cancelAll()` on unmount:

```ts
const { get, cancelAll } = useScratchQuery({ baseURL: 'https://api.example.com' });

useEffect(() => () => cancelAll(), []);
```

---

## Examples

---

### Example 1 — Basic TanStack Query setup (lightweight, no Redux)

The simplest setup. Just wrap your app with `QueryClientProvider` and use `useApiQuery` and `useApiMutation` directly.

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <PostList />
    </QueryClientProvider>
  );
}
```

```ts
// hooks/usePosts.ts
import { useApiQuery, useApiMutation } from 'wire-axon/hooks';

const BASE_URL = 'https://api.example.com';

type Post = { id: string; title: string; body: string };

/** Fetch all posts — cached for 5 minutes by default */
export function usePosts() {
  return useApiQuery<Post[]>({
    queryKey: ['posts'],
    url: '/posts',
    baseURL: BASE_URL,
  });
  // returns: { data, isLoading, isError, isSuccess, error, refetch, response }
}

/** Create a post — invalidates the posts list on success */
export function useCreatePost() {
  return useApiMutation<Post>({
    url: '/posts',
    method: 'post',
    baseURL: BASE_URL,
    invalidateQueryName: 'posts',
    toastConfig: {
      successConfig: { message: 'Post created!' },
      errorConfig: { message: 'Failed to create post.' },
    },
  });
  // returns: { mutate, isPending, isSuccess, isError, error }
}
```

```tsx
// components/PostList.tsx
import { usePosts, useCreatePost } from '../hooks/usePosts';

export function PostList() {
  const { data: posts, isLoading, isError, refetch } = usePosts();
  const { mutate: createPost, isPending } = useCreatePost();

  if (isLoading) return <p>Loading...</p>;
  if (isError) return <button onClick={() => refetch()}>Retry</button>;

  return (
    <div>
      <button
        disabled={isPending}
        onClick={() => createPost({ title: 'New Post', body: 'Content here' })}
      >
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      <ul>
        {posts?.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  );
}
```

---

### Example 2 — With Bearer token auth

Attach `BearerTokenStrategy` once at the service level. Every request gets the token automatically — no need to pass headers per-request.

```ts
// lib/apiService.ts
import { AsyncThunkApiService } from 'wire-axon/services';
import { BearerTokenStrategy, ConsoleLogger } from 'wire-axon/auth';

/**
 * Module-level singleton — used directly in Redux thunks.
 * Auth token is read fresh on every request via getAccessToken().
 */
export const apiService = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,
  auth: new BearerTokenStrategy({
    getAccessToken: () => localStorage.getItem('accessToken'),
    logger: new ConsoleLogger(),
  }),
});
```

```ts
// store/userSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiService } from '../lib/apiService';
import { ApiValidationService } from 'wire-axon/helper';
import { urlSchema, getConfigSchema } from 'wire-axon/schemas';

type User = { id: string; name: string; email: string };

export const fetchCurrentUser = createAsyncThunk(
  'user/fetchCurrent',
  async (_, { rejectWithValue }) => {
    try {
      const { url, config } = ApiValidationService.validateRequestData(
        'get',
        { url: urlSchema, config: getConfigSchema },
        '/users/me',
        {}
      );
      const res = await apiService.get<User>(url, config);
      return res.data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState: { data: null as User | null, loading: false, error: null as string | null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => { state.loading = false; state.data = action.payload; })
      .addCase(fetchCurrentUser.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default userSlice.reducer;
```

---

### Example 3 — With RefreshToken auth (access + refresh token rotation)

`RefreshTokenStrategy` handles 401s automatically. Concurrent requests during refresh are queued and replayed with the new token.

```ts
// lib/apiService.ts
import { AsyncThunkApiService } from 'wire-axon/services';
import { RefreshTokenStrategy, ConsoleLogger } from 'wire-axon/auth';

export const apiService = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,
  auth: new RefreshTokenStrategy({
    getAccessToken: () => localStorage.getItem('accessToken'),

    refreshAccessTokenFunc: async () => {
      // Call your refresh endpoint — refresh token is sent via httpOnly cookie
      const res = await fetch('https://api.example.com/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Refresh failed');
      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      return { accessToken: data.accessToken };
    },

    onRefreshFailure: () => {
      // Clear local state and redirect to login
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    },

    logger: new ConsoleLogger(),
  }),
});
```

```ts
// store/postsSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiService } from '../lib/apiService';
import { ApiValidationService } from 'wire-axon/helper';
import { urlSchema, mutationConfigSchema, bodySchema } from 'wire-axon/schemas';

type Post = { id: string; title: string; body: string };

export const createPost = createAsyncThunk(
  'posts/create',
  async (payload: { title: string; body: string }, { rejectWithValue }) => {
    try {
      const { url, config, body } = ApiValidationService.validateRequestData(
        'post',
        { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
        '/posts',
        {},
        payload
      );
      const res = await apiService.post<Post>(url, body, config);
      return res.data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

type PostsState = { items: Post[]; loading: boolean; error: string | null };

const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: [], loading: false, error: null } as PostsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createPost.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createPost.fulfilled, (state, action) => { state.loading = false; state.items.push(action.payload); })
      .addCase(createPost.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; });
  },
});

export default postsSlice.reducer;
```

---

### Example 4 — With Cookie auth (httpOnly session)

For server-rendered apps or backends that use httpOnly session cookies. No token management needed on the client.

```ts
// lib/apiService.ts
import { AsyncThunkApiService } from 'wire-axon/services';
import { CookieStrategy, ConsoleLogger } from 'wire-axon/auth';

export const apiService = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,  // required for cookies to be sent cross-origin
  auth: new CookieStrategy({ logger: new ConsoleLogger() }),
});
```

```ts
// store/authSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiService } from '../lib/apiService';
import { ApiValidationService } from 'wire-axon/helper';
import { urlSchema, mutationConfigSchema, bodySchema } from 'wire-axon/schemas';

type AuthResponse = { user: { id: string; name: string } };

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const { url, config, body } = ApiValidationService.validateRequestData(
        'post',
        { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
        '/auth/login',
        {},
        credentials
      );
      // Server sets httpOnly cookie on response — no token handling needed
      const res = await apiService.post<AuthResponse>(url, body, config);
      return res.data.user;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null as { id: string; name: string } | null, loading: false },
  reducers: {
    logout: (state) => { state.user = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; })
      .addCase(login.fulfilled, (state, action) => { state.loading = false; state.user = action.payload; })
      .addCase(login.rejected, (state) => { state.loading = false; });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
```

---

### Example 5 — With custom retry config and middleware

Override retry behaviour and add request/response middleware per service.

```ts
// lib/apiService.ts
import { AsyncThunkApiService } from 'wire-axon/services';
import { MiddlewarePipeline } from 'wire-axon/features';
import { BearerTokenStrategy } from 'wire-axon/auth';

// Build middleware pipeline
const pipeline = new MiddlewarePipeline();

pipeline
  .addRequestMiddleware((config) => {
    // Attach a unique request ID for tracing
    config.headers['X-Request-ID'] = crypto.randomUUID();
    config.headers['X-Client-Version'] = '1.0.0';
    return config;
  })
  .addResponseMiddleware((response) => {
    // Log every response in development
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${response.status}] ${response.config.url}`, response.data);
    }
    return response;
  })
  .addErrorMiddleware(async (error) => {
    // Send to error monitoring
    console.error('[API Error]', error);
    return Promise.reject(error);
  });

export const apiService = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,
  auth: new BearerTokenStrategy({
    getAccessToken: () => localStorage.getItem('accessToken'),
    logger: undefined,
  }),
  middleware: {
    onRequest: pipeline.getRequestMiddlewares(),
    onResponse: pipeline.getResponseMiddlewares(),
    onError: pipeline.getErrorMiddlewares(),
  },
  retry: {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 15000,
    backoffFactor: 2,
    retryableStatuses: [500, 502, 503, 504],
    retryOnNetworkError: true,
  },
});
```

---

### Example 6 — useScratchQuery for on-demand imperative GET

Use when you need a GET result inside an async function — not on mount, not cached.

```ts
// hooks/useFileUpload.ts
import { useEffect } from 'react';
import { useScratchQuery } from 'wire-axon/hooks';

type PresignedUrlResponse = { uploadUrl: string; fileKey: string };

/**
 * Gets a presigned S3 URL then uploads the file directly.
 * useScratchQuery is the right tool here — we need the URL
 * inside an async function, not rendered to the UI.
 */
export function useFileUpload(baseURL: string) {
  const { get, isLoading, isError, error, cancelAll } = useScratchQuery({ baseURL });

  useEffect(() => () => cancelAll(), []);

  const upload = async (file: File) => {
    // Step 1 — get presigned URL
    const { uploadUrl, fileKey } = await get<PresignedUrlResponse>({
      url: '/uploads/presigned',
      apiConfig: { params: { filename: file.name, contentType: file.type } },
    });

    // Step 2 — upload directly to S3 (not through our API)
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    return fileKey;
  };

  return { upload, isLoading, isError, error };
}
```

---

### Example 7 — useScratchMutation for multi-step sequential mutations

Use when step N depends on the result of step N-1. Chaining three `useApiMutation` hooks via `onSuccess` is unreadable — scratch is cleaner.

```ts
// hooks/useOrderCheckout.ts
import { useEffect } from 'react';
import { useScratchMutation } from 'wire-axon/hooks';

type CartItem = { productId: string; quantity: number };
type Order = { id: string; total: number };
type Payment = { id: string; status: string };
type Fulfillment = { trackingId: string };

/**
 * Multi-step checkout flow:
 * 1. Create order from cart
 * 2. Process payment for that order
 * 3. Trigger fulfillment for that payment
 *
 * Each step depends on the previous result — scratch hook
 * lets us await them in sequence in one async function.
 */
export function useOrderCheckout(baseURL: string) {
  const { makeRequest, isLoading, isError, error, cancelAll } = useScratchMutation({ baseURL });

  useEffect(() => () => cancelAll(), []);

  const checkout = async (cart: CartItem[], paymentMethodId: string) => {
    // Step 1 — create order
    const orderRes = await makeRequest<Order>({
      method: 'post',
      url: '/orders',
      data: { items: cart },
    });

    // Step 2 — process payment (needs orderId from step 1)
    const paymentRes = await makeRequest<Payment>({
      method: 'post',
      url: '/payments',
      data: { orderId: orderRes.data.id, paymentMethodId },
    });

    // Step 3 — trigger fulfillment (needs paymentId from step 2)
    const fulfillmentRes = await makeRequest<Fulfillment>({
      method: 'post',
      url: '/fulfillments',
      data: { paymentId: paymentRes.data.id },
    });

    return {
      order: orderRes.data,
      payment: paymentRes.data,
      fulfillment: fulfillmentRes.data,
    };
  };

  return { checkout, isLoading, isError, error };
}
```

---

### Example 8 — Full production setup (Redux + TanStack Query + Auth + Middleware)

Complete wiring of everything together in a real app structure.

```ts
// lib/apiService.ts
import { AsyncThunkApiService } from 'wire-axon/services';
import { RefreshTokenStrategy, ConsoleLogger } from 'wire-axon/auth';
import { MiddlewarePipeline } from 'wire-axon/features';

const pipeline = new MiddlewarePipeline();

pipeline
  .addRequestMiddleware((config) => {
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  })
  .addResponseMiddleware((response) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${response.status}] ${response.config.url}`);
    }
    return response;
  });

/**
 * Singleton service used in all Redux thunks.
 * Handles token refresh, request tracing, and retry automatically.
 */
export const apiService = new AsyncThunkApiService({
  baseURL: process.env.REACT_APP_API_URL!,
  withCredentials: true,
  auth: new RefreshTokenStrategy({
    getAccessToken: () => localStorage.getItem('accessToken'),
    refreshAccessTokenFunc: async () => {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      localStorage.setItem('accessToken', data.accessToken);
      return { accessToken: data.accessToken };
    },
    onRefreshFailure: () => {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    },
    logger: new ConsoleLogger(),
  }),
  middleware: {
    onRequest: pipeline.getRequestMiddlewares(),
    onResponse: pipeline.getResponseMiddlewares(),
    onError: pipeline.getErrorMiddlewares(),
  },
  retry: {
    maxRetries: 3,
    baseDelay: 1000,
    retryableStatuses: [500, 502, 503, 504],
  },
});
```

```ts
// store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import postsReducer from './postsSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    posts: postsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```ts
// store/postsSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiService } from '../lib/apiService';
import { ApiValidationService } from 'wire-axon/helper';
import { urlSchema, getConfigSchema, mutationConfigSchema, bodySchema } from 'wire-axon/schemas';

type Post = { id: string; title: string; body: string };
type PostsState = { items: Post[]; loading: boolean; error: string | null };

export const fetchPosts = createAsyncThunk(
  'posts/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { url, config } = ApiValidationService.validateRequestData(
        'get',
        { url: urlSchema, config: getConfigSchema },
        '/posts',
        {}
      );
      const res = await apiService.get<Post[]>(url, config);
      return res.data;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

export const deletePost = createAsyncThunk(
  'posts/delete',
  async (postId: string, { rejectWithValue }) => {
    try {
      const { url, config, body } = ApiValidationService.validateRequestData(
        'delete',
        { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
        `/posts/${postId}`,
        {},
        { id: postId }
      );
      await apiService.delete(url, body, config);
      return postId;
    } catch (e) {
      return rejectWithValue((e as Error).message);
    }
  }
);

const postsSlice = createSlice({
  name: 'posts',
  initialState: { items: [], loading: false, error: null } as PostsState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPosts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchPosts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchPosts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      });
  },
});

export default postsSlice.reducer;
```

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Provider } from 'react-redux';
import { Toaster } from 'sonner';
import { store } from './store';

const queryClient = new QueryClient();

/**
 * Provider order:
 * - Redux Provider wraps everything (store available everywhere)
 * - QueryClientProvider wraps hooks (TanStack Query cache)
 * - Toaster for toast notifications from useApiMutation
 */
export function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Toaster richColors position="top-right" />
        <Router />
      </QueryClientProvider>
    </Provider>
  );
}
```

```ts
// hooks/usePosts.ts — TanStack Query for UI state, Redux for global state
import { useApiQuery, useApiMutation } from 'wire-axon/hooks';
import { useAppDispatch } from '../store/hooks';
import { deletePost } from '../store/postsSlice';

const BASE_URL = process.env.REACT_APP_API_URL!;

type Post = { id: string; title: string; body: string };

/** Declarative list — cached, background refetch, stale-while-revalidate */
export function usePostList() {
  return useApiQuery<Post[]>({
    queryKey: ['posts'],
    url: '/posts',
    baseURL: BASE_URL,
    queryOptions: { staleTime: 5 * 60 * 1000 },
  });
}

/** Mutation — invalidates TanStack cache on success */
export function useUpdatePost(postId: string) {
  return useApiMutation<Post>({
    url: `/posts/${postId}`,
    method: 'patch',
    baseURL: BASE_URL,
    invalidateQueryName: 'posts',
    toastConfig: {
      successConfig: { message: 'Post updated!' },
      errorConfig: { message: 'Update failed.' },
    },
    mutationOptions: {
      onMutate: (vars) => console.debug('[updatePost] started', vars),
      onSuccess: (res) => console.info('[updatePost] done', res.data),
    },
  });
}

/** Delete — goes through Redux thunk to update global store */
export function useDeletePost() {
  const dispatch = useAppDispatch();
  return (postId: string) => dispatch(deletePost(postId));
}
```

---

## License

Proprietary — see [LICENSE](./LICENSE) for details.

---

*wire-axon — Created by Srajan Saxena*
