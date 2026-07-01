import type { UndefinedInitialDataOptions, UseMutationOptions } from "@tanstack/react-query";

const TANSTACK_QUERY_DEFAULT_OPTIONS: Omit<UndefinedInitialDataOptions, "queryKey" | "queryFn"> = {
  enabled: true,
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: false,
  retry: 3,
  networkMode: "online",
};

const TANSTACK_MUTATION_DEFAULT_OPTIONS: Omit<UseMutationOptions, "mutationFn"> = {
  retry: false,
  networkMode: "online",
};

export { TANSTACK_QUERY_DEFAULT_OPTIONS, TANSTACK_MUTATION_DEFAULT_OPTIONS };
