import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/forms/NumberInput";
import { PosModal } from "@/components/shared/pos/PosModal";
import { PosDatePicker } from "@/components/shared/pos/PosDatePicker";
import { PosFilterTabs } from "@/components/shared/pos/PosFilterTabs";
import { VendorCombobox } from "@/components/shared/pos/VendorCombobox";
import type { PurchaseMode, StockInPayload } from "@/features/batches/batch.types";
import { useBatchMutations } from "@/features/batches/batch.hooks";
import { getApiErrorMessage } from "@/lib/http";
import { formatMoneyShort } from "@/lib/format";

const RESTOCK_PAYMENT_MODES = ["PAID", "CREDIT"] as const satisfies readonly PurchaseMode[];

function freshStockInForm(): StockInPayload {
  return {
    quantity: 1,
    unitCost: 0,
    purchaseMode: "PAID",
    receivedAt: new Date().toISOString().slice(0, 16),
    vendorId: "",
    note: "",
  };
}

export function ThaiRestockModal({
  productId,
  productName,
  onClose,
  onSuccess,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { stockInMutation } = useBatchMutations(productId);
  const [form, setForm] = useState<StockInPayload>(freshStockInForm);
  const [vendorLabel, setVendorLabel] = useState("");
  const [formError, setFormError] = useState("");

  const totalCost = form.quantity * form.unitCost;

  async function submit() {
    try {
      setFormError("");
      const vendorId =
        form.vendorId && String(form.vendorId).trim().length > 0
          ? String(form.vendorId).trim()
          : undefined;
      await stockInMutation.mutateAsync({
        ...form,
        vendorId: vendorId ?? null,
        receivedAt: form.receivedAt
          ? new Date(form.receivedAt).toISOString()
          : form.receivedAt,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setFormError(getApiErrorMessage(e));
    }
  }

  return (
    <PosModal title="Restock" onClose={onClose}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Adding stock for <span className="font-medium text-foreground">{productName}</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Quantity</label>
            <NumberInput
              min={1}
              value={form.quantity}
              onChange={(quantity) => setForm((prev) => ({ ...prev, quantity }))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">Unit cost</label>
            <NumberInput
              min={0}
              step="0.01"
              value={form.unitCost}
              onChange={(unitCost) => setForm((prev) => ({ ...prev, unitCost }))}
            />
          </div>
        </div>
        <p className="rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm">
          Total cost{" "}
          <span className="font-semibold tabular-nums">{formatMoneyShort(totalCost)}</span>
        </p>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Payment</label>
          <PosFilterTabs
            value={form.purchaseMode ?? "PAID"}
            options={RESTOCK_PAYMENT_MODES}
            onChange={(mode) => setForm((prev) => ({ ...prev, purchaseMode: mode }))}
            getLabel={(mode) => (mode === "PAID" ? "Paid now" : "On credit")}
          />
          {form.purchaseMode === "CREDIT" ? (
            <p className="text-xs text-muted-foreground">
              Stock is added now; funds are not used. Pay the vendor under Outstanding → To pay.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Received date</label>
          <PosDatePicker
            mode="datetime"
            value={form.receivedAt ?? ""}
            onChange={(next) => setForm((prev) => ({ ...prev, receivedAt: next }))}
            placeholder="Select received date"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Vendor</label>
          <VendorCombobox
            value={form.vendorId ?? ""}
            selectedLabel={vendorLabel || undefined}
            onChange={(vendorId, vendor) => {
              setForm((prev) => ({ ...prev, vendorId }));
              setVendorLabel(vendor?.name ?? "");
            }}
            placeholder="No vendor"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground">Note</label>
          <Input
            placeholder="Optional note"
            value={form.note ?? ""}
            onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
          />
        </div>
        {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={stockInMutation.isPending}>
            {stockInMutation.isPending ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </PosModal>
  );
}
