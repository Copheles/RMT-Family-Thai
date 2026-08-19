import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { PageHeader, EmptyState, LoadingState, ErrorState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosToolbar, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import { PosRecordCard, PosRecordCardList } from "@/components/shared/pos/PosRecordCard";
import { PosPaginationFromMeta } from "@/components/shared/pos/PosPagination";
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { downloadThaiInvoicePdf } from "@/features/invoices/invoice.pdf";
import { useThaiInvoice, useThaiInvoices } from "@/features/invoices/invoice.hooks";
import type { ThaiInvoiceListFilters } from "@/features/invoices/invoice.hooks";
import { formatDate, formatMoneyShort } from "@/lib/format";
import {
  THAI_PAYMENT_TYPE_FILTERS,
  thaiPaymentTypeToApi,
  type ThaiPaymentTypeFilter,
} from "@/lib/listFilters";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import {
  useUrlEnumParam,
  useUrlLimit,
  useUrlPage,
  useUrlStringParam,
} from "@/hooks/useUrlQuery";

const invoiceSortFields: NonNullable<ThaiInvoiceListFilters["sortBy"]>[] = [
  "createdAt",
  "invoiceNo",
  "totalAmount",
  "date",
];

const SORT_ORDER_VALUES = ["asc", "desc"] as const;

function money(value: number): string {
  return formatMoneyShort(value);
}

function paymentTypeLabel(value: ThaiPaymentTypeFilter): string {
  return value === "ALL" ? "All payments" : value;
}

export function InvoicesPage() {
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(PAGE_SIZE.invoices, PAGE_SIZE_OPTIONS.invoices);
  const [paymentType, setPaymentType] = useUrlEnumParam<ThaiPaymentTypeFilter>(
    "payment",
    "ALL",
    THAI_PAYMENT_TYPE_FILTERS,
  );
  const [sortByRaw, setSortBy] = useUrlStringParam("sort", "createdAt");
  const sortBy = (invoiceSortFields.includes(
    sortByRaw as NonNullable<ThaiInvoiceListFilters["sortBy"]>,
  )
    ? sortByRaw
    : "createdAt") as NonNullable<ThaiInvoiceListFilters["sortBy"]>;
  const [sortOrder, setSortOrder] = useUrlEnumParam<"asc" | "desc">(
    "order",
    "desc",
    SORT_ORDER_VALUES,
  );
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const filters = useMemo<ThaiInvoiceListFilters>(
    () => ({
      page,
      limit,
      search: appliedSearch || undefined,
      paymentType: thaiPaymentTypeToApi(paymentType),
      sortBy,
      sortOrder,
    }),
    [page, limit, appliedSearch, paymentType, sortBy, sortOrder],
  );

  const { data, isLoading, isError } = useThaiInvoices(filters);
  const rows = data?.data ?? [];

  return (
    <PosPageShell>
      <PageHeader title="Invoices" description="Thai invoice history." />

      <PosToolbar>
        <PosToolbarGroup className="w-full flex-col items-stretch gap-3 lg:flex-row lg:items-end">
          <div className="min-w-[220px] flex-1">
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder="Invoice no, customer, notes..."
            />
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Sort by</label>
            <Select
              value={sortBy}
              onChange={(event) => {
                setSortBy(event.target.value);
              }}
            >
              {invoiceSortFields.map((field) => (
                <option key={field} value={field}>
                  {field === "createdAt"
                    ? "Created"
                    : field === "date"
                      ? "Invoice Date"
                      : field === "invoiceNo"
                        ? "Invoice No"
                        : "Total Amount"}
                </option>
              ))}
            </Select>
          </div>
          <div className="min-w-[120px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Order</label>
            <Select
              value={sortOrder}
              onChange={(event) => {
                setSortOrder(event.target.value as "asc" | "desc");
              }}
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </Select>
          </div>
          <div className="min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment</label>
            <Select
              value={paymentType}
              onChange={(event) => {
                setPaymentType(event.target.value as ThaiPaymentTypeFilter);
              }}
            >
              {THAI_PAYMENT_TYPE_FILTERS.map((value) => (
                <option key={value} value={value}>
                  {paymentTypeLabel(value)}
                </option>
              ))}
            </Select>
          </div>
        </PosToolbarGroup>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading invoices..." />
      ) : isError ? (
        <ErrorState message="Unable to load invoices." />
      ) : rows.length === 0 ? (
        <EmptyState message="No invoices found." />
      ) : (
        <>
          <PosRecordCardList className="md:hidden">
            {rows.map((invoice) => (
              <PosRecordCard
                key={invoice.id}
                title={invoice.invoiceNo}
                subtitle={invoice.customer.name}
                trailing={
                  <span className="text-sm font-semibold tabular-nums">
                    {money(invoice.totalAmount)}
                  </span>
                }
                fields={[
                  { label: "Date", value: formatDate(invoice.date) },
                  { label: "Payment", value: invoice.paymentType },
                  { label: "Items", value: invoice.items.length },
                ]}
                actions={
                  <>
                    <Button size="sm" variant="outline" onClick={() => setSelectedInvoiceId(invoice.id)}>
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void downloadThaiInvoicePdf(invoice)}
                    >
                      PDF
                    </Button>
                  </>
                }
              />
            ))}
          </PosRecordCardList>

          <div className="hidden md:block">
            <PosDataTable>
              <PosTable>
                <PosTableHead>
                  <PosTableRow>
                    <PosTableHeaderCell>Invoice No</PosTableHeaderCell>
                    <PosTableHeaderCell>Date</PosTableHeaderCell>
                    <PosTableHeaderCell>Customer</PosTableHeaderCell>
                    <PosTableHeaderCell>Payment</PosTableHeaderCell>
                    <PosTableHeaderCell>Items</PosTableHeaderCell>
                    <PosTableHeaderCell>Total</PosTableHeaderCell>
                    <PosTableHeaderCell>Actions</PosTableHeaderCell>
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {rows.map((invoice) => (
                    <PosTableRow key={invoice.id}>
                      <PosTableCell className="font-medium">{invoice.invoiceNo}</PosTableCell>
                      <PosTableCell>{formatDate(invoice.date)}</PosTableCell>
                      <PosTableCell>{invoice.customer.name}</PosTableCell>
                      <PosTableCell>{invoice.paymentType}</PosTableCell>
                      <PosTableCell className="tabular-nums">{invoice.items.length}</PosTableCell>
                      <PosTableCell className="tabular-nums font-semibold">
                        {money(invoice.totalAmount)}
                      </PosTableCell>
                      <PosTableCell>
                        <div className="flex gap-1.5">
                          <Button size="sm" variant="outline" onClick={() => setSelectedInvoiceId(invoice.id)}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void downloadThaiInvoicePdf(invoice)}
                          >
                            PDF
                          </Button>
                        </div>
                      </PosTableCell>
                    </PosTableRow>
                  ))}
                </PosTableBody>
              </PosTable>
            </PosDataTable>
          </div>

          {data?.meta && (
            <PosPaginationFromMeta
              meta={data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.invoices}
              onPageSizeChange={setLimit}
            />
          )}
        </>
      )}

      <InvoiceDetailModal
        invoiceId={selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
      />
    </PosPageShell>
  );
}

function InvoiceDetailModal({
  invoiceId,
  onClose,
}: {
  invoiceId: string | null;
  onClose: () => void;
}) {
  const { data: invoice, isLoading, isError } = useThaiInvoice(invoiceId);

  if (!invoiceId) return null;

  return (
    <PosModal
      title={invoice ? `Invoice ${invoice.invoiceNo}` : "Invoice Detail"}
      onClose={onClose}
      wide
    >
      {isLoading ? (
        <LoadingState label="Loading invoice detail..." />
      ) : isError || !invoice ? (
        <ErrorState message="Unable to load invoice detail." />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/10 p-4 text-sm md:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Customer
              </p>
              <p className="mt-1 font-medium">{invoice.customer.name}</p>
              <p className="text-xs text-muted-foreground">{invoice.customer.phone}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Invoice
              </p>
              <p className="mt-1 font-medium">{formatDate(invoice.date)}</p>
              <p className="text-xs text-muted-foreground">{invoice.paymentType}</p>
            </div>
          </div>

          <PosDataTable>
            <PosTable>
              <PosTableHead>
                <PosTableRow>
                  <PosTableHeaderCell>Product</PosTableHeaderCell>
                  <PosTableHeaderCell>Qty</PosTableHeaderCell>
                  <PosTableHeaderCell>Unit Price</PosTableHeaderCell>
                  <PosTableHeaderCell>Total</PosTableHeaderCell>
                </PosTableRow>
              </PosTableHead>
              <PosTableBody>
                {invoice.items.map((item) => (
                  <PosTableRow key={item.id}>
                    <PosTableCell>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Code: {item.product.productCode}
                      </p>
                    </PosTableCell>
                    <PosTableCell className="tabular-nums">{item.quantity}</PosTableCell>
                    <PosTableCell className="tabular-nums">{money(item.unitPrice)}</PosTableCell>
                    <PosTableCell className="tabular-nums font-medium">{money(item.total)}</PosTableCell>
                  </PosTableRow>
                ))}
              </PosTableBody>
            </PosTable>
          </PosDataTable>

          <div className="space-y-2 rounded-xl border border-border/70 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{money(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums text-destructive">-{money(invoice.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">{money(invoice.taxAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="tabular-nums">{money(invoice.deliveryFee)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
              <span>Total</span>
              <span className="tabular-nums text-primary">{money(invoice.totalAmount)}</span>
            </div>
          </div>

          {invoice.notes ? (
            <div className="rounded-xl border border-border/70 p-4 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Notes
              </p>
              <p className="mt-1">{invoice.notes}</p>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={() => void downloadThaiInvoicePdf(invoice)}>
              Download PDF
            </Button>
          </div>
        </div>
      )}
    </PosModal>
  );
}
