import { PageHeader } from "@/components/shared/PageStates";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { reportModules } from "@/constants/posModules";

export function ReportsPage() {
  return (
    <PosPageShell>
      <PageHeader
        title="Reports"
        description="View analytics and generate business reports."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl">
        {reportModules.map((module) => (
          <ModuleTile key={module.id} module={module} />
        ))}
      </div>
    </PosPageShell>
  );
}
