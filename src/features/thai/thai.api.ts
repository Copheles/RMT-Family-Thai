import { axiosClient } from "@/lib/axios";
import type { ApiEnvelope } from "@/types/api";
import type {
  CreateThaiInvoicePayload,
  ListResponse,
  ThaiCategory,
  ThaiCustomer,
  ThaiExchange,
  ThaiExpense,
  ThaiInvoice,
  ThaiOutstandingRow,
  ThaiPaymentType,
  PaymentStatus,
  ThaiProduct,
  ThaiPackageList,
  ThaiSaleReport,
  ThaiSettings,
  ThaiSummaryReport,
  ThaiVendor,
  CreateThaiPackageListPayload,
} from "./thai.types";

function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const s = search.toString();
  return s ? `?${s}` : "";
}

export async function getThaiSettings() {
  const { data } = await axiosClient.get<ApiEnvelope<ThaiSettings>>("/thai/settings");
  return data.data;
}

export async function updateThaiSettings(payload: Partial<ThaiSettings>) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiSettings>>("/thai/settings", payload);
  return data.data;
}

export async function listThaiVendors(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiVendor>>>(
    `/thai/vendors${qs({ page: params.page ?? 1, limit: params.limit ?? 50, search: params.search, isActive: true })}`,
  );
  return data.data;
}

export async function createThaiVendor(payload: Partial<ThaiVendor> & { name: string }) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiVendor>>("/thai/vendors", payload);
  return data.data;
}

export async function updateThaiVendor(id: string, payload: Partial<ThaiVendor>) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiVendor>>(`/thai/vendors/${id}`, payload);
  return data.data;
}

export async function deleteThaiVendor(id: string) {
  await axiosClient.delete(`/thai/vendors/${id}`);
}

export async function listThaiCustomers(params: { page?: number; limit?: number; search?: string } = {}) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiCustomer>>>(
    `/thai/customers${qs({ page: params.page ?? 1, limit: params.limit ?? 50, search: params.search, isActive: true })}`,
  );
  return data.data;
}

export async function createThaiCustomer(payload: { name: string; phone: string; address?: string; notes?: string }) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiCustomer>>("/thai/customers", payload);
  return data.data;
}

export async function updateThaiCustomer(id: string, payload: Partial<ThaiCustomer>) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiCustomer>>(`/thai/customers/${id}`, payload);
  return data.data;
}

export async function deleteThaiCustomer(id: string) {
  await axiosClient.delete(`/thai/customers/${id}`);
}

export async function listThaiExpenses(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
  } = {},
) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiExpense>>>(
    `/thai/expenses${qs({
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    })}`,
  );
  return data.data;
}

export async function createThaiExpense(payload: { name: string; price: number; date: string }) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiExpense>>("/thai/expenses", payload);
  return data.data;
}

export async function updateThaiExpense(
  id: string,
  payload: Partial<{ name: string; price: number; date: string }>,
) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiExpense>>(
    `/thai/expenses/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteThaiExpense(id: string) {
  await axiosClient.delete(`/thai/expenses/${id}`);
}

export async function listThaiCategories() {
  const { data } = await axiosClient.get<ApiEnvelope<ThaiCategory[]>>("/thai/categories");
  return data.data;
}

export async function createThaiCategory(name: string) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiCategory>>("/thai/categories", { name });
  return data.data;
}

export async function listThaiProducts(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    stockStatus?: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  } = {},
) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiProduct>>>(
    `/thai/products${qs({
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search,
      categoryId: params.categoryId,
      stockStatus: params.stockStatus,
      isActive: true,
    })}`,
  );
  return data.data;
}

export async function createThaiProduct(payload: {
  name: string;
  barcode: string;
  description?: string;
  weightLb?: number;
  productCode: string;
  stockQty?: number;
  categoryId?: string | null;
}) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiProduct>>("/thai/products", payload);
  return data.data;
}

export async function updateThaiProduct(id: string, payload: Partial<ThaiProduct>) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiProduct>>(`/thai/products/${id}`, payload);
  return data.data;
}

export async function adjustThaiStock(id: string, stockQty: number) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiProduct>>(`/thai/products/${id}/stock`, { stockQty });
  return data.data;
}

export async function deleteThaiProduct(id: string) {
  await axiosClient.delete(`/thai/products/${id}`);
}

export async function listThaiInvoices(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    customerId?: string;
    paymentType?: ThaiPaymentType;
    paymentStatus?: PaymentStatus;
    sortBy?: "createdAt" | "date" | "invoiceNo" | "totalAmount";
    sortOrder?: "asc" | "desc";
  } = {},
) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiInvoice>>>(
    `/thai/invoices${qs({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      customerId: params.customerId,
      paymentType: params.paymentType,
      paymentStatus: params.paymentStatus,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })}`,
  );
  return data.data;
}

export async function getThaiInvoice(id: string) {
  const { data } = await axiosClient.get<ApiEnvelope<ThaiInvoice>>(`/thai/invoices/${id}`);
  return data.data;
}

export async function createThaiInvoice(payload: CreateThaiInvoicePayload) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiInvoice>>("/thai/invoices", payload);
  return data.data;
}

export async function listThaiOutstandingInvoices(params: {
  page?: number;
  limit?: number;
  search?: string;
}) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiOutstandingRow>>>(
    `/thai/invoices/outstanding${qs({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
    })}`,
  );
  return data.data;
}

export async function addThaiInvoicePayment(
  invoiceId: string,
  payload: { paymentType: ThaiPaymentType; paidAmount: number; note?: string },
) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiInvoice>>(
    `/thai/invoices/${invoiceId}/payments`,
    payload,
  );
  return data.data;
}

export async function refundThaiInvoice(
  invoiceId: string,
  payload: {
    paymentType: ThaiPaymentType;
    note?: string;
    items: Array<{ invoiceItemId: string; quantity: number; restock: boolean }>;
  },
) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiInvoice>>(
    `/thai/invoices/${invoiceId}/refunds`,
    payload,
  );
  return data.data;
}

export async function listThaiExchanges(
  params: {
    page?: number;
    limit?: number;
    search?: string;
    type?: string;
  } = {},
) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiExchange>>>(
    `/thai/exchanges${qs({
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search,
      type: params.type,
    })}`,
  );
  return data.data;
}

export async function createThaiExchange(payload: {
  name: string;
  amountMmk: number;
  rateMmkPerUsd: number;
  senderName: string;
  receiverName: string;
  type: string;
  date: string;
}) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiExchange>>("/thai/exchanges", payload);
  return data.data;
}

export async function updateThaiExchange(
  id: string,
  payload: Partial<{
    name: string;
    amountMmk: number;
    rateMmkPerUsd: number;
    senderName: string;
    receiverName: string;
    type: string;
    date: string;
  }>,
) {
  const { data } = await axiosClient.patch<ApiEnvelope<ThaiExchange>>(
    `/thai/exchanges/${id}`,
    payload,
  );
  return data.data;
}

export async function deleteThaiExchange(id: string) {
  await axiosClient.delete(`/thai/exchanges/${id}`);
}

export async function getThaiSaleReport(params: { dateFrom?: string; dateTo?: string } = {}) {
  const { data } = await axiosClient.get<ApiEnvelope<ThaiSaleReport>>(
    `/thai/reports/sale${qs(params)}`,
  );
  return data.data;
}

export async function getThaiSummaryReport(params: { dateFrom?: string; dateTo?: string } = {}) {
  const { data } = await axiosClient.get<ApiEnvelope<ThaiSummaryReport>>(
    `/thai/reports/summary${qs(params)}`,
  );
  return data.data;
}

export async function createThaiPackageList(payload: CreateThaiPackageListPayload) {
  const { data } = await axiosClient.post<ApiEnvelope<ThaiPackageList>>(
    "/thai/package-lists",
    payload,
  );
  return data.data;
}

export async function previewNextPackageListInvoice(date?: string) {
  const { data } = await axiosClient.get<
    ApiEnvelope<{ invoiceNo: string; invoiceDate: string }>
  >(`/thai/package-lists/next-invoice${qs({ date: date ? `${date}T00:00:00.000Z` : undefined })}`);
  return data.data;
}

export async function listThaiPackageLists(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "createdAt" | "date" | "listNo";
  sortOrder?: "asc" | "desc";
} = {}) {
  const { data } = await axiosClient.get<ApiEnvelope<ListResponse<ThaiPackageList>>>(
    `/thai/package-lists${qs({
      page: params.page ?? 1,
      limit: params.limit ?? 20,
      search: params.search,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
    })}`,
  );
  return data.data;
}

export async function getThaiPackageList(id: string) {
  const { data } = await axiosClient.get<ApiEnvelope<ThaiPackageList>>(
    `/thai/package-lists/${id}`,
  );
  return data.data;
}
