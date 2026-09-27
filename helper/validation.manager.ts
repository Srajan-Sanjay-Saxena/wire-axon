import { z } from "zod";
import type {
  ValidatedBrand,
  ValidatedGetConfig,
  ValidatedUrl,
} from "@lib/api.brand.types.js";
import { HttpMethodsType } from "@lib/api.config.types.js";
import {
  GetRequestValidatedConfigReturnType,
  MutationRequestValidatedConfigReturnType,
  RequestBodyValidator,
} from "@lib/api.validation.manager.return.types.js";
import {
  GetConfigSchema,
  MutationConfigSchema,
  UrlSchema,
} from "@schemas/api.validation.schema.js";

export class ApiValidationService {
  static validateInput<TSchema>(
    input: unknown,
    schema: z.ZodType<TSchema>,
  ): ValidatedBrand<TSchema> {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid input: ${result.error.message}`);
    }
    return result.data as ValidatedBrand<TSchema>;
  }

  static validateRequestData(
    method: Extract<HttpMethodsType, "get">,
    validator: Omit<RequestBodyValidator, "bodySchema">,
    url: unknown,
    config: unknown,
  ): GetRequestValidatedConfigReturnType;

  static validateRequestData(
    method: Exclude<HttpMethodsType, "get">,
    validator: Required<RequestBodyValidator>,
    url: unknown,
    config: unknown,
    body: unknown,
  ): MutationRequestValidatedConfigReturnType;

  static validateRequestData(
    method: HttpMethodsType,
    validator: RequestBodyValidator,
    url: unknown,
    config: unknown,
    body?: unknown,
  ) {
    switch (method) {
      case "get":
        const validatedConfig = ApiValidationService.validateInput(
          config,
          GetConfigSchema,
        );
        const validatedUrl = ApiValidationService.validateInput(url, UrlSchema);
        return { url: validatedUrl, config: validatedConfig };
      case "post":
      case "delete":
      case "patch":
        if (!validator.bodySchema) {
          throw new Error("Body schema is required for mutation requests");
        }
        const validatedMutationConfig = ApiValidationService.validateInput(
          config,
          MutationConfigSchema,
        );
        const validatedMutationUrl = ApiValidationService.validateInput(
          url,
          UrlSchema,
        );
        const validatedBody = ApiValidationService.validateInput(
          body,
          validator.bodySchema,
        );
        return {
          url: validatedMutationUrl,
          config: validatedMutationConfig,
          body: validatedBody,
        };
      default:
        return;
    }
  }
}
