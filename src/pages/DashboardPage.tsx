import { useAuth } from "@/hooks/useAuth";
import { ModuleTile } from "@/components/dashboard/ModuleTile";
import { PosPageShell } from "@/components/shared/pos/PosPageShell";
import { posModules } from "@/constants/posModules";

export function DashboardPage() {
  const { user } = useAuth();
  const greeting = getGreeting();

  return (
    <PosPageShell>
      <div
        className="mb-6 overflow-hidden rounded-2xl border border-border/60 p-5 shadow-card sm:p-6 lg:p-8"
        style={{ background: "var(--brand-hero-gradient)" }}
      >
        <p className="text-sm font-medium text-primary-foreground/80">
          {greeting}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-primary-foreground sm:text-3xl">
          Welcome back, {user?.username ?? "User"}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-primary-foreground/75">
          Thai branch workspace — sales, inventory, vendors, finance, customers, and reports.
        </p>
      </div>

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}
