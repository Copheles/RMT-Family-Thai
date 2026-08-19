import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  History,
  Package,
  PieChart,
  Receipt,
  Repeat2,
  Settings,
  ShoppingCart,
  Truck,
  Users,
} from "lucide-react";

export interface PosModule {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  bubbleColor: string;
  badge?: number;
}

export const posModules: PosModule[] = [
  {
    id: "sales",
    label: "Sales",
    path: "/sales",
    icon: ShoppingCart,
    iconBg: "bg-teal-50 dark:bg-teal-950/30",
    iconColor: "text-teal-600 dark:text-teal-400",
    bubbleColor: "bg-teal-400/10 dark:bg-teal-400/15",
  },
  {
    id: "packageList",
    label: "Package List",
    path: "/package-list",
    icon: Package,
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    bubbleColor: "bg-blue-400/10 dark:bg-blue-400/15",
  },
  {
    id: "invoices",
    label: "Invoices",
    path: "/invoices",
    icon: History,
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    bubbleColor: "bg-violet-400/10 dark:bg-violet-400/15",
  },
  {
    id: "inventory",
    label: "Inventory",
    path: "/inventory",
    icon: Package,
    iconBg: "bg-orange-50 dark:bg-orange-950/30",
    iconColor: "text-orange-600 dark:text-orange-400",
    bubbleColor: "bg-orange-400/10 dark:bg-orange-400/15",
  },
  {
    id: "vendors",
    label: "Vendors",
    path: "/vendors",
    icon: Truck,
    iconBg: "bg-sky-50 dark:bg-sky-950/30",
    iconColor: "text-sky-600 dark:text-sky-400",
    bubbleColor: "bg-sky-400/10 dark:bg-sky-400/15",
  },
  {
    id: "customers",
    label: "Customers",
    path: "/customers",
    icon: Users,
    iconBg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    bubbleColor: "bg-cyan-400/10 dark:bg-cyan-400/15",
  },
  {
    id: "expenses",
    label: "Expenses",
    path: "/expenses",
    icon: Receipt,
    iconBg: "bg-rose-50 dark:bg-rose-950/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    bubbleColor: "bg-rose-400/10 dark:bg-rose-400/15",
  },
  {
    id: "exchangeRecords",
    label: "Exchange Records",
    path: "/exchange-records",
    icon: Repeat2,
    iconBg: "bg-indigo-50 dark:bg-indigo-950/30",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    bubbleColor: "bg-indigo-400/10 dark:bg-indigo-400/15",
  },
  {
    id: "saleReport",
    label: "Sale Report",
    path: "/reports/sale",
    icon: BarChart3,
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bubbleColor: "bg-emerald-400/10 dark:bg-emerald-400/15",
  },
  {
    id: "summaryReport",
    label: "Summary Report",
    path: "/reports/summary",
    icon: PieChart,
    iconBg: "bg-slate-100 dark:bg-slate-800/40",
    iconColor: "text-slate-600 dark:text-slate-400",
    bubbleColor: "bg-slate-400/10 dark:bg-slate-400/15",
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: Settings,
    iconBg: "bg-amber-50 dark:bg-amber-950/30",
    iconColor: "text-amber-600 dark:text-amber-400",
    bubbleColor: "bg-amber-400/10 dark:bg-amber-400/15",
  },
];

export const reportModules: PosModule[] = posModules.filter((m) =>
  m.path.startsWith("/reports"),
);

export const businessModules: PosModule[] = posModules.filter(
  (m) => !m.path.startsWith("/reports") && m.id !== "settings",
);
