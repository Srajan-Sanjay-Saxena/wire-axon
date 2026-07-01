import { apiServiceFactory } from "@services/api.factory.service.js";

type ApiFactoryInstanceType = ReturnType<ReturnType<typeof apiServiceFactory>>;

export type { ApiFactoryInstanceType };
