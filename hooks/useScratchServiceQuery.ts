import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import { ApiValidationService } from "@helper/validation.manager.js";
import { urlSchema, getConfigSchema } from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useRef, useState } from "react";
import type { ServiceConfig } from "@config/http.client.config.js";

type FeatureConfig = Omit<ServiceConfig, "baseURL" | "withCredentials">;

export function useScratchQuery(inputArgs: {
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

  const get = async <T>(inputArgs: {
    url: string;
    apiConfig?: Omit<ApiConfig, "data" | "headers">;
  }) => {
    const { url, apiConfig = {} as Omit<ApiConfig, "data"> } = inputArgs;
    const { url: validUrl, config: validConfig } =
      ApiValidationService.validateRequestData(
        "get",
        { url: urlSchema, config: getConfigSchema },
        url,
        apiConfig,
      );
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      return (await service.get<T>(validUrl, validConfig)).data;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setError(err);
      setIsError(true);
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  return { get, isLoading, isError, error, cancelAll: () => service.cancelAllRequests() };
}
