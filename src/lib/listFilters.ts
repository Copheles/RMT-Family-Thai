import type { ThaiPaymentType } from "@/features/thai/thai.types";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export type StockStatusFilter = "ALL" | StockStatus;

export const STOCK_STATUS_FILTERS: StockStatusFilter[] = [
  "ALL",
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
];

export function stockStatusToApi(
  value: StockStatusFilter,
): StockStatus | undefined {
  return value === "ALL" ? undefined : value;
}

export type ThaiPaymentTypeFilter = "ALL" | ThaiPaymentType;

export const THAI_PAYMENT_TYPE_FILTERS: ThaiPaymentTypeFilter[] = [
  "ALL",
  "CASH",
  "DEBIT",
  "CREDIT",
  "CHECK",
  "ZELLE",
];

export function thaiPaymentTypeToApi(
  value: ThaiPaymentTypeFilter,
): ThaiPaymentType | undefined {
  return value === "ALL" ? undefined : value;
}
