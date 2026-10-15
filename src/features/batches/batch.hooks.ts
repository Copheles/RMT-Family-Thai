import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import {
  getBatchesByProduct,
  getInventorySummary,
  listPayable,
  listPurchases,
  settleBatchPayment,
  stockIn,
} from "./batch.api";
import type {
  BatchFilters,
  PayableFilters,
  PurchaseFilters,
  SettleBatchPayload,
  StockInPayload,
} from "./batch.types";

function keyOf(filters: BatchFilters | PurchaseFilters | PayableFilters): string {
  return JSON.stringify(filters);
}

export function useInventorySummary() {
  return useQuery({
    queryKey: queryKeys.thai.inventorySummary,
    queryFn: getInventorySummary,
  });
}

export function usePurchases(filters: PurchaseFilters) {
  return useQuery({
    queryKey: queryKeys.thai.purchases(keyOf(filters)),
    queryFn: () => listPurchases(filters),
  });
}

export function usePayablePurchases(filters: PayableFilters, enabled = true) {
  return useQuery({
    queryKey: queryKeys.thai.payable(keyOf(filters)),
    queryFn: () => listPayable(filters),
    enabled,
  });
}

export function useSettleBatchPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ batchId, payload }: { batchId: string; payload: SettleBatchPayload }) =>
      settleBatchPayment(batchId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["thai", "payable"] });
      await queryClient.invalidateQueries({ queryKey: ["thai", "purchases"] });
      await queryClient.invalidateQueries({ queryKey: ["thai", "products"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.thai.inventorySummary });
    },
  });
}

export function useBatchMutations(productId: string | null) {
  const queryClient = useQueryClient();

  const stockInMutation = useMutation({
    mutationFn: (payload: StockInPayload) => stockIn(productId!, payload),
    onSuccess: async () => {
      if (!productId) return;
      await queryClient.invalidateQueries({ queryKey: ["thai", "products"] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.thai.inventorySummary });
      await queryClient.invalidateQueries({ queryKey: ["thai", "purchases"] });
      await queryClient.invalidateQueries({ queryKey: ["thai", "payable"] });
    },
  });

  return { stockInMutation };
}

export function useBatches(productId: string | null, filters: BatchFilters) {
  return useQuery({
    queryKey: queryKeys.thai.batches(productId ?? "none", keyOf(filters)),
    queryFn: () => getBatchesByProduct(productId!, filters),
    enabled: Boolean(productId),
  });
}
