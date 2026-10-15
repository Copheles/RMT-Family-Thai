import { useMemo } from "react";
import { useIsMobileLayout } from "@/hooks/useMediaQuery";
import { Button } from "@/components/ui/button";
import { EmptyState, LoadingState } from "@/components/shared/PageStates";
import { PosSummaryCards, PosSummaryCard } from "@/components/shared/pos/PosSummaryCards";
import { PosToolbar, PosToolbarActions, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
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
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import { PosSearchBar } from "@/components/shared/pos/PosSearchBar";
import { useAppliedSearch } from "@/hooks/useAppliedSearch";
import { useUrlLimit, useUrlPage, useUrlStringParam } from "@/hooks/useUrlQuery";
import { usePurchases } from "@/features/batches/batch.hooks";
import { purchaseStatusLabel } from "@/features/batches/purchase-settlement";
import { PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/lib/queryConfig";
import { formatDate, formatMoneyShort, todayISO } from "@/lib/format";

function dayStartIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function dayEndIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function PurchasesFlow() {
  const isMobile = useIsMobileLayout();
  const {
    searchInput,
    setSearchInput,
    appliedSearch,
    submitSearch,
    resetSearch,
  } = useAppliedSearch();
  const [page, setPage] = useUrlPage();
  const [limit, setLimit] = useUrlLimit(PAGE_SIZE.batches, PAGE_SIZE_OPTIONS.batches);
  const [dateFrom, setDateFrom] = useUrlStringParam("from", todayISO());
  const [dateTo, setDateTo] = useUrlStringParam("to", todayISO());

  const filters = useMemo(
    () => ({
      page,
      limit,
      search: appliedSearch || undefined,
      dateFrom: dateFrom ? dayStartIso(dateFrom) : undefined,
      dateTo: dateTo ? dayEndIso(dateTo) : undefined,
    }),
    [page, limit, appliedSearch, dateFrom, dateTo],
  );

  const { data, isLoading } = usePurchases(filters);
  const rows = data?.data ?? [];
  const summary = data?.summary;

  function resetFilters() {
    resetSearch();
    setDateFrom(todayISO());
    setDateTo(todayISO());
  }

  return (
    <div className="space-y-4">
      <PosSummaryCards className="lg:grid-cols-5">
        <PosSummaryCard label="Purchase count" value={summary?.purchaseCount ?? 0} />
        <PosSummaryCard
          label="Total purchase amount"
          value={formatMoneyShort(summary?.totalPurchaseAmount ?? 0)}
          accent
        />
        <PosSummaryCard
          label="Vendor outstanding"
          value={formatMoneyShort(summary?.totalOutstanding ?? 0)}
        />
        <PosSummaryCard
          label="Paid from funds"
          value={formatMoneyShort(summary?.totalPaidFromFunds ?? 0)}
        />
        <PosSummaryCard
          label="Paid from capital"
          value={formatMoneyShort(summary?.totalPaidFromCapital ?? 0)}
        />
      </PosSummaryCards>

      <PosToolbar>
        <PosToolbarGroup>
          <div className="min-w-[220px] flex-1">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Search
            </label>
            <PosSearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={submitSearch}
              onClear={resetSearch}
              placeholder="Product name, code, or barcode..."
              className="max-w-none"
            />
          </div>
          <div className="w-full min-w-[140px] sm:w-[160px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              From
            </label>
            <PosDatePicker value={dateFrom} onChange={setDateFrom} placeholder="From date" />
          </div>
          <div className="w-full min-w-[140px] sm:w-[160px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              To
            </label>
            <PosDatePicker value={dateTo} onChange={setDateTo} placeholder="To date" />
          </div>
        </PosToolbarGroup>
        <PosToolbarActions>
          <Button variant="outline" onClick={resetFilters}>
            Reset
          </Button>
        </PosToolbarActions>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading purchases..." />
      ) : rows.length === 0 ? (
        <EmptyState message="No purchases found for this range." />
      ) : (
        <>
          {isMobile ? (
            <PosRecordCardList>
              {rows.map((row) => {
                const lineTotal = row.quantity * row.unitCost;
                return (
                  <PosRecordCard
                    key={row.id}
                    title={row.product?.name ?? "Product"}
                    subtitle={`${formatDate(row.receivedAt)} · ${row.product?.productCode ?? ""}`}
                    trailing={
                      <span className="text-sm font-semibold tabular-nums">
                        {formatMoneyShort(lineTotal)}
                      </span>
                    }
                    fields={[
                      { label: "Qty", value: row.quantity },
                      { label: "Unit cost", value: formatMoneyShort(row.unitCost) },
                      { label: "Vendor", value: row.vendorName ?? "—" },
                      { label: "Status", value: purchaseStatusLabel(row.purchaseStatus) },
                      { label: "Outstanding", value: formatMoneyShort(row.outstanding ?? 0) },
                    ]}
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
                    <PosTableHeaderCell className="text-right">Qty</PosTableHeaderCell>
                    <PosTableHeaderCell className="text-right">Unit cost</PosTableHeaderCell>
                    <PosTableHeaderCell className="text-right">Line total</PosTableHeaderCell>
                    <PosTableHeaderCell>Vendor</PosTableHeaderCell>
                    <PosTableHeaderCell>Status</PosTableHeaderCell>
                    <PosTableHeaderCell className="text-right">Outstanding</PosTableHeaderCell>
                  </PosTableRow>
                </PosTableHead>
                <PosTableBody>
                  {rows.map((row) => {
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
                        <PosTableCell className="text-right tabular-nums">{row.quantity}</PosTableCell>
                        <PosTableCell className="text-right tabular-nums">
                          {formatMoneyShort(row.unitCost)}
                        </PosTableCell>
                        <PosTableCell className="text-right tabular-nums font-semibold">
                          {formatMoneyShort(lineTotal)}
                        </PosTableCell>
                        <PosTableCell>{row.vendorName ?? "—"}</PosTableCell>
                        <PosTableCell>{purchaseStatusLabel(row.purchaseStatus)}</PosTableCell>
                        <PosTableCell className="text-right tabular-nums">
                          {formatMoneyShort(row.outstanding ?? 0)}
                        </PosTableCell>
                      </PosTableRow>
                    );
                  })}
                </PosTableBody>
              </PosTable>
            </PosDataTable>
          )}

          {data?.meta ? (
            <PosPaginationFromMeta
              meta={data.meta}
              onPageChange={setPage}
              pageSizeOptions={PAGE_SIZE_OPTIONS.batches}
              onPageSizeChange={setLimit}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
