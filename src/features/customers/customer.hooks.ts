import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createThaiCustomer,
  deleteThaiCustomer,
  listThaiCustomers,
  updateThaiCustomer,
} from "@/features/thai/thai.api";
import type { ThaiCustomer } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";

export type ThaiCustomerPayload = {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
};

export type ThaiCustomerFilters = {
  page: number;
  limit: number;
  search?: string;
};

function keyOf(filters: ThaiCustomerFilters): string {
  return JSON.stringify(filters);
}

export function useThaiCustomers(filters: ThaiCustomerFilters) {
  return useQuery({
    queryKey: queryKeys.thai.customers(keyOf(filters)),
    queryFn: () =>
      listThaiCustomers({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      }),
  });
}

export function useThaiCustomerMutations(_filters: ThaiCustomerFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["thai", "customers"] });

  const createMutation = useMutation({
    mutationFn: (payload: ThaiCustomerPayload) => createThaiCustomer(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ThaiCustomerPayload> }) =>
      updateThaiCustomer(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThaiCustomer(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export type { ThaiCustomer };
