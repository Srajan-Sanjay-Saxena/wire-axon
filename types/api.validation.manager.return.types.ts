import {
  ValidatedBrand,
  ValidatedGetConfig,
  ValidatedUrl,
} from '@lib/api.brand.types.js';
import { z } from 'zod';

interface VerificationSchemas {
  url?: z.ZodType<string>;
  config?: z.ZodType<Record<string, any>>;
  body?: z.ZodType<Record<string, any>>;
}

type GetRequestValidatedConfigReturnType = {
  url: ValidatedBrand<ValidatedUrl>;
  config: ValidatedBrand<ValidatedGetConfig>;
};

type MutationRequestValidatedConfigReturnType = {
  url: ValidatedBrand<ValidatedUrl>;
  config: ValidatedBrand<ValidatedGetConfig>;
  body: ValidatedBrand<VerificationSchemas['body']>;
};

export type {
    VerificationSchemas,
  GetRequestValidatedConfigReturnType,
  MutationRequestValidatedConfigReturnType,
};
