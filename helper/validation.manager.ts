import { z } from 'zod';
import type {
  ValidatedBrand,
  ValidatedGetConfig,
  ValidatedUrl,
} from '@lib/api.brand.types.js';
import { HttpMethodsType } from '@lib/api.config.types.js';
import {
  GetRequestValidatedConfigReturnType,
  MutationRequestValidatedConfigReturnType,
  VerificationSchemas,
} from '@lib/api.validation.manager.return.types.js';

export class ApiValidationService {
  static validateInput<TSchema>(
    input: unknown,
    schema: z.ZodType<TSchema>
  ): ValidatedBrand<TSchema> {
    const result = schema.safeParse(input);
    if (!result.success) {
      throw new Error(`Invalid input: ${result.error.message}`);
    }
    return result.data as ValidatedBrand<TSchema>;
  }

  static validateRequestData(
    method: Extract<HttpMethodsType, 'get'>,
    schemas: Omit<VerificationSchemas, 'body'>,
    url: unknown,
    config: unknown
  ): GetRequestValidatedConfigReturnType;

  static validateRequestData(
    method: Exclude<HttpMethodsType, 'get'>,
    schemas: VerificationSchemas & { body: z.ZodType<Record<string, any>> },
    url: unknown,
    config: unknown,
    body: unknown
  ): MutationRequestValidatedConfigReturnType;

  static validateRequestData(
    method: HttpMethodsType,
    schemas: VerificationSchemas,
    url: unknown,
    config: unknown,
    body?: unknown
  ) {
    switch (method) {
      case 'get':
        if (!schemas.url || !schemas.config) {
          throw new Error(
            'Schemas for URL and config must be provided for GET requests'
          );
        }
        const validatedConfig = ApiValidationService.validateInput(
          config,
          schemas.config
        );
        const validatedUrl = ApiValidationService.validateInput(
          url,
          schemas.url
        );
        return { url: validatedUrl, config: validatedConfig };
      case 'post':
      case 'delete':
      case 'patch':
        if (!schemas.url || !schemas.config || !schemas.body) {
          throw new Error(
            'Schemas for URL, config, and body must be provided for mutation requests'
          );
        }
        const validatedMutationConfig = ApiValidationService.validateInput(
          config,
          schemas.config
        );
        const validatedMutationUrl = ApiValidationService.validateInput(
          url,
          schemas.url
        );
        const validatedBody = ApiValidationService.validateInput(
          body,
          schemas.body
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
