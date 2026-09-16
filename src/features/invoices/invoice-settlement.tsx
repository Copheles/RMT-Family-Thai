import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PosModal } from "@/components/shared/pos/PosModal";
import type { ThaiInvoice, ThaiPaymentType } from "@/features/thai/thai.types";
import { formatDate, formatMoneyShort } from "@/lib/format";

const PAYMENT_OPTIONS: ThaiPaymentType[] = ["DEBIT", "CREDIT", "CHECK", "CASH", "ZELLE"];

export function getRefundableThaiItems(invoice: ThaiInvoice) {
  return invoice.items
    .map((item) => {
      const refundedQty =
        invoice.refunds?.reduce(
          (sum, refund) =>
            sum +
            (refund.items.find((entry) => entry.invoiceItemId === item.id)?.quantity ?? 0),
          0,
        ) ?? 0;
      return { item, refundableQty: item.quantity - refundedQty };
    })
    .filter((entry) => entry.refundableQty > 0);
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

export function ThaiInvoiceSettlementSummary({ invoice }: { invoice: ThaiInvoice }) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      <InfoTile label="Paid" value={formatMoneyShort(invoice.paidTotal ?? 0)} />
      <InfoTile label="Refunded" value={formatMoneyShort(invoice.refundedTotal ?? 0)} />
      <InfoTile label="Balance due" value={formatMoneyShort(invoice.balanceDue ?? 0)} />
    </div>
  );
}

export function ThaiInvoicePaymentHistory({ invoice }: { invoice: ThaiInvoice }) {
  if (!invoice.payments?.length) return null;
  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Payments
      </p>
      {invoice.payments.map((payment) => (
        <div key={payment.id} className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{payment.paymentType}</p>
            <p className="text-xs text-muted-foreground">{formatDate(payment.createdAt)}</p>
          </div>
          <span className="font-semibold tabular-nums">{formatMoneyShort(payment.paidAmount)}</span>
        </div>
      ))}
    </div>
  );
}

export function ThaiInvoiceRefundHistory({ invoice }: { invoice: ThaiInvoice }) {
  if (!invoice.refunds?.length) return null;
  return (
    <div className="space-y-2 rounded-xl border border-border/70 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Refunds
      </p>
      {invoice.refunds.map((refund) => (
        <div key={refund.id} className="flex items-center justify-between text-sm">
          <div>
            <p className="font-medium">{refund.paymentType}</p>
            <p className="text-xs text-muted-foreground">{formatDate(refund.createdAt)}</p>
          </div>
          <span className="font-semibold tabular-nums text-destructive">
            -{formatMoneyShort(refund.amount)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ThaiAddPaymentModal({
  invoice,
  customerName,
  saving,
  onClose,
  onSubmit,
}: {
  invoice: Pick<ThaiInvoice, "invoiceNo" | "totalAmount" | "balanceDue">;
  customerName: string;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: { paymentType: ThaiPaymentType; paidAmount: number; note?: string }) => void;
}) {
  const balanceDue = invoice.balanceDue ?? 0;
  const [paymentType, setPaymentType] = useState<ThaiPaymentType>("CASH");
  const [paidAmount, setPaidAmount] = useState(String(balanceDue));
  const [note, setNote] = useState("");
  const amount = Number(paidAmount);
  const amountError =
    !Number.isFinite(amount) || amount <= 0
      ? "Amount must be greater than zero."
      : amount > balanceDue
        ? "Amount must not exceed balance due."
        : null;

  return (
    <PosModal
      title="Add payment"
      description={`${customerName} · ${invoice.invoiceNo}`}
      onClose={onClose}
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <InfoTile label="Total" value={formatMoneyShort(invoice.totalAmount)} />
          <InfoTile label="Balance due" value={formatMoneyShort(balanceDue)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Payment type</label>
          <Select
            value={paymentType}
            onChange={(event) => setPaymentType(event.target.value as ThaiPaymentType)}
          >
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Amount</label>
          <Input
            type="number"
            min={0}
            max={balanceDue}
            value={paidAmount}
            onChange={(event) => setPaidAmount(event.target.value)}
          />
          {amountError && <p className="text-xs font-medium text-destructive">{amountError}</p>}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Note</label>
          <Input value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={Boolean(amountError) || saving}
            onClick={() =>
              onSubmit({
                paymentType,
                paidAmount: amount,
                note: note.trim() || undefined,
              })
            }
          >
            {saving ? "Saving..." : "Save payment"}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}

export function ThaiRefundModal({
  invoice,
  saving,
  onClose,
  onSubmit,
}: {
  invoice: ThaiInvoice;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    paymentType: ThaiPaymentType;
    note?: string;
    items: Array<{ invoiceItemId: string; quantity: number; restock: boolean }>;
  }) => void;
}) {
  const refundableItems = useMemo(() => getRefundableThaiItems(invoice), [invoice]);
  const [paymentType, setPaymentType] = useState<ThaiPaymentType>("CASH");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState<Record<string, { quantity: string; restock: boolean }>>(() =>
    Object.fromEntries(
      refundableItems.map(({ item }) => [item.id, { quantity: "0", restock: true }]),
    ),
  );

  const selectedItems = refundableItems
    .map(({ item, refundableQty }) => {
      const line = lines[item.id];
      const quantity = Number(line?.quantity ?? 0);
      if (!Number.isFinite(quantity) || quantity <= 0 || quantity > refundableQty) return null;
      return { item, quantity, restock: line?.restock ?? true };
    })
    .filter(Boolean) as Array<{
    item: ThaiInvoice["items"][number];
    quantity: number;
    restock: boolean;
  }>;

  const totalRefund = selectedItems.reduce((sum, entry) => {
    const unitRefund = entry.item.total / entry.item.quantity;
    return sum + unitRefund * entry.quantity;
  }, 0);

  return (
    <PosModal title="Return / Refund" description={invoice.invoiceNo} onClose={onClose} wide>
      <div className="mt-4 space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Refund type</label>
            <Select
              value={paymentType}
              onChange={(event) => setPaymentType(event.target.value as ThaiPaymentType)}
            >
              {PAYMENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </div>
          <InfoTile label="Refund total" value={formatMoneyShort(totalRefund)} />
        </div>
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="grid grid-cols-[1fr_6rem_5rem] gap-2 bg-muted/50 px-3 py-2 text-xs font-semibold text-muted-foreground">
            <span>Product</span>
            <span>Qty</span>
            <span>Restock</span>
          </div>
          {refundableItems.map(({ item, refundableQty }) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_6rem_5rem] items-center gap-2 border-t border-border/60 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{item.product.name}</p>
                <p className="text-xs text-muted-foreground">Refundable: {refundableQty}</p>
              </div>
              <Input
                type="number"
                min={0}
                max={refundableQty}
                value={lines[item.id]?.quantity ?? "0"}
                onChange={(event) =>
                  setLines((prev) => ({
                    ...prev,
                    [item.id]: {
                      quantity: event.target.value,
                      restock: prev[item.id]?.restock ?? true,
                    },
                  }))
                }
              />
              <input
                type="checkbox"
                className="size-4 justify-self-center"
                checked={lines[item.id]?.restock ?? true}
                onChange={(event) =>
                  setLines((prev) => ({
                    ...prev,
                    [item.id]: {
                      quantity: prev[item.id]?.quantity ?? "0",
                      restock: event.target.checked,
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Note</label>
          <Input value={note} onChange={(event) => setNote(event.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedItems.length === 0 || saving}
            onClick={() =>
              onSubmit({
                paymentType,
                note: note.trim() || undefined,
                items: selectedItems.map((entry) => ({
                  invoiceItemId: entry.item.id,
                  quantity: entry.quantity,
                  restock: entry.restock,
                })),
              })
            }
          >
            {saving ? "Saving..." : "Record refund"}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}

export function ViewThaiCustomerOrdersLink({ customerId }: { customerId: string }) {
  return (
    <Link
      className="inline-flex h-8 items-center text-sm font-medium text-primary hover:underline"
      to={`/invoices?customerId=${customerId}`}
    >
      View orders
    </Link>
  );
}
