import { AsyncThunkApiService } from "@services/thunk.service.js";
import { TanStackApiService } from "@services/tanstack.service.js";
import type { ServiceConfig } from "@config/http.client.config.js";

type FactoryConfig = Omit<ServiceConfig, "baseURL" | "withCredentials">;
type FactoryType = "tanstack" | "thunk";

export const apiServiceFactory =
  (type: FactoryType) =>
  (data: {
    baseURL: string;
    withCredentials: boolean;
    config?: FactoryConfig;
  }) => {
    switch (type) {
      case "tanstack":
        return new TanStackApiService(
          data.baseURL,
          data.withCredentials,
          data.config,
        );
      case "thunk":
        return new AsyncThunkApiService(
          data.baseURL,
          data.withCredentials,
          data.config,
        );
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  };
