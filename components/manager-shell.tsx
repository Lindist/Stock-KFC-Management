"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Bell } from "lucide-react";
import { SidebarMenu, type ManagerMenuItemId, managerMainMenu, managerOrderMenu } from "@/components/sidebarmenu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { RawMaterialWarehouse } from "@/components/all_menu/raw-material-warehouse";
import { WithdrawRawMaterialsFromStock } from "@/components/all_menu/withdraw-raw-materials-from-stock";
import { SetUpNotifications } from "@/components/all_menu/set-up-notifications";
import { PurchaseOrders } from "@/components/all_menu/po";
import { ImportRawMaterials } from "@/components/all_menu/import-raw-materials";
import { StockReport } from "@/components/all_menu/stock-report";

const menuMeta = [...managerMainMenu, ...managerOrderMenu];

const menuComponents: Record<ManagerMenuItemId, ReactNode> = {
  dashboard: <DashboardManager />,
  warehouse: <RawMaterialWarehouse />,
  withdraw: <WithdrawRawMaterialsFromStock />,
  notifications: <SetUpNotifications />,
  "purchase-orders": <PurchaseOrders />,
  "import-materials": <ImportRawMaterials />,
  "stock-report": <StockReport />,
};

type ManagerShellUser = {
  role?: string | null;
};

export function ManagerShell({ user }: { user?: ManagerShellUser }) {
  const [activeItem, setActiveItem] = useState<ManagerMenuItemId>("dashboard");
  const activeMenu = menuMeta.find((item) => item.id === activeItem);

  return (
    <SidebarProvider>
      <SidebarMenu user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <SidebarInset className="min-h-screen bg-[#f8f9fa] font-sans">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
            <h1 className="text-sm font-medium text-slate-600">{activeMenu?.name}</h1>
          </div>

          <div className="flex items-center gap-4 rounded-full border bg-white px-3 py-1.5 shadow-sm">
            <span className="text-sm font-medium text-slate-700">
              {user?.role === "manager" ? "ผู้จัดการ" : "Store"}
            </span>
            <div className="relative cursor-pointer">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                3
              </span>
            </div>
          </div>
        </header>

        <main className="p-8">{menuComponents[activeItem]}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
