import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LoginPage } from "@/pages/LoginPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { SalesPage } from "@/pages/SalesPage";
import { InvoicesPage } from "@/pages/InvoicesPage";
import { InventoryPage } from "@/pages/InventoryPage";
import { VendorsPage } from "@/pages/VendorsPage";
import { ExpensesPage } from "@/pages/ExpensesPage";
import { ExchangeRecordsPage } from "@/pages/ExchangeRecordsPage";
import { CustomersPage } from "@/pages/CustomersPage";
import { PackageListPage } from "@/pages/PackageListPage";
import { PackageListsPage } from "@/pages/PackageListsPage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SaleReportPage } from "@/pages/SaleReportPage";
import { SummaryReportPage } from "@/pages/SummaryReportPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { HelpCenterPage } from "@/pages/HelpCenterPage";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ProtectedRoute, PublicOnlyRoute } from "@/routes/ProtectedRoute";

function PackageListsRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/package-list${search}`} replace />;
}

export default function App() {
  return (
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
          <Route path="/vendors" element={<VendorsPage />} />
          <Route path="/finance" element={<Navigate to="/expenses" replace />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/exchange-records" element={<ExchangeRecordsPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/reports/sale" element={<SaleReportPage />} />
          <Route path="/reports/summary" element={<SummaryReportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/help" element={<HelpCenterPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
