import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import { ApiValidationService } from "@helper/validation.manager.js";
import {
  urlSchema,
  mutationConfigSchema,
  bodySchema,
} from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useRef } from "react";

export function useScratchMutation(inputArgs: { baseURL: string }) {
  const { baseURL } = inputArgs;

  const serviceRef = useRef<ApiFactoryInstanceType>(
    apiServiceFactory("tanstack")({ baseURL, withCredentials: true }),
  );
  const service = serviceRef.current;

  const makeRequest = async <T>(inputArgs: {
    method: "post" | "patch" | "delete";
    url: string;
    data?: unknown;
    config?: ApiConfig;
  }) => {
    const { method, url, data, config = {} } = inputArgs;
    const {
      url: validUrl,
      config: validConfig,
      body: validBody,
    } = ApiValidationService.validateRequestData(
      method,
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      url,
      config,
      data,
    );
    return service[method]<T>(validUrl, validBody, validConfig);
  };

  return {
    makeRequest,
    cancelAll: () => service.cancelAllRequests(),
  };
}
