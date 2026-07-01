import {
  BodySchemaType,
  GetConfigSchemaType,
  MutationConfigSchemaType,
  UrlSchemaType,
} from "@schemas/api.validation.schema.js";

type Brand<T, TBrand> = T & { readonly __brand: TBrand };
type ValidatedBrand<TVar> = Brand<TVar, "ValidData">;

type ValidatedUrl = ValidatedBrand<UrlSchemaType>;
type ValidatedGetConfig = ValidatedBrand<GetConfigSchemaType>;
type ValidatedMutationConfig = ValidatedBrand<MutationConfigSchemaType>;
type ValidatedBody = ValidatedBrand<BodySchemaType>;

export type {
  ValidatedBrand,
  ValidatedUrl,
  ValidatedGetConfig,
  ValidatedMutationConfig,
  ValidatedBody,
};
