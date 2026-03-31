"use client";

import { useState, type ReactNode } from "react";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { DashboardAndManagerCacheAutoRefresh } from "@/components/cache-auto-refresh";
import { ImportRawMaterials } from "@/components/all_menu/import-raw-materials";
import { PurchaseOrders } from "@/components/all_menu/po";
import { RawMaterialWarehouse } from "@/components/all_menu/raw-material-warehouse";
import { SetUpNotifications } from "@/components/all_menu/set-up-notifications";
import { StockReport } from "@/components/all_menu/stock-report";
import { WithdrawRawMaterialsFromStock } from "@/components/all_menu/withdraw-raw-materials-from-stock";
import { DashboardDataCacheProvider } from "@/components/dashboard-data-cache";
import { ManagerDashboardSync } from "@/components/manager-dashboard-sync";
import { ManagerDataCacheProvider } from "@/components/manager-data-cache";
import { ManagerNotifications, NotificationsBanner } from "@/components/manager-notifications";
import {
  SidebarMenu,
  type ManagerMenuItemId,
  managerMainMenu,
  managerOrderMenu,
} from "@/components/sidebarmenu";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

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
  const openManagerTarget = (tab: string, menuId?: string) => {
    const targetMenu = menuMeta.find((item) => item.id === menuId)?.id;

    if (targetMenu) {
      setActiveItem(targetMenu);
      setDashboardTab(tab);
      return;
    }

    setActiveItem("dashboard");
    setDashboardTab(tab);
  };

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
      <DashboardDataCacheProvider initialData={dashboardData}>
        <ManagerDataCacheProvider initialData={managerData}>
          <DashboardAndManagerCacheAutoRefresh />
          <ManagerDashboardSync />
          <SidebarInset className="dashboard-shell min-h-screen font-sans">
            <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm md:left-[var(--sidebar-width)]">
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
                  onOpenDashboardTab={openManagerTarget}
                />
              </div>
            </header>

            <main className="space-y-6 p-8 pt-24">
              <NotificationsBanner
                data={dashboardData}
                onOpenDashboardTab={openManagerTarget}
              />
              {menuComponents[activeItem]}
            </main>
          </SidebarInset>
        </ManagerDataCacheProvider>
      </DashboardDataCacheProvider>
    </SidebarProvider>
  );
}
