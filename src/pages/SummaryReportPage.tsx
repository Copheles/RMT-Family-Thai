import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Banknote,
  CreditCard,
  FileCheck,
  Package,
  Receipt,
  ShoppingCart,
  Smartphone,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader, LoadingState, ErrorState } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import { StatCard } from "@/components/shared/pos/StatCard";
import { PosToolbar, PosToolbarGroup } from "@/components/shared/pos/PosToolbar";
import { PaymentBar, SummaryRow } from "@/components/shared/pos/ReportHelpers";
import { getThaiSummaryReport } from "@/features/thai/thai.api";
import type { ThaiPaymentType } from "@/features/thai/thai.types";
import { formatMoneyShort, todayISO } from "@/lib/format";
import { queryKeys } from "@/lib/queryKeys";

const PAYMENT_ICONS: Record<ThaiPaymentType, LucideIcon> = {
  CASH: Banknote,
  DEBIT: CreditCard,
  CREDIT: CreditCard,
  CHECK: FileCheck,
  ZELLE: Smartphone,
};

function dayStartIso(date: string): string {
  return `${date}T00:00:00.000Z`;
}

function dayEndIso(date: string): string {
  return `${date}T23:59:59.999Z`;
}

export function SummaryReportPage() {
  const [date, setDate] = useState(todayISO());

  const filters = useMemo(
    () => ({
      dateFrom: dayStartIso(date),
      dateTo: dayEndIso(date),
    }),
    [date],
  );

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.thai.summaryReport(JSON.stringify(filters)),
    queryFn: () => getThaiSummaryReport(filters),
  });

  const sales = data?.sales;
  const paymentTotal =
    sales?.byPaymentType.reduce((sum, row) => sum + row.totalAmount, 0) ?? 0;
  const payments = (sales?.byPaymentType ?? []).map((row) => ({
    label: row.paymentType,
    icon: PAYMENT_ICONS[row.paymentType] ?? Wallet,
    amount: row.totalAmount,
    percent: paymentTotal > 0 ? (row.totalAmount / paymentTotal) * 100 : 0,
  }));

  return (
    <PosPageShell>
      <PageHeader
        title="Summary Report"
        description="Daily cash flow and payment breakdown."
      />

      <PosToolbar>
        <PosToolbarGroup>
          <div className="w-full min-w-[140px] sm:w-[180px]">
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Date
            </label>
            <PosDatePicker value={date} onChange={setDate} placeholder="Select date" />
          </div>
        </PosToolbarGroup>
      </PosToolbar>

      {isLoading ? (
        <LoadingState label="Loading summary report..." />
      ) : isError || !data ? (
        <ErrorState message="Unable to load summary report." />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard icon={ShoppingCart} label="Orders" value={data.orders} />
            <StatCard icon={Package} label="Sold Qty" value={data.soldQty} />
            <StatCard
              icon={Wallet}
              label="Cash in Hand"
              value={formatMoneyShort(data.cashInHand)}
              accent
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Sales Summary</h3>
              <dl>
                <SummaryRow
                  label="Gross Sales"
                  value={formatMoneyShort(sales?.grossSales ?? sales?.totalSales ?? 0)}
                  variant="strong"
                />
                <SummaryRow
                  label="Total Expenses"
                  value={formatMoneyShort(data.totalExpenses)}
                  variant="negative"
                />
                <SummaryRow
                  label="Net Sales"
                  value={formatMoneyShort(data.net)}
                  variant="strong"
                />
                <SummaryRow label="Orders" value={data.orders} />
                <SummaryRow label="Items Sold" value={data.soldQty} />
              </dl>
            </div>

            <div className="rounded-xl border border-border/70 bg-card p-5 shadow-card">
              <h3 className="mb-4 text-sm font-semibold text-foreground">Payment Breakdown</h3>
              {payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments for this date.</p>
              ) : (
                <div className="space-y-4">
                  {payments.map((payment) => (
                    <PaymentBar
                      key={payment.label}
                      icon={payment.icon}
                      label={payment.label}
                      amount={payment.amount}
                      percent={payment.percent}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/70 bg-card p-5 shadow-card">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Receipt className="size-4 text-muted-foreground" />
              Expense Breakdown
            </h3>
            {data.expensesByName.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses for this date.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.expensesByName.map((expense) => (
                  <div
                    key={expense.name}
                    className="rounded-lg border border-border/60 bg-muted/25 p-4"
                  >
                    <p className="text-xs font-medium text-muted-foreground">{expense.name}</p>
                    <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
                      {formatMoneyShort(expense.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </PosPageShell>
  );
}
