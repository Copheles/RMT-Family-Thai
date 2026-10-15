import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { WelcomeBanner } from "@/components/dashboard/WelcomeBanner";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { posModules } from "@/constants/posModules";

export function DashboardPage() {
  return (
    <PosPageShell>
      <WelcomeBanner description="Thai branch workspace — sales, inventory, vendors, finance, customers, and reports." />

      <section className="mb-8">
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Modules
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {posModules.map((module) => (
            <ModuleTile key={module.id} module={module} />
          ))}
        </div>
      </section>
    </PosPageShell>
  );
}
