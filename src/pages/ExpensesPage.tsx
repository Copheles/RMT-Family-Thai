import { PageHeader } from "@/components/shared/PageStates";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { ExpensesPanel } from "@/features/finance/ExpensesPanel";

export function ExpensesPage() {
  return (
    <PosPageShell>
      <PageHeader
        title="Expenses"
        description="Track daily expenses and review spending records."
      />
      <ExpensesPanel />
    </PosPageShell>
  );
}
