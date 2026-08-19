import { FileDown, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { formatDate, formatMoneyShort } from "@/lib/format";
import { downloadThaiInvoicePdf } from "@/features/invoices/invoice.pdf";
import type { ThaiInvoice } from "@/features/thai/thai.types";

interface SaleSuccessScreenProps {
  invoice: ThaiInvoice;
  onNewSale: () => void;
}

export function SaleSuccessScreen({ invoice, onNewSale }: SaleSuccessScreenProps) {
  return (
    <PosPageShell>
      <div className="mx-auto max-w-2xl">
        <PageHeader
          title="Sale completed"
          description={`Invoice ${invoice.invoiceNo} created successfully.`}
        />
        <div className="rounded-xl border border-border/70 bg-card p-6 shadow-card">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice no.</span>
              <span className="font-medium">{invoice.invoiceNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Customer</span>
              <span className="font-medium">{invoice.customer?.name ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment</span>
              <span className="font-medium">{invoice.paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(invoice.date)}</span>
            </div>
            <div className="flex justify-between border-t border-border/60 pt-2">
              <span className="text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-primary">
                {formatMoneyShort(invoice.totalAmount)}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => void downloadThaiInvoicePdf(invoice)}
            >
              <FileDown className="size-4" />
              Download PDF
            </Button>
            <Button className="gap-2" onClick={onNewSale}>
              <Plus className="size-4" />
              New sale
            </Button>
          </div>
        </div>
      </div>
    </PosPageShell>
  );
}
