"use client";

import { useState, type ReactNode } from "react";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { StoreDashboard } from "@/components/all_menu/store-dashboard";
import { DashboardDataCacheProvider } from "@/components/dashboard-data-cache";
import { ManagerDashboardSync } from "@/components/manager-dashboard-sync";
import { ManagerDataCacheProvider } from "@/components/manager-data-cache";
import { ManagerNotifications, NotificationsBanner } from "@/components/manager-notifications";
import { SidebarSupplier, type SupplierMenuItemId, supplierMenu } from "@/components/sidebar-supplier";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

type SupplierShellUser = {
  role?: string | null;
};

const supplierMeta = [...supplierMenu];

export function SupplierShell({
  user,
  dashboardData,
  managerData,
}: {
  user?: SupplierShellUser;
  dashboardData: GlobalDashboardData;
  managerData: ManagerPhaseData | null;
}) {
  const [activeItem, setActiveItem] = useState<SupplierMenuItemId>("dashboard");
  const [dashboardTab, setDashboardTab] = useState<string>("orders");
  const activeMenu = supplierMeta.find((item) => item.id === activeItem);

  const openStoreTarget = (tab: string, menuId?: string) => {
    if (menuId === "purchase-orders" || menuId === "store-dashboard") {
      setActiveItem("store-dashboard");
      setDashboardTab("orders");
      return;
    }

    setActiveItem("dashboard");
    setDashboardTab(tab);
  };

  const supplierComponents: Record<SupplierMenuItemId, ReactNode> = {
    dashboard: (
      <DashboardManager
        key={`store-dashboard-${dashboardTab}`}
        data={dashboardData}
        initialTab={dashboardTab}
        onTabChange={setDashboardTab}
      />
    ),
    "store-dashboard": <StoreDashboard data={managerData} />,
  };

  return (
    <SidebarProvider>
      <SidebarSupplier user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <DashboardDataCacheProvider initialData={dashboardData}>
        <ManagerDataCacheProvider initialData={managerData}>
          <ManagerDashboardSync />
          <SidebarInset className="dashboard-shell min-h-screen font-sans">
            <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 shadow-sm backdrop-blur">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
                <h1 className="text-sm font-medium text-slate-600">{activeMenu?.name}</h1>
              </div>

              <div className="flex items-center gap-4 rounded-full border bg-white/95 px-3 py-1.5 shadow-sm">
                <span className="text-sm font-medium text-slate-700">
                  {user?.role === "admin" ? "ผู้ดูแลระบบ" : "Store"}
                </span>
                <ManagerNotifications data={dashboardData} onOpenDashboardTab={openStoreTarget} />
              </div>
            </header>

            <main className="space-y-6 p-8">
              <NotificationsBanner data={dashboardData} onOpenDashboardTab={openStoreTarget} />
              {supplierComponents[activeItem]}
            </main>
          </SidebarInset>
        </ManagerDataCacheProvider>
      </DashboardDataCacheProvider>
    </SidebarProvider>
  );
}
