import {
  GetConfigSchemaType,
  MutationConfigSchemaType,
  UrlSchemaType,
} from "@schemas/api.validation.schema.js";

type Brand<T, TBrand> = T & { readonly __brand: TBrand };
type ValidatedBrand<TVar> = Brand<TVar, "ValidData">;

type ValidatedUrl = ValidatedBrand<UrlSchemaType>;
type ValidatedGetConfig = ValidatedBrand<GetConfigSchemaType>;
type ValidatedMutationConfig = ValidatedBrand<MutationConfigSchemaType>;

export type {
  ValidatedBrand,
  ValidatedUrl,
  ValidatedGetConfig,
  ValidatedMutationConfig,
};
