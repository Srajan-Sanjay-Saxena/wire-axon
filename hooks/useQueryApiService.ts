import { ApiValidationService } from "@helper/validation.manager.js";
import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import { urlSchema, getConfigSchema } from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useQuery, UseQueryOptions, UndefinedInitialDataOptions } from "@tanstack/react-query";
import { useRef } from "react";
import { TANSTACK_QUERY_DEFAULT_OPTIONS } from "@options/tanstack.query.default.options.js";
import type { AxiosResponse } from "axios";

export function useApiQuery<TData>(inputArgs: {
  queryKey: string | string[];
  url: string;
  baseURL: string;
  queryOptions?: Omit<UndefinedInitialDataOptions<AxiosResponse<TData>>, "queryKey" | "queryFn">;
  config?: Omit<ApiConfig, "data">;
}) {
  const {
    queryKey,
    url,
    baseURL,
    queryOptions = TANSTACK_QUERY_DEFAULT_OPTIONS,
    config = {} as Omit<ApiConfig, "data">,
  } = inputArgs;

  const apiServiceRef = useRef<ApiFactoryInstanceType | null>(null);
  const prevBaseURL = useRef<string | null>(null);

  if (!apiServiceRef.current || prevBaseURL.current !== baseURL) {
    apiServiceRef.current = apiServiceFactory("tanstack")({ baseURL, withCredentials: true });
    prevBaseURL.current = baseURL;
  }
  const apiService = apiServiceRef.current;

  const queryFn = () => {
    const { url: validatedUrl, config: validatedConfig } =
      ApiValidationService.validateRequestData(
        "get",
        { url: urlSchema, config: getConfigSchema },
        url,
        config,
      );
    return apiService.get<TData>(validatedUrl, validatedConfig);
  };

  const { data, error, isLoading, isError, isSuccess, refetch } = useQuery({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn,
    ...queryOptions,
  } as UndefinedInitialDataOptions<AxiosResponse<TData>>);

  return {
    data: data?.data,
    response: data,
    error,
    isLoading,
    isError,
    isSuccess,
    refetch,
  };
}
