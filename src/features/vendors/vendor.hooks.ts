import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createThaiVendor,
  deleteThaiVendor,
  listThaiVendors,
  updateThaiVendor,
} from "@/features/thai/thai.api";
import type { ThaiVendor } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";

export type ThaiVendorPayload = {
  name: string;
  companyNo?: string;
  phone?: string;
  address?: string;
  email?: string;
};

export type ThaiVendorFilters = {
  page: number;
  limit: number;
  search?: string;
};

function keyOf(filters: ThaiVendorFilters): string {
  return JSON.stringify(filters);
}

export function useThaiVendors(filters: ThaiVendorFilters) {
  return useQuery({
    queryKey: queryKeys.thai.vendors(keyOf(filters)),
    queryFn: () =>
      listThaiVendors({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      }),
  });
}

export function useThaiVendorMutations(_filters: ThaiVendorFilters) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["thai", "vendors"] });

  const createMutation = useMutation({
    mutationFn: (payload: ThaiVendorPayload) => createThaiVendor(payload),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ThaiVendorPayload> }) =>
      updateThaiVendor(id, payload),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteThaiVendor(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}

export type { ThaiVendor };
