# 🔄 API Response Structure Migration Guide

## Overview

This document tracks the migration from nested response structure to flat response structure across the application.

## Backend Change

### Before (Nested Structure)
```typescript
{
  statusCode: 200,
  message: "Success",
  data: {
    actualData: {...}
  }
}
```

### After (Flat Structure)
```typescript
{
  statusCode: 200,
  message: "Success",
  ...actualData  // Spread at root level
}
```

## API Service Changes

### 1. useScratchServiceMutation Hook
**File**: `services/api-service/hooks/useScratchServiceMutation.ts`

**Change**: Fixed double nesting issue
```typescript
// ❌ Before (caused AxiosResponse<AxiosResponse<T>>)
return service[method]<AxiosResponse<T>>(validUrl, validatedData, validConfig);

// ✅ After
return service[method]<T>(validUrl, validatedData, validConfig);
```

### 2. useScratchServiceQuery Hook
**File**: `services/api-service/hooks/useScratchServiceQuery.ts`

**Behavior**: Already unwraps response by returning `.data`
```typescript
return (await service.get<T>(validUrl, validConfig)).data;
```

### 3. useApiQuery Hook
**File**: `services/api-service/hooks/useQueryApiService.ts`

**Behavior**: Returns unwrapped data
```typescript
return {
  data: data?.data,  // Unwraps AxiosResponse
  response: data,    // Full response if needed
  // ...
};
```

### 4. useApiMutation Hook
**File**: `services/api-service/hooks/useMutationApiService.ts`

**Behavior**: Callbacks receive full `AxiosResponse<TData>`
```typescript
onSuccess: (data: AxiosResponse<TData>) => {
  // data.data contains the actual response
}
```

## Frontend Type Migrations

### 1. Blogs Page
**File**: `apps/data-avengers-main/app/blogs/page.tsx`

```typescript
// ❌ Before
type ApiResponse = {
  data: {
    blogs: BlogItem[];
    hasNextPage: boolean;
  };
  message: string;
  statusCode: number;
};

// ✅ After
type ApiResponse = {
  blogs: BlogItem[];
  hasNextPage: boolean;
  message?: string;
  statusCode?: number;
};

// Usage changes
data?.data.blogs → data?.blogs
data?.data.hasNextPage → data?.hasNextPage
```

### 2. Blog Details Page
**File**: `apps/data-avengers-main/app/blogDetails/[blogId]/page.tsx`

```typescript
// ❌ Before
type ApiResponse = {
  data: {
    blog: BlogItem;
    hasNextPage: boolean;
  };
  message: string;
  statusCode: number;
};

// ✅ After
type ApiResponse = {
  blog: BlogItem;
  hasNextPage?: boolean;
  message?: string;
  statusCode?: number;
};

// Usage changes
data?.data.blog → data?.blog
```

### 3. Course Details Page
**File**: `apps/data-avengers-main/app/courseDetails/[courseId]/page.tsx`

```typescript
// ❌ Before
type ApiResponse = {
  data: {
    course: {...};
  };
  message: string;
  statusCode: number;
};

// ✅ After
type ApiResponse = {
  course: {...};
  message?: string;
  statusCode?: number;
};

// Usage changes
data?.data.course → data?.course
```

### 4. ImageKit Response Type
**File**: `packages/common/types/imageKit.types.ts`

```typescript
// ❌ Before
export type ImageKitResponse = {
  statusCode: number;
  message: string;
  data: MinimalFileDTO[];
};

// ✅ After
export type ImageKitResponse = {
  data: MinimalFileDTO[];
  statusCode?: number;
  message?: string;
};
```

### 5. Checkout Page
**File**: `apps/data-avengers-main/app/components/BuyCourseCycle/Payment/CheckoutPage.tsx`

```typescript
// ❌ Before
const { mutate: createOrder } = useApiMutation<{
  {...RazorpayOrderResponse} & { mobileNumber: string };
}>(...)

// ✅ After
const { mutate: createOrder } = useApiMutation<
  RazorpayOrderResponse & { mobileNumber: string }
>(...)
```

## Redux Thunk Migrations

### 1. Active Step Pipeline Thunk
**File**: `packages/redux-toolkit/thunks/activeStepPipelineThunk.ts`

```typescript
// ✅ Correct usage
const { data: response } = await useScratchServiceQuery().get<{
  activeStep: ActiveStateType;
}>(`/buyCoursePipelineStatus/${data.courseId}`);

return { activeStep: response.activeStep };
```

### 2. Shareable Link Thunk
**File**: `packages/redux-toolkit/thunks/shareableLinkThunk.ts`

```typescript
// ✅ Correct usage with explicit return type
export const generateShareableLinkThunk = createAsyncThunk<
  { shareableLink?: string; expiresAt?: string; info?: string },
  { courseId: string }
>(
  'course/generate-shareable-link',
  async (data, thunkAPI) => {
    const response = await useScratchServiceMutation().makeRequest<{
      shareableLink?: string;
      expiresAt?: string;
      info?: string;
    }>('post', '/course/share', data);
    
    return response.data;  // Unwrap AxiosResponse
  }
);
```

### 3. Coupon Thunk
**File**: `packages/redux-toolkit/thunks/coupon.thunk.ts`

```typescript
// ✅ Correct usage
const { data: couponData } = await useScratchServiceMutation().makeRequest<CouponResponse>(
  'patch',
  '/updateUserCouponUsage',
  data
);

// Access couponData directly (not couponData.data)
if (String(couponData.status) !== '200') {
  return thunkAPI.rejectWithValue(couponData.info);
}
```

## Migration Checklist

### For New API Calls

- [ ] Define response type matching backend structure (data spread at root)
- [ ] Make `statusCode` and `message` optional in types
- [ ] Use `useScratchServiceQuery` for GET requests (returns unwrapped data)
- [ ] Use `useScratchServiceMutation` for POST/PATCH/DELETE (returns AxiosResponse)
- [ ] Destructure `.data` from mutation responses: `const { data } = await makeRequest(...)`
- [ ] Access properties directly from query responses: `data?.propertyName`

### Common Patterns

#### Pattern 1: Query (GET) Request
```typescript
const userData = await useScratchServiceQuery().get<UserType>(`/user/${id}`);
// userData is UserType, not AxiosResponse<UserType>
console.log(userData.name);  // Direct access
```

#### Pattern 2: Mutation (POST/PATCH/DELETE) Request
```typescript
const { data } = await useScratchServiceMutation().makeRequest<UserType>(
  'post',
  '/user',
  payload
);
// data is UserType
console.log(data.name);  // Direct access
```

#### Pattern 3: useApiQuery Hook
```typescript
const { data } = useApiQuery<ResponseType>(['key'], '/endpoint');
// data is already unwrapped
console.log(data?.propertyName);
```

#### Pattern 4: useApiMutation Hook
```typescript
const { mutate } = useApiMutation<ResponseType>(
  '/endpoint',
  'post',
  {},
  undefined,
  {},
  {
    onSuccess: (response) => {
      // response is AxiosResponse<ResponseType>
      const actualData = response.data;
      console.log(actualData.propertyName);
    }
  }
);
```

## Testing Checklist

After migration, verify:

- [ ] All API calls return expected data structure
- [ ] No TypeScript errors related to response types
- [ ] No runtime errors accessing nested properties
- [ ] Error handling works correctly
- [ ] Loading states work as expected
- [ ] Data displays correctly in UI

## Common Mistakes to Avoid

### ❌ Mistake 1: Accessing nested data property
```typescript
// Wrong
const user = data?.data?.user;

// Correct
const user = data?.user;
```

### ❌ Mistake 2: Not destructuring mutation response
```typescript
// Wrong
const response = await makeRequest(...);
console.log(response.shareableLink);  // Error!

// Correct
const { data } = await makeRequest(...);
console.log(data.shareableLink);
```

### ❌ Mistake 3: Using spread operator in type definition
```typescript
// Wrong
type Response = {
  {...BaseType} & { extra: string };
};

// Correct
type Response = BaseType & { extra: string };
```

### ❌ Mistake 4: Expecting query to return AxiosResponse
```typescript
// Wrong
const response = await useScratchServiceQuery().get<UserType>(url);
const user = response.data;  // Error!

// Correct
const user = await useScratchServiceQuery().get<UserType>(url);
```

## Files Modified

### API Service Layer
- ✅ `services/api-service/hooks/useScratchServiceMutation.ts`
- ✅ `services/api-service/API_SERVICE_USAGE_GUIDE.md` (created)

### Type Definitions
- ✅ `packages/common/types/imageKit.types.ts`

### Frontend Pages
- ✅ `apps/data-avengers-main/app/blogs/page.tsx`
- ✅ `apps/data-avengers-main/app/blogDetails/[blogId]/page.tsx`
- ✅ `apps/data-avengers-main/app/courseDetails/[courseId]/page.tsx`
- ✅ `apps/data-avengers-main/app/components/BuyCourseCycle/Payment/CheckoutPage.tsx`

### Redux Thunks
- ✅ `packages/redux-toolkit/thunks/activeStepPipelineThunk.ts`
- ✅ `packages/redux-toolkit/thunks/shareableLinkThunk.ts`
- ✅ `packages/redux-toolkit/thunks/coupon.thunk.ts`

## Summary

The migration ensures:
1. **Consistency**: All response types match backend structure
2. **Type Safety**: TypeScript correctly infers response types
3. **Simplicity**: Cleaner code with direct property access
4. **Maintainability**: Easier to understand and modify

## Questions?

Refer to the [API Service Usage Guide](./API_SERVICE_USAGE_GUIDE.md) for detailed examples and patterns.

---

**Migration Date**: December 2024  
**Status**: ✅ Complete
