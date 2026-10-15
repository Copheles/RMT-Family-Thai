import type { PaginatedResult } from "@/types/api";

export type PurchasePaymentStatus = "PAID" | "CREDIT" | "PARTIAL";
export type PurchaseMode = "PAID" | "CREDIT";

export interface BatchProductRef {
  id: string;
  name: string;
  productCode: string;
  barcode: string;
}

export interface Batch {
  id: string;
  productId: string;
  quantity: number;
  unitCost: number;
  paidFromFunds?: number;
  paidFromCapital?: number;
  purchaseStatus?: PurchasePaymentStatus;
  outstanding?: number;
  receivedAt: string;
  vendorId?: string | null;
  vendorName: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  product?: BatchProductRef;
}

export interface BatchFilters {
  page: number;
  limit: number;
}

export interface PurchaseFilters {
  page: number;
  limit: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  vendorId?: string;
}

export interface PurchaseListSummary {
  purchaseCount: number;
  totalPurchaseAmount: number;
  totalPaidFromFunds: number;
  totalPaidFromCapital: number;
  totalOutstanding: number;
}

export interface PayableFilters {
  page: number;
  limit: number;
  search?: string;
}

export interface PayableListSummary {
  payableCount: number;
  totalOutstanding: number;
}

export interface StockInPayload {
  quantity: number;
  unitCost: number;
  purchaseMode?: PurchaseMode;
  receivedAt?: string;
  vendorId?: string | null;
  vendorName?: string;
  note?: string;
}

export interface SettleBatchPayload {
  amount: number;
}

export type BatchListResponse = PaginatedResult<Batch>;

export type PurchaseListResponse = PaginatedResult<Batch> & {
  summary: PurchaseListSummary;
};

export type PayableListResponse = PaginatedResult<Batch> & {
  summary: PayableListSummary;
};

export interface InventorySummary {
  productCount: number;
  totalStockQty: number;
  stockValue: number;
}
