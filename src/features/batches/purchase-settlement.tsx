import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PosModal } from "@/components/shared/pos/PosModal";
import { formatMoneyShort } from "@/lib/format";
import type { Batch } from "./batch.types";

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

export function PayVendorModal({
  batch,
  saving,
  onClose,
  onSubmit,
}: {
  batch: Pick<
    Batch,
    "id" | "quantity" | "unitCost" | "outstanding" | "vendorName" | "product"
  >;
  saving: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => void;
}) {
  const lineTotal = batch.quantity * batch.unitCost;
  const outstanding = batch.outstanding ?? lineTotal;
  const [amount, setAmount] = useState(String(outstanding));
  const parsed = Number(amount);
  const amountError =
    !Number.isFinite(parsed) || parsed <= 0
      ? "Amount must be greater than zero."
      : parsed > outstanding
        ? "Amount must not exceed outstanding balance."
        : null;

  const productLabel = batch.product?.name ?? "Product";
  const vendorLabel = batch.vendorName?.trim() || "—";

  return (
    <PosModal
      title="Pay vendor"
      description={`${productLabel} · ${vendorLabel}`}
      onClose={onClose}
    >
      <div className="mt-4 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <InfoTile label="Line total" value={formatMoneyShort(lineTotal)} />
          <InfoTile label="Outstanding" value={formatMoneyShort(outstanding)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Amount</label>
          <Input
            type="number"
            min={0}
            max={outstanding}
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          {amountError ? <p className="text-xs font-medium text-destructive">{amountError}</p> : null}
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={Boolean(amountError) || saving}
            onClick={() => onSubmit(parsed)}
          >
            {saving ? "Saving..." : "Record payment"}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}

export function purchaseStatusLabel(status: Batch["purchaseStatus"]): string {
  switch (status) {
    case "CREDIT":
      return "Credit";
    case "PARTIAL":
      return "Partial";
    case "PAID":
    default:
      return "Paid";
  }
}
