import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import { ApiValidationService } from "@helper/validation.manager.js";
import {
  urlSchema,
  mutationConfigSchema,
  bodySchema,
} from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useRef, useState } from "react";
import type { ServiceConfig } from "@config/http.client.config.js";

type FeatureConfig = Omit<ServiceConfig, "baseURL" | "withCredentials">;

export function useScratchMutation(inputArgs: {
  baseURL: string;
  featureConfig?: FeatureConfig;
}) {
  const { baseURL, featureConfig } = inputArgs;

  const serviceRef = useRef<ApiFactoryInstanceType>(
    apiServiceFactory("thunk")({ baseURL, withCredentials: true, ...featureConfig }),
  );
  const service = serviceRef.current;
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const makeRequest = async <T>(inputArgs: {
    method: "post" | "patch" | "delete";
    url: string;
    data?: unknown;
    apiConfig?: ApiConfig;
  }) => {
    const { method, url, data, apiConfig = {} } = inputArgs;
    const {
      url: validUrl,
      config: validConfig,
      body: validBody,
    } = ApiValidationService.validateRequestData(
      method,
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      url,
      apiConfig,
      data,
    );
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      return await service[method]<T>(validUrl, validBody, validConfig);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setIsError(true);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    makeRequest,
    isLoading,
    isError,
    error,
    cancelAll: () => service.cancelAllRequests(),
  };
}
