import { PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { ExchangesPanel } from "@/features/finance/ExchangesPanel";

export function ExchangeRecordsPage() {
  return (
    <PosPageShell>
      <PageHeader
        title="Exchange Records"
        description="Manage import, export, and other exchange transactions."
      />
      <ExchangesPanel />
    </PosPageShell>
  );
}
