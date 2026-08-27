import { ApiValidationService } from "@helper/validation.manager.js";
import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import { urlSchema, getConfigSchema } from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useQuery, UndefinedInitialDataOptions } from "@tanstack/react-query";
import { useRef } from "react";
import { TANSTACK_QUERY_DEFAULT_OPTIONS } from "@options/tanstack.query.default.options.js";
import type { AxiosResponse } from "axios";
import type { ServiceConfig } from "@config/http.client.config.js";

type FeatureConfig = Omit<ServiceConfig, "baseURL">;

export function useApiQuery<TData>(inputArgs: {
  queryKey: string | string[];
  url: string;
  baseURL: string;
  featureConfig?: FeatureConfig;
  apiConfig?: Omit<ApiConfig, "data">;
  queryOptions?: Omit<UndefinedInitialDataOptions<AxiosResponse<TData>>, "queryKey" | "queryFn">;
}) {
  const {
    queryKey,
    url,
    baseURL,
    featureConfig,
    apiConfig = {} as Omit<ApiConfig, "data">,
    queryOptions = TANSTACK_QUERY_DEFAULT_OPTIONS,
  } = inputArgs;

  const apiServiceRef = useRef<ApiFactoryInstanceType | null>(null);

  if (!apiServiceRef.current) {
    apiServiceRef.current = apiServiceFactory("tanstack")({
      baseURL,
      withCredentials: featureConfig?.withCredentials ?? false,
      ...featureConfig,
    });
  }
  const apiService = apiServiceRef.current;

  const queryFn = () => {
    const { url: validatedUrl, config: validatedConfig } =
      ApiValidationService.validateRequestData(
        "get",
        { url: urlSchema, config: getConfigSchema },
        url,
        apiConfig,
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
