import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import { ApiValidationService } from "@helper/validation.manager.js";
import { urlSchema, getConfigSchema } from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useRef } from "react";

export function useScratchQuery(inputArgs: { baseURL: string }) {
  const { baseURL } = inputArgs;

  const serviceRef = useRef<ApiFactoryInstanceType>(
    apiServiceFactory("tanstack")({ baseURL, withCredentials: true }),
  );
  const service = serviceRef.current;

  const get = async <T>(inputArgs: {
    url: string;
    config?: Omit<ApiConfig, "data">;
  }) => {
    const { url, config = {} as Omit<ApiConfig, "data"> } = inputArgs;
    const { url: validUrl, config: validConfig } =
      ApiValidationService.validateRequestData(
        "get",
        { url: urlSchema, config: getConfigSchema },
        url,
        config,
      );
    return (await service.get<T>(validUrl, validConfig)).data;
  };

  return { get, cancelAll: () => service.cancelAllRequests() };
}
