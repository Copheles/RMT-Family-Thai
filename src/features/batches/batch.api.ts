import { axiosClient } from "@/lib/axios";
import type { ApiEnvelope } from "@/types/api";
import type {
  Batch,
  BatchFilters,
  BatchListResponse,
  InventorySummary,
  PayableFilters,
  PayableListResponse,
  PurchaseFilters,
  PurchaseListResponse,
  SettleBatchPayload,
  StockInPayload,
} from "./batch.types";

const THAI = "/thai/products";

function buildBatchParams(filters: BatchFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  params.set("sortBy", "receivedAt");
  params.set("sortOrder", "desc");
  return params;
}

function buildPurchaseParams(filters: PurchaseFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  params.set("sortBy", "receivedAt");
  params.set("sortOrder", "desc");
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.search) params.set("search", filters.search);
  if (filters.vendorId) params.set("vendorId", filters.vendorId);
  return params;
}

function buildPayableParams(filters: PayableFilters): URLSearchParams {
  const params = new URLSearchParams();
  params.set("page", String(filters.page));
  params.set("limit", String(filters.limit));
  params.set("sortBy", "receivedAt");
  params.set("sortOrder", "desc");
  if (filters.search) params.set("search", filters.search);
  return params;
}

export async function getInventorySummary(): Promise<InventorySummary> {
  const { data } = await axiosClient.get<ApiEnvelope<InventorySummary>>(
    `${THAI}/inventory-summary`,
  );
  return data.data;
}

export async function getBatchesByProduct(
  productId: string,
  filters: BatchFilters,
): Promise<BatchListResponse> {
  const { data } = await axiosClient.get<ApiEnvelope<BatchListResponse>>(
    `${THAI}/${productId}/batches?${buildBatchParams(filters).toString()}`,
  );
  return data.data;
}

export async function listPurchases(filters: PurchaseFilters): Promise<PurchaseListResponse> {
  const { data } = await axiosClient.get<ApiEnvelope<PurchaseListResponse>>(
    `${THAI}/batches?${buildPurchaseParams(filters).toString()}`,
  );
  return data.data;
}

export async function listPayable(filters: PayableFilters): Promise<PayableListResponse> {
  const { data } = await axiosClient.get<ApiEnvelope<PayableListResponse>>(
    `${THAI}/batches/payable?${buildPayableParams(filters).toString()}`,
  );
  return data.data;
}

export async function stockIn(productId: string, payload: StockInPayload): Promise<Batch> {
  const { data } = await axiosClient.post<ApiEnvelope<Batch>>(
    `${THAI}/${productId}/batches`,
    payload,
  );
  return data.data;
}

export async function settleBatchPayment(
  batchId: string,
  payload: SettleBatchPayload,
): Promise<Batch> {
  const { data } = await axiosClient.post<ApiEnvelope<Batch>>(
    `${THAI}/batches/${batchId}/settle`,
    payload,
  );
  return data.data;
}
