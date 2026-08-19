import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { PageHeader, EmptyState, LoadingState, ErrorState } from "@/components/shared/PageStates";
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import {
  PosDataTable,
  PosTable,
  PosTableBody,
  PosTableCell,
  PosTableHead,
  PosTableHeaderCell,
  PosTableRow,
} from "@/components/shared/pos/PosDataTable";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import {
  PosRecordCard,
  PosRecordCardList,
} from "@/components/shared/pos/PosRecordCard";
import { StatCard } from "@/components/shared/pos/StatCard";
import { PosToolbar, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { RankBadge } from "@/components/shared/pos/ReportHelpers";
import { getThaiSaleReport } from "@/features/thai/thai.api";
import { formatMoneyShort, todayISO } from "@/lib/format";
import { queryKeys } from "@/lib/queryKeys";

function dayStartIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function dayEndIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function SaleReportPage() {
  const [fromDate, setFromDate] = useState(todayISO());
  const [toDate, setToDate] = useState(todayISO());

  const filters = useMemo(
    () => ({
      dateFrom: dayStartIso(fromDate),
      dateTo: dayEndIso(toDate),
    }),
    [fromDate, toDate],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.thai.saleReport(JSON.stringify(filters)),
    queryFn: () => getThaiSaleReport(filters),
  });

  const products = data?.products ?? [];

  return (
    <PosPageShell>
      <PageHeader
        title="Sale Report"
        description="Product sales performance for the selected date range."
      />

      <PosToolbar>
        <PosToolbarGroup>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              From
            </label>
            <PosDatePicker
              value={fromDate}
              onChange={setFromDate}
              placeholder="From date"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              To
            </label>
            <PosDatePicker
              value={toDate}
              onChange={setToDate}
              placeholder="To date"
            />
          </div>
        </PosToolbarGroup>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading sale report..." />
      ) : isError ? (
        <ErrorState message="Unable to load sale report." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard icon={Package} label="Sold Qty" value={data?.soldQty ?? 0} />
            <StatCard
              icon={Receipt}
              label="Gross Sales"
              value={formatMoneyShort(data?.grossSales ?? 0)}
            />
            <StatCard
              icon={Wallet}
              label="Net Sales"
              value={formatMoneyShort(data?.netSales ?? 0)}
            />
            <StatCard
              icon={TrendingUp}
              label="Profit"
              value={formatMoneyShort(data?.profit ?? 0)}
              accent
            />
          </div>

          {products.length === 0 ? (
            <EmptyState message="No product sales in this date range." />
          ) : (
            <>
              <PosRecordCardList>
                {products.map((row, index) => {
                  const rank = index + 1;
                  return (
                    <PosRecordCard
                      key={row.productId}
                      title={row.name}
                      leading={<RankBadge rank={rank} />}
                      fields={[
                        { label: "Qty", value: row.qty },
                        { label: "Gross", value: formatMoneyShort(row.gross) },
                        { label: "Net", value: formatMoneyShort(row.net) },
                        { label: "Profit", value: formatMoneyShort(row.profit) },
                      ]}
                    />
                  );
                })}
              </PosRecordCardList>

              <div className="hidden md:block">
                <PosDataTable>
                  <PosTable>
                    <PosTableHead>
                      <PosTableRow>
                        <PosTableHeaderCell>Rank</PosTableHeaderCell>
                        <PosTableHeaderCell>Product</PosTableHeaderCell>
                        <PosTableHeaderCell>Qty</PosTableHeaderCell>
                        <PosTableHeaderCell>Gross</PosTableHeaderCell>
                        <PosTableHeaderCell>Net</PosTableHeaderCell>
                        <PosTableHeaderCell>Profit</PosTableHeaderCell>
                      </PosTableRow>
                    </PosTableHead>
                    <PosTableBody>
                      {products.map((row, index) => {
                        const rank = index + 1;
                        return (
                          <PosTableRow key={row.productId}>
                            <PosTableCell>
                              <RankBadge rank={rank} />
                            </PosTableCell>
                            <PosTableCell className="font-medium">{row.name}</PosTableCell>
                            <PosTableCell className="tabular-nums">{row.qty}</PosTableCell>
                            <PosTableCell className="tabular-nums">
                              {formatMoneyShort(row.gross)}
                            </PosTableCell>
                            <PosTableCell className="tabular-nums">
                              {formatMoneyShort(row.net)}
                            </PosTableCell>
                            <PosTableCell className="tabular-nums text-primary">
                              {formatMoneyShort(row.profit)}
                            </PosTableCell>
                          </PosTableRow>
                        );
                      })}
                    </PosTableBody>
                  </PosTable>
                </PosDataTable>
              </div>
            </>
          )}
        </>
      )}
    </PosPageShell>
  );
}
