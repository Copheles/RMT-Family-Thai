import { PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { PurchasesFlow } from "@/features/purchases/PurchasesFlow";

export function PurchasesPage() {
  return (
    <PosPageShell>
      <PageHeader
        title="Purchases"
        description="Stock-in history and purchase totals for the selected date range."
      />
      <PurchasesFlow />
    </PosPageShell>
  );
}
