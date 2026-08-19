import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path: string;
}

const ROUTE_LABELS: Record<string, { label: string; parent?: string }> = {
  "/dashboard": { label: "Dashboard" },
  "/sales": { label: "Sales", parent: "/dashboard" },
  "/package-list": { label: "Package List", parent: "/dashboard" },
  "/package-list/create": { label: "Create Package List", parent: "/package-list" },
  "/invoices": { label: "Invoices", parent: "/dashboard" },
  "/inventory": { label: "Inventory", parent: "/dashboard" },
  "/vendors": { label: "Vendors", parent: "/dashboard" },
  "/expenses": { label: "Expenses", parent: "/dashboard" },
  "/exchange-records": { label: "Exchange Records", parent: "/dashboard" },
  "/customers": { label: "Customers", parent: "/dashboard" },
  "/reports": { label: "Reports", parent: "/dashboard" },
  "/reports/sale": { label: "Sale Report", parent: "/reports" },
  "/reports/summary": { label: "Summary Report", parent: "/reports" },
  "/settings": { label: "Settings", parent: "/dashboard" },
  "/help": { label: "Help Center", parent: "/dashboard" },
};

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const current = ROUTE_LABELS[pathname];
  if (!current) return [{ label: "Dashboard", path: "/dashboard" }];

  const crumbs: BreadcrumbItem[] = [];
  if (current.parent) {
    crumbs.push({ label: "Dashboard", path: "/dashboard" });
    if (current.parent !== "/dashboard") {
      const parent = ROUTE_LABELS[current.parent];
      if (parent) crumbs.push({ label: parent.label, path: current.parent });
    }
  }
  crumbs.push({ label: current.label, path: pathname });
  return crumbs;
}

export function Breadcrumb({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const crumbs = buildBreadcrumbs(location.pathname);
  if (crumbs.length <= 1) return null;

  const current = crumbs[crumbs.length - 1];
  const parents = crumbs.slice(0, -1);

  return (
    <>
      <nav aria-label="Breadcrumb" className={cn("min-w-0 sm:hidden", className)}>
        <span className="block truncate text-sm font-semibold text-foreground">{current.label}</span>
      </nav>
      <nav aria-label="Breadcrumb" className={cn("hidden min-w-0 sm:flex sm:flex-1", className)}>
        <ol className="flex min-w-0 items-center gap-1 overflow-hidden">
          {parents.map((crumb) => (
            <li key={crumb.path} className="flex min-w-0 shrink items-center gap-1">
              <button
                type="button"
                onClick={() => navigate(crumb.path)}
                className="truncate rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {crumb.label}
              </button>
              <ChevronRight aria-hidden className="size-3 shrink-0 text-muted-foreground/40" />
            </li>
          ))}
          <li className="min-w-0 truncate">
            <span aria-current="page" className="block truncate text-sm font-semibold text-foreground">
              {current.label}
            </span>
          </li>
        </ol>
      </nav>
    </>
  );
}
