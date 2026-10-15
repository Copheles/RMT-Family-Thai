import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosSummaryCards, PosSummaryCard } from "@/components/shared/pos/PosSummaryCards";
import { PosToolbar, PosToolbarActions, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
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
import { PosToaster, usePosToast } from "@/components/shared/pos/PosToast";
import {
  ThaiAddPaymentModal,
  ViewThaiCustomerOrdersLink,
} from "@/features/invoices/invoice-settlement";
import {
  useAddThaiInvoicePayment,
  useThaiOutstandingInvoices,
} from "@/features/invoices/invoice.hooks";
import type { ThaiOutstandingRow } from "@/features/thai/thai.types";
import {
  usePayablePurchases,
  useSettleBatchPayment,
} from "@/features/batches/batch.hooks";
import type { Batch } from "@/features/batches/batch.types";
import { PayVendorModal, purchaseStatusLabel } from "@/features/batches/purchase-settlement";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useIsMobileLayout } from "@/hooks/useMediaQuery";
import { useUrlLimit, useUrlPage, useUrlStringParam } from "@/hooks/useUrlQuery";
import { formatDate, formatMoneyShort } from "@/lib/format";
import { resetUrlPage, writeUrlString } from "@/lib/urlQuery";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";

const OUTSTANDING_TABS = ["collect", "pay"] as const;
type OutstandingTab = (typeof OUTSTANDING_TABS)[number];

function isOutstandingTab(value: string): value is OutstandingTab {
  return OUTSTANDING_TABS.includes(value as OutstandingTab);
}

export function OutstandingPage() {
  const isMobile = useIsMobileLayout();
  const { toasts, showToast, dismiss } = usePosToast();
  const [, setSearchParams] = useSearchParams();
  const [tabParam] = useUrlStringParam("tab", "collect");
  const tab: OutstandingTab = isOutstandingTab(tabParam) ? tabParam : "collect";

  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(PAGE_SIZE.invoices, PAGE_SIZE_OPTIONS.invoices);
  const [paymentTarget, setPaymentTarget] = useState<ThaiOutstandingRow | null>(null);
  const [payTarget, setPayTarget] = useState<Batch | null>(null);

  const collectFilters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch || undefined,
    }),
    [page, limit, appliedSearch],
  );

  const payFilters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch || undefined,
    }),
    [page, limit, appliedSearch],
  );

  const outstandingQuery = useThaiOutstandingInvoices(collectFilters, tab === "collect");
  const payableQuery = usePayablePurchases(payFilters, tab === "pay");
  const addPaymentMutation = useAddThaiInvoicePayment();
  const settleMutation = useSettleBatchPayment();

  const collectRows = outstandingQuery.data?.data ?? [];
  const payRows = payableQuery.data?.data ?? [];
  const paySummary = payableQuery.data?.summary;

  const headerDescription =
    tab === "collect"
      ? "Customer debit invoices — collect payments here."
      : "Credit purchases — pay vendors from available funds and capital.";

  const searchPlaceholder =
    tab === "collect"
      ? "Customer, phone, invoice no..."
      : "Product, code, vendor...";

  const switchTab = useCallback(
    (next: OutstandingTab) => {
      setSearchInput("");
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          writeUrlString(params, "tab", next, "collect");
          params.delete("q");
          resetUrlPage(params);
          return params;
        },
        { replace: true },
      );
    },
    [setSearchInput, setSearchParams],
  );

  return (
    <PosPageShell>
      <PageHeader title="Outstanding" description={headerDescription} />

      <div className="mb-4">
        <PosFilterTabs
          value={tab}
          options={OUTSTANDING_TABS}
          onChange={switchTab}
          getLabel={(value) => (value === "collect" ? "To collect" : "To pay")}
        />
      </div>

      {tab === "pay" ? (
        <PosSummaryCards className="mb-4 lg:grid-cols-2">
          <PosSummaryCard label="Payable purchases" value={paySummary?.payableCount ?? 0} />
          <PosSummaryCard
            label="Total to pay"
            value={formatMoneyShort(paySummary?.totalOutstanding ?? 0)}
            accent
          />
        </PosSummaryCards>
      ) : null}

      <PosToolbar>
        <PosToolbarGroup className="min-w-0 flex-1">
          <div className="min-w-[220px] flex-1">
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder={searchPlaceholder}
              className="max-w-none"
            />
          </div>
        </PosToolbarGroup>
        <PosToolbarActions>
          <Button variant="outline" size="sm" onClick={resetSearch}>
            Reset
          </Button>
        </PosToolbarActions>
      </PosToolbar>

      {tab === "collect" ? (
        <>
          {outstandingQuery.isLoading ? (
            <LoadingState label="Loading outstanding invoices..." />
          ) : outstandingQuery.isError ? (
            <ErrorState message="Unable to load outstanding invoices." />
          ) : collectRows.length === 0 ? (
            <EmptyState message="No outstanding invoices." />
          ) : (
            <>
              {isMobile ? (
                <PosRecordCardList>
                  {collectRows.map((row) => (
                    <PosRecordCard
                      key={row.invoice.id}
                      title={row.customer.name}
                      subtitle={row.customer.phone}
                      trailing={
                        <span className="text-sm font-semibold text-destructive">
                          {formatMoneyShort(row.invoice.balanceDue)}
                        </span>
                      }
                      fields={[
                        { label: "Invoice", value: row.invoice.invoiceNo },
                        { label: "Total", value: formatMoneyShort(row.invoice.totalAmount) },
                        { label: "Paid", value: formatMoneyShort(row.invoice.paidTotal) },
                        { label: "Date", value: formatDate(row.invoice.createdAt) },
                      ]}
                      actions={
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" onClick={() => setPaymentTarget(row)}>
                            Add payment
                          </Button>
                          <ViewThaiCustomerOrdersLink customerId={row.customer.id} />
                        </div>
                      }
                    />
                  ))}
                </PosRecordCardList>
              ) : (
                <PosDataTable>
                  <PosTable>
                    <PosTableHead>
                      <PosTableRow>
                        <PosTableHeaderCell>Customer</PosTableHeaderCell>
                        <PosTableHeaderCell>Phone</PosTableHeaderCell>
                        <PosTableHeaderCell>Invoice</PosTableHeaderCell>
                        <PosTableHeaderCell>Total</PosTableHeaderCell>
                        <PosTableHeaderCell>Paid</PosTableHeaderCell>
                        <PosTableHeaderCell>Outstanding</PosTableHeaderCell>
                        <PosTableHeaderCell>Date</PosTableHeaderCell>
                        <PosTableHeaderCell />
                      </PosTableRow>
                    </PosTableHead>
                    <PosTableBody>
                      {collectRows.map((row) => (
                        <PosTableRow key={row.invoice.id}>
                          <PosTableCell className="font-medium">{row.customer.name}</PosTableCell>
                          <PosTableCell>{row.customer.phone}</PosTableCell>
                          <PosTableCell>{row.invoice.invoiceNo}</PosTableCell>
                          <PosTableCell className="tabular-nums">
                            {formatMoneyShort(row.invoice.totalAmount)}
                          </PosTableCell>
                          <PosTableCell className="tabular-nums">
                            {formatMoneyShort(row.invoice.paidTotal)}
                          </PosTableCell>
                          <PosTableCell className="tabular-nums font-semibold text-destructive">
                            {formatMoneyShort(row.invoice.balanceDue)}
                          </PosTableCell>
                          <PosTableCell>{formatDate(row.invoice.createdAt)}</PosTableCell>
                          <PosTableCell>
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => setPaymentTarget(row)}>
                                Add payment
                              </Button>
                              <ViewThaiCustomerOrdersLink customerId={row.customer.id} />
                            </div>
                          </PosTableCell>
                        </PosTableRow>
                      ))}
                    </PosTableBody>
                  </PosTable>
                </PosDataTable>
              )}

              {outstandingQuery.data?.meta ? (
                <PosPaginationFromMeta
                  meta={outstandingQuery.data.meta}
                  onPageChange={setPage}
                  pageSizeOptions={PAGE_SIZE_OPTIONS.invoices}
                  onPageSizeChange={setLimit}
                />
              ) : null}
            </>
          )}
        </>
      ) : payableQuery.isLoading ? (
        <LoadingState label="Loading payable purchases..." />
      ) : payableQuery.isError ? (
        <ErrorState message="Unable to load payable purchases." />
      ) : payRows.length === 0 ? (
        <EmptyState message="No vendor payments due." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {payRows.map((row) => {
                const lineTotal = row.quantity * row.unitCost;
                return (
                  <PosRecordCard
                    key={row.id}
                    title={row.product?.name ?? "Product"}
                    subtitle={row.vendorName ?? "—"}
                    trailing={
                      <span className="text-sm font-semibold text-destructive tabular-nums">
                        {formatMoneyShort(row.outstanding ?? lineTotal)}
                      </span>
                    }
                    fields={[
                      { label: "Date", value: formatDate(row.receivedAt) },
                      { label: "Line total", value: formatMoneyShort(lineTotal) },
                      { label: "Status", value: purchaseStatusLabel(row.purchaseStatus) },
                    ]}
                    actions={
                      <Button size="sm" className="w-full" onClick={() => setPayTarget(row)}>
                        Pay
                      </Button>
                    }
                  />
                );
              })}
            </PosRecordCardList>
          ) : (
            <PosDataTable>
              <PosTable>
                <PosTableHead>
                  <PosTableRow>
                    <PosTableHeaderCell>Date</PosTableHeaderCell>
                    <PosTableHeaderCell>Product</PosTableHeaderCell>
                    <PosTableHeaderCell>Vendor</PosTableHeaderCell>
                    <PosTableHeaderCell>Status</PosTableHeaderCell>
                    <PosTableHeaderCell className="text-right">Line total</PosTableHeaderCell>
                    <PosTableHeaderCell className="text-right">Outstanding</PosTableHeaderCell>
                    <PosTableHeaderCell />
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {payRows.map((row) => {
                    const lineTotal = row.quantity * row.unitCost;
                    return (
                      <PosTableRow key={row.id}>
                        <PosTableCell>{formatDate(row.receivedAt)}</PosTableCell>
                        <PosTableCell>
                          <div className="min-w-0">
                            <p className="truncate font-medium">{row.product?.name ?? "—"}</p>
                            <p className="truncate text-xs text-muted-foreground">
                              {row.product?.productCode ?? row.productId}
                            </p>
                          </div>
                        </PosTableCell>
                        <PosTableCell>{row.vendorName ?? "—"}</PosTableCell>
                        <PosTableCell>{purchaseStatusLabel(row.purchaseStatus)}</PosTableCell>
                        <PosTableCell className="text-right tabular-nums">
                          {formatMoneyShort(lineTotal)}
                        </PosTableCell>
                        <PosTableCell className="text-right tabular-nums font-semibold text-destructive">
                          {formatMoneyShort(row.outstanding ?? lineTotal)}
                        </PosTableCell>
                        <PosTableCell>
                          <Button size="sm" onClick={() => setPayTarget(row)}>
                            Pay
                          </Button>
                        </PosTableCell>
                      </PosTableRow>
                    );
                  })}
                </PosTableBody>
              </PosTable>
            </PosDataTable>
          )}

          {payableQuery.data?.meta ? (
            <PosPaginationFromMeta
              meta={payableQuery.data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.invoices}
              onPageSizeChange={setLimit}
            />
          ) : null}
        </>
      )}

      {paymentTarget ? (
        <ThaiAddPaymentModal
          invoice={paymentTarget.invoice}
          customerName={paymentTarget.customer.name}
          saving={addPaymentMutation.isPending}
          onClose={() => setPaymentTarget(null)}
          onSubmit={(payload) =>
            addPaymentMutation.mutate(
              { id: paymentTarget.invoice.id, payload },
              {
                onSuccess: () => {
                  showToast("success", "Payment recorded.");
                  setPaymentTarget(null);
                },
                onError: () => showToast("error", "Unable to record payment."),
              },
            )
          }
        />
      ) : null}

      {payTarget ? (
        <PayVendorModal
          batch={payTarget}
          saving={settleMutation.isPending}
          onClose={() => setPayTarget(null)}
          onSubmit={(amount) =>
            settleMutation.mutate(
              { batchId: payTarget.id, payload: { amount } },
              {
                onSuccess: () => {
                  showToast("success", "Vendor payment recorded.");
                  setPayTarget(null);
                },
                onError: () => showToast("error", "Unable to record vendor payment."),
              },
            )
          }
        />
      ) : null}

      <PosToaster toasts={toasts} onDismiss={dismiss} />
    </PosPageShell>
  );
}
