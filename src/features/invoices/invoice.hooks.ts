import { useQuery } from "@tanstack/react-query";
import { getThaiInvoice, listThaiInvoices } from "@/features/thai/thai.api";
import type { ThaiPaymentType } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";

export type ThaiInvoiceListFilters = {
  page: number;
  limit: number;
  search?: string;
  paymentType?: ThaiPaymentType;
  sortBy?: "createdAt" | "date" | "invoiceNo" | "totalAmount";
  sortOrder?: "asc" | "desc";
};

function keyOf(filters: ThaiInvoiceListFilters): string {
  return JSON.stringify(filters);
}

export function useThaiInvoices(filters: ThaiInvoiceListFilters) {
  return useQuery({
    queryKey: queryKeys.thai.invoices(keyOf(filters)),
    queryFn: () =>
      listThaiInvoices({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        paymentType: filters.paymentType,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      }),
  });
}

export function useThaiInvoice(id: string | null) {
  return useQuery({
    queryKey: queryKeys.thai.invoice(id ?? "none"),
    queryFn: () => getThaiInvoice(id!),
    enabled: Boolean(id),
  });
}
