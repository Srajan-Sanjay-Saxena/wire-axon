import { AsyncThunkApiService } from "@services/thunk.service.js";
import { TanStackApiService } from "@services/tanstack.service.js";
import type { ServiceConfig } from "@config/http.client.config.js";

type FactoryType = "tanstack" | "thunk";

export const apiServiceFactory =
  (type: FactoryType) =>
  (config: ServiceConfig) => {
    switch (type) {
      case "tanstack":
        return new TanStackApiService(config);
      case "thunk":
        return new AsyncThunkApiService(config);
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  };
