import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosToolbar, PosToolbarActions, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
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
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useIsMobileLayout } from "@/hooks/useMediaQuery";
import { useUrlLimit, useUrlPage } from "@/hooks/useUrlQuery";
import { formatDate, formatMoneyShort } from "@/lib/format";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";

export function OutstandingPage() {
  const isMobile = useIsMobileLayout();
  const { toasts, showToast, dismiss } = usePosToast();
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

  const filters = useMemo(
    () => ({ page, limit, search: appliedSearch || undefined }),
    [page, limit, appliedSearch],
  );

  const outstandingQuery = useThaiOutstandingInvoices(filters);
  const addPaymentMutation = useAddThaiInvoicePayment();
  const rows = outstandingQuery.data?.data ?? [];

  return (
    <PosPageShell>
      <PageHeader
        title="Outstanding"
        description="Unpaid debit invoices — collect payments here."
      />

      <PosToolbar>
        <PosToolbarGroup className="w-full min-w-0 lg:col-span-2">
          <PosSearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={submitSearch}
            onClear={resetSearch}
            placeholder="Customer, phone, invoice no..."
          />
        </PosToolbarGroup>
        <PosToolbarActions>
          <Button variant="outline" size="sm" onClick={resetSearch}>
            Reset
          </Button>
        </PosToolbarActions>
      </PosToolbar>

      {outstandingQuery.isLoading ? (
        <LoadingState label="Loading outstanding invoices..." />
      ) : outstandingQuery.isError ? (
        <ErrorState message="Unable to load outstanding invoices." />
      ) : rows.length === 0 ? (
        <EmptyState message="No outstanding invoices." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {rows.map((row) => (
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
                  {rows.map((row) => (
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

          {outstandingQuery.data?.meta && (
            <PosPaginationFromMeta
              meta={outstandingQuery.data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.invoices}
              onPageSizeChange={setLimit}
            />
          )}
        </>
      )}

      {paymentTarget && (
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
      )}

      <PosToaster toasts={toasts} onDismiss={dismiss} />
    </PosPageShell>
  );
}
