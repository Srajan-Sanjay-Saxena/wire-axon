import { ApiValidationService } from "@helper/validation.manager.js";
import { apiServiceFactory } from "@services/api.factory.service.js";
import type { ApiFactoryInstanceType } from "@lib/api.factory.types.js";
import {
  urlSchema,
  mutationConfigSchema,
  bodySchema,
} from "@schemas/api.validation.schema.js";
import { ApiConfig } from "@lib/api.config.types.js";
import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import { TANSTACK_MUTATION_DEFAULT_OPTIONS } from "@options/tanstack.query.default.options.js";
import { useRef } from "react";
import { toast } from "sonner";
import type { AxiosResponse } from "axios";
import type { ServiceConfig } from "@config/http.client.config.js";

type FeatureConfig = Omit<ServiceConfig, "baseURL">;
type MutationVariables = Record<string, unknown>;
type MutationOptions<TData> = Omit<
  UseMutationOptions<AxiosResponse<TData>, Error, MutationVariables>,
  "mutationFn"
>;
type ToastConfig = {
  successConfig?: {
    message?: string;
    customToast?: React.ReactElement;
  };
  errorConfig?: {
    message?: string;
    customToast?: React.ReactElement;
  };
};

export function useApiMutation<TData>(inputArgs: {
  url: string;
  method: "post" | "patch" | "delete";
  baseURL: string;
  featureConfig?: FeatureConfig;
  apiConfig?: ApiConfig;
  mutationOptions?: MutationOptions<TData>;
  invalidateQueryName?: string | string[];
  toastConfig?: ToastConfig;
}) {
  const {
    url,
    method,
    baseURL,
    featureConfig,
    apiConfig = { headers: { "Content-Type": "application/json" } },
    mutationOptions = TANSTACK_MUTATION_DEFAULT_OPTIONS as MutationOptions<TData>,
    invalidateQueryName,
    toastConfig,
  } = inputArgs;

  const apiServiceRef = useRef<ApiFactoryInstanceType | null>(null);

  if (!apiServiceRef.current) {
    apiServiceRef.current = apiServiceFactory("tanstack")({
      baseURL,
      withCredentials: featureConfig?.withCredentials ?? false,
      ...featureConfig,
    });
  }
  const apiService = apiServiceRef.current;

  const queryClient = useQueryClient();

  const asyncFunc = (data: MutationVariables) => {
    const {
      url: validatedUrl,
      config: validatedConfig,
      body: validatedBody,
    } = ApiValidationService.validateRequestData(
      method,
      { url: urlSchema, config: mutationConfigSchema, body: bodySchema },
      url,
      apiConfig,
      data,
    );
    return apiService[method]<TData>(
      validatedUrl,
      validatedBody,
      validatedConfig,
    );
  };

  const { isPending, mutate, isSuccess, isError, error } = useMutation<
    AxiosResponse<TData>,
    Error,
    MutationVariables
  >({
    mutationFn: asyncFunc,
    ...mutationOptions,
    onSuccess: (data, variables, onMutateResult, context) => {
      if (invalidateQueryName) {
        queryClient.invalidateQueries({
          queryKey: Array.isArray(invalidateQueryName)
            ? invalidateQueryName
            : [invalidateQueryName],
        });
      }
      if (toastConfig?.successConfig) {
        const { message, customToast } = toastConfig.successConfig;
        if (customToast) toast.custom(() => customToast);
        else if (message) toast.success(message);
      }
      mutationOptions?.onSuccess?.(data, variables, onMutateResult, context);
    },
    onError: (error, variables, onMutateResult, context) => {
      if (toastConfig?.errorConfig) {
        const { message, customToast } = toastConfig.errorConfig;
        if (customToast) toast.custom(() => customToast);
        else if (message) toast.error(message);
      }
      mutationOptions?.onError?.(error, variables, onMutateResult, context);
    },
  } as UseMutationOptions<AxiosResponse<TData>, Error, MutationVariables>);

  return { isPending, mutate, isSuccess, isError, error };
}
