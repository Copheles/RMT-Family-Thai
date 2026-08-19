import type { IconSvgElement } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  Dollar01Icon,
  WarehouseIcon,
  Wallet01Icon,
  UserGroupIcon,
  BarChartIcon,
  Settings01Icon,
  CustomerSupportIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
} from "@hugeicons/core-free-icons";

export interface SidebarChildItem {
  label: string;
  path: string;
}

export interface SidebarMenuItem {
  label: string;
  path: string;
  icon: IconSvgElement;
  roles?: ("super_admin" | "ygn" | "thai")[];
  children?: SidebarChildItem[];
}

export interface SidebarSection {
  title: string;
  items: SidebarMenuItem[];
}

export const sidebarMenuSections: SidebarSection[] = [
  {
    title: "Main",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: DashboardSquare01Icon,
      },
      {
        label: "Sales",
        path: "/sales",
        icon: Dollar01Icon,
      },
      {
        label: "Package List",
        path: "/package-list",
        icon: WarehouseIcon,
      },
      {
        label: "Inventory",
        path: "/inventory",
        icon: WarehouseIcon,
      },
      {
        label: "Expenses",
        path: "/expenses",
        icon: Wallet01Icon,
      },
      {
        label: "Exchange Records",
        path: "/exchange-records",
        icon: BarChartIcon,
      },
      {
        label: "Customers",
        path: "/customers",
        icon: UserGroupIcon,
      },
      {
        label: "Reports",
        path: "/reports",
        icon: BarChartIcon,
      },
    ],
  },
  {
    title: "Settings",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: Settings01Icon,
        roles: ["super_admin"],
      },
      {
        label: "Help Center",
        path: "/help",
        icon: CustomerSupportIcon,
      },
    ],
  },
];

export { ArrowDown01Icon, ArrowUp01Icon };
