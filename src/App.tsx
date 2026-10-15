import { lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LoadingState } from "@/components/shared/PageStates";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute, PublicOnlyRoute, RoleRoute } from "@/routes/ProtectedRoute";

const LoginPage = lazy(() =>
  import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const SalesPage = lazy(() =>
  import("@/pages/SalesPage").then((m) => ({ default: m.SalesPage })),
);
const PackageListPage = lazy(() =>
  import("@/pages/PackageListPage").then((m) => ({ default: m.PackageListPage })),
);
const PackageListsPage = lazy(() =>
  import("@/pages/PackageListsPage").then((m) => ({ default: m.PackageListsPage })),
);
const InvoicesPage = lazy(() =>
  import("@/pages/InvoicesPage").then((m) => ({ default: m.InvoicesPage })),
);
const InventoryPage = lazy(() =>
  import("@/pages/InventoryPage").then((m) => ({ default: m.InventoryPage })),
);
const PurchasesPage = lazy(() =>
  import("@/pages/PurchasesPage").then((m) => ({ default: m.PurchasesPage })),
);
const VendorsPage = lazy(() =>
  import("@/pages/VendorsPage").then((m) => ({ default: m.VendorsPage })),
);
const ExpensesPage = lazy(() =>
  import("@/pages/ExpensesPage").then((m) => ({ default: m.ExpensesPage })),
);
const ExchangeRecordsPage = lazy(() =>
  import("@/pages/ExchangeRecordsPage").then((m) => ({ default: m.ExchangeRecordsPage })),
);
const CustomersPage = lazy(() =>
  import("@/pages/CustomersPage").then((m) => ({ default: m.CustomersPage })),
);
const OutstandingPage = lazy(() =>
  import("@/pages/OutstandingPage").then((m) => ({ default: m.OutstandingPage })),
);
const ReportsPage = lazy(() =>
  import("@/pages/ReportsPage").then((m) => ({ default: m.ReportsPage })),
);
const SaleReportPage = lazy(() =>
  import("@/pages/SaleReportPage").then((m) => ({ default: m.SaleReportPage })),
);
const SummaryReportPage = lazy(() =>
  import("@/pages/SummaryReportPage").then((m) => ({ default: m.SummaryReportPage })),
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const HelpCenterPage = lazy(() =>
  import("@/pages/HelpCenterPage").then((m) => ({ default: m.HelpCenterPage })),
);

function PackageListsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/package-list${search}`} replace />;
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <LoadingState label="Loading page..." />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/sales" element={<SalesPage />} />
            <Route path="/package-list/create" element={<PackageListPage />} />
            <Route path="/package-list" element={<PackageListsPage />} />
            <Route path="/package-lists/*" element={<PackageListsRedirect />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/purchases" element={<PurchasesPage />} />
            <Route path="/vendors" element={<VendorsPage />} />
            <Route path="/finance" element={<Navigate to="/expenses" replace />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/exchange-records" element={<ExchangeRecordsPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/outstanding" element={<OutstandingPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/reports/sale" element={<SaleReportPage />} />
            <Route path="/reports/summary" element={<SummaryReportPage />} />
            <Route path="/help" element={<HelpCenterPage />} />
            <Route element={<RoleRoute roles={["super_admin"]} />}>
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}
