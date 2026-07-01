import { ApiValidationService } from "@helper/validation.manager.js";
import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import {
  urlSchema,
  mutationConfigSchema,
  bodySchema,
} from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import { useMutation, useQueryClient, UseMutationOptions } from "@tanstack/react-query";
import { TANSTACK_MUTATION_DEFAULT_OPTIONS } from "@options/tanstack.query.default.options.js";
import { useRef } from "react";
import { toast } from "sonner";
import type { AxiosResponse } from "axios";

export function useApiMutation<TData>(inputArgs: {
  url: string;
  method: "post" | "patch" | "delete";
  baseURL: string;
  mutationOptions?: Omit<
    UseMutationOptions<AxiosResponse<TData>, unknown, Record<string, unknown>>,
    "mutationFn"
  >;
  invalidateQueryName?: string | string[];
  config?: ApiConfig;
  toastMessages?: { success?: string; error?: string };
}) {
  const {
    url,
    method,
    baseURL,
    mutationOptions = TANSTACK_MUTATION_DEFAULT_OPTIONS,
    invalidateQueryName,
    config = { headers: { "Content-Type": "application/json" } },
    toastMessages,
  } = inputArgs;

  const apiServiceRef = useRef<ApiFactoryInstanceType | null>(null);
  const prevBaseURL = useRef<string | null>(null);

  if (!apiServiceRef.current || prevBaseURL.current !== baseURL) {
    apiServiceRef.current = apiServiceFactory("tanstack")({ baseURL, withCredentials: true });
    prevBaseURL.current = baseURL;
  }
  const apiService = apiServiceRef.current;

  const queryClient = useQueryClient();

  const asyncFunc = (data: Record<string, unknown>) => {
    const {
      url: validatedUrl,
      config: validatedConfig,
      body: validatedBody,
    } = ApiValidationService.validateRequestData(
      method,
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      url,
      config,
      data,
    );
    return apiService[method]<TData>(validatedUrl, validatedBody, validatedConfig);
  };

  const { isPending, mutate, isSuccess, isError, error } = useMutation({
    mutationFn: asyncFunc,
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (invalidateQueryName) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(invalidateQueryName)
            ? invalidateQueryName
            : [invalidateQueryName],
        });
      }
      if (toastMessages?.success) toast.success(toastMessages.success);
      mutationOptions?.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      if (toastMessages?.error) toast.error(toastMessages.error);
      mutationOptions?.onError?.(error, variables, context);
    },
  });

  return { isPending, mutate, isSuccess, isError, error };
}
