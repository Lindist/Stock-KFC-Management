"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { SidebarMenu, type ManagerMenuItemId, managerMainMenu, managerOrderMenu } from "@/components/sidebarmenu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { RawMaterialWarehouse } from "@/components/all_menu/raw-material-warehouse";
import { WithdrawRawMaterialsFromStock } from "@/components/all_menu/withdraw-raw-materials-from-stock";
import { SetUpNotifications } from "@/components/all_menu/set-up-notifications";
import { PurchaseOrders } from "@/components/all_menu/po";
import { ImportRawMaterials } from "@/components/all_menu/import-raw-materials";
import { StockReport } from "@/components/all_menu/stock-report";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import { ManagerNotifications } from "@/components/manager-notifications";
import type { ManagerPhaseData } from "@/lib/types/manager";
import { ManagerDataCacheProvider } from "@/components/manager-data-cache";

const menuMeta = [...managerMainMenu, ...managerOrderMenu];

type ManagerShellUser = {
  role?: string | null;
};

export function ManagerShell({
  user,
  dashboardData,
  managerData,
}: {
  user?: ManagerShellUser;
  dashboardData: GlobalDashboardData;
  managerData: ManagerPhaseData | null;
}) {
  const [activeItem, setActiveItem] = useState<ManagerMenuItemId>("dashboard");
  const [dashboardTab, setDashboardTab] = useState<string>("ingredients");
  const activeMenu = menuMeta.find((item) => item.id === activeItem);
  const menuComponents: Record<ManagerMenuItemId, ReactNode> = {
    dashboard: (
      <DashboardManager
        key={`dashboard-${dashboardTab}`}
        data={dashboardData}
        initialTab={dashboardTab}
        onTabChange={setDashboardTab}
      />
    ),
    warehouse: <RawMaterialWarehouse data={managerData} />,
    withdraw: <WithdrawRawMaterialsFromStock data={managerData} />,
    notifications: <SetUpNotifications data={managerData} />,
    "purchase-orders": <PurchaseOrders data={managerData} />,
    "import-materials": <ImportRawMaterials data={managerData} />,
    "stock-report": <StockReport data={managerData} />,
  };

  return (
    <SidebarProvider>
      <SidebarMenu user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <SidebarInset className="dashboard-shell min-h-screen font-sans">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
            <h1 className="text-sm font-medium text-slate-600">{activeMenu?.name}</h1>
          </div>

          <div className="flex items-center gap-4 rounded-full border bg-white px-3 py-1.5 shadow-sm">
            <span className="text-sm font-medium text-slate-700">
              {user?.role === "manager" ? "ผู้จัดการ" : "Store"}
            </span>
            <ManagerNotifications
              data={dashboardData}
              onOpenDashboardTab={(tab) => {
                setActiveItem("dashboard");
                setDashboardTab(tab);
              }}
            />
          </div>
        </header>

        <main className="p-8">
          <ManagerDataCacheProvider initialData={managerData}>
            {menuComponents[activeItem]}
          </ManagerDataCacheProvider>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
