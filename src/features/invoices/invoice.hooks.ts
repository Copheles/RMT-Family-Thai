import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addThaiInvoicePayment,
  getThaiInvoice,
  listThaiInvoices,
  listThaiOutstandingInvoices,
  refundThaiInvoice,
} from "@/features/thai/thai.api";
import type { PaymentStatus, ThaiPaymentType } from "@/features/thai/thai.types";
import { queryKeys } from "@/lib/queryKeys";

export type ThaiInvoiceListFilters = {
  page: number;
  limit: number;
  search?: string;
  customerId?: string;
  paymentType?: ThaiPaymentType;
  paymentStatus?: PaymentStatus;
  sortBy?: "createdAt" | "date" | "invoiceNo" | "totalAmount";
  sortOrder?: "asc" | "desc";
};

export type ThaiOutstandingListFilters = {
  page: number;
  limit: number;
  search?: string;
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
        customerId: filters.customerId,
        paymentType: filters.paymentType,
        paymentStatus: filters.paymentStatus,
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

function outstandingKeyOf(filters: ThaiOutstandingListFilters): string {
  return JSON.stringify(filters);
}

export function useThaiOutstandingInvoices(filters: ThaiOutstandingListFilters, enabled = true) {
  return useQuery({
    queryKey: ["thai", "invoices", "outstanding", outstandingKeyOf(filters)],
    queryFn: () =>
      listThaiOutstandingInvoices({
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
      }),
    enabled,
  });
}

export function useAddThaiInvoicePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { paymentType: ThaiPaymentType; paidAmount: number; note?: string };
    }) => addThaiInvoicePayment(id, payload),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["thai", "invoices"] });
      queryClient.setQueryData(queryKeys.thai.invoice(invoice.id), invoice);
    },
  });
}

export function useRefundThaiInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        paymentType: ThaiPaymentType;
        note?: string;
        items: Array<{ invoiceItemId: string; quantity: number; restock: boolean }>;
      };
    }) => refundThaiInvoice(id, payload),
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: ["thai", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["thai", "products"] });
      queryClient.setQueryData(queryKeys.thai.invoice(invoice.id), invoice);
    },
  });
}
