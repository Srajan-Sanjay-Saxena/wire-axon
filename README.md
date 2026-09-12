# wire-axon

> Type-safe HTTP client for React — built on Axios, Zod, and TanStack Query.

**Created by Srajan Saxena**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=flat-square&logo=axios&logoColor=white)](https://axios-http.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-FF4154?style=flat-square&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=flat-square)](https://zod.dev/)

---

## Installation

```bash
pnpm add wire-axon axios zod @tanstack/react-query sonner react
```

---

## Quick Start

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster richColors position="top-right" />
      <YourApp />
    </QueryClientProvider>
  );
}
```

```tsx
// hooks/usePosts.ts
import { useApiQuery, useApiMutation } from 'wire-axon/hooks';

type Post = { id: string; title: string; body: string };

export function usePosts() {
  return useApiQuery<Post[]>({
    queryKey: ['posts'],
    url: '/posts',
    baseURL: 'https://api.example.com',
  });
}

export function useCreatePost() {
  return useApiMutation<Post>({
    url: '/posts',
    method: 'post',
    baseURL: 'https://api.example.com',
    invalidateQueryName: 'posts',
    toastConfig: {
      successConfig: { message: 'Post created!' },
      errorConfig: { message: 'Failed to create post.' },
    },
  });
}
```

```tsx
// components/PostList.tsx
export function PostList() {
  const { data: posts, isLoading } = usePosts();
  const { mutate: createPost, isPending } = useCreatePost();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <button onClick={() => createPost({ title: 'New', body: 'Content' })}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
      <ul>
        {posts?.map((post) => <li key={post.id}>{post.title}</li>)}
      </ul>
    </div>
  );
}
```

---

## Use Cases

### 1. Simple GET/POST with TanStack Query

No auth, no middleware — just cached queries and mutations with auto-invalidation.

```ts
import { useApiQuery, useApiMutation } from 'wire-axon/hooks';

// GET — cached, background refetch
const { data, isLoading } = useApiQuery({
  queryKey: ['users'],
  url: '/users',
  baseURL: 'https://api.example.com',
});

// POST — invalidates cache on success
const { mutate } = useApiMutation({
  url: '/users',
  method: 'post',
  baseURL: 'https://api.example.com',
  invalidateQueryName: 'users',
});
```

---

### 2. With Bearer Token Auth

Token attached to every request automatically.

```ts
import { useApiQuery } from 'wire-axon/hooks';
import { BearerTokenStrategy } from 'wire-axon/auth';

const { data } = useApiQuery({
  queryKey: ['profile'],
  url: '/me',
  baseURL: 'https://api.example.com',
  featureConfig: {
    auth: new BearerTokenStrategy({
      getAccessToken: () => localStorage.getItem('token'),
    }),
  },
});
```

---

### 3. With Auto Token Refresh

401 → refresh token → retry request. Concurrent requests queued during refresh.

```ts
import { useApiQuery } from 'wire-axon/hooks';
import { RefreshTokenStrategy } from 'wire-axon/auth';

const { data } = useApiQuery({
  queryKey: ['profile'],
  url: '/me',
  baseURL: 'https://api.example.com',
  featureConfig: {
    auth: new RefreshTokenStrategy({
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
    }),
  },
});
```

---

### 4. With Cookie Auth (httpOnly)

For session-based auth. Just sets `withCredentials: true`.

```ts
import { useApiQuery } from 'wire-axon/hooks';
import { CookieStrategy } from 'wire-axon/auth';

const { data } = useApiQuery({
  queryKey: ['profile'],
  url: '/me',
  baseURL: 'https://api.example.com',
  featureConfig: {
    withCredentials: true,
    auth: new CookieStrategy(),
  },
});
```

---

### 5. With Retry + Middleware

Custom retry config and request/response middleware.

```ts
import { useApiQuery } from 'wire-axon/hooks';
import { MiddlewarePipeline } from 'wire-axon/features';

const pipeline = new MiddlewarePipeline();
pipeline
  .addRequestMiddleware((config) => {
    config.headers['X-Request-ID'] = crypto.randomUUID();
    return config;
  })
  .addResponseMiddleware((response) => {
    console.log(`[${response.status}] ${response.config.url}`);
    return response;
  });

const { data } = useApiQuery({
  queryKey: ['posts'],
  url: '/posts',
  baseURL: 'https://api.example.com',
  featureConfig: {
    middleware: {
      onRequest: pipeline.getRequestMiddlewares(),
      onResponse: pipeline.getResponseMiddlewares(),
    },
    retry: {
      maxRetries: 5,
      baseDelay: 500,
      retryableStatuses: [500, 502, 503, 504],
    },
  },
});
```

---

### 6. Imperative Requests (No Cache)

For async flows where you need the result inside a function, not on mount.

```ts
import { useScratchQuery, useScratchMutation } from 'wire-axon/hooks';

// GET inside async function
const { get } = useScratchQuery({ baseURL: 'https://api.example.com' });

const handleClick = async () => {
  const user = await get<User>({ url: '/me' });
  console.log(user);
};

// Multi-step mutation
const { makeRequest } = useScratchMutation({ baseURL: 'https://api.example.com' });

const checkout = async () => {
  const order = await makeRequest<Order>({ method: 'post', url: '/orders', data: { items } });
  const payment = await makeRequest<Payment>({ method: 'post', url: '/payments', data: { orderId: order.data.id } });
  return payment.data;
};
```

---

### 7. Redux Toolkit Integration

Use `AsyncThunkApiService` directly in thunks.

```ts
import { createAsyncThunk } from '@reduxjs/toolkit';
import { AsyncThunkApiService } from 'wire-axon/services';
import { RefreshTokenStrategy } from 'wire-axon/auth';

const apiService = new AsyncThunkApiService({
  baseURL: 'https://api.example.com',
  withCredentials: true,
  auth: new RefreshTokenStrategy({
    getAccessToken: () => localStorage.getItem('accessToken'),
    refreshAccessTokenFunc: async () => { /* ... */ },
    onRefreshFailure: () => { /* ... */ },
  }),
});

export const fetchUser = createAsyncThunk('user/fetch', async (_, { rejectWithValue }) => {
  try {
    const res = await apiService.get<User>('/me', {});
    return res.data;
  } catch (e) {
    return rejectWithValue((e as Error).message);
  }
});
```

---

## Features

| Feature | Description |
|---------|-------------|
| **Branded Types** | Invalid URLs/configs caught at compile time |
| **Auto Token Refresh** | 401 → refresh → retry, with request queuing |
| **Retry Engine** | Exponential backoff + jitter |
| **Request Cancellation** | Auto-cancel duplicate requests by endpoint |
| **Middleware Pipeline** | Request/response/error middleware |
| **TanStack Query** | `useApiQuery`, `useApiMutation` with caching |
| **Redux Toolkit** | `AsyncThunkApiService` for thunks |

---

## License

MIT — see [LICENSE](./LICENSE) for details.

---

*wire-axon — Created by Srajan Saxena*
