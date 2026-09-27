import {
  ValidatedBrand,
  ValidatedGetConfig,
  ValidatedUrl,
} from "@lib/api.brand.types.js";
import { z } from "zod";

interface RequestBodyValidator {
  bodySchema?: z.ZodType<Record<string, any>>;
}

type GetRequestValidatedConfigReturnType = {
  url: ValidatedBrand<ValidatedUrl>;
  config: ValidatedBrand<ValidatedGetConfig>;
};

type MutationRequestValidatedConfigReturnType = {
  url: ValidatedBrand<ValidatedUrl>;
  config: ValidatedBrand<ValidatedGetConfig>;
  body: ValidatedBrand<Record<string, unknown>>;
};

export type {
  RequestBodyValidator,
  GetRequestValidatedConfigReturnType,
  MutationRequestValidatedConfigReturnType,
};
