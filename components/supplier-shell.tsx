"use client";

import { useState, type ReactNode } from "react";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { DashboardAndManagerCacheAutoRefresh } from "@/components/cache-auto-refresh";
import { StoreDashboard } from "@/components/all_menu/store-dashboard";
import { DashboardDataCacheProvider } from "@/components/dashboard-data-cache";
import { ManagerDashboardSync } from "@/components/manager-dashboard-sync";
import { ManagerDataCacheProvider } from "@/components/manager-data-cache";
import { ManagerNotifications, NotificationsBanner } from "@/components/manager-notifications";
import { SidebarSupplier, type SupplierMenuItemId, supplierMenu } from "@/components/sidebar-supplier";
import { SidebarInset, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

type SupplierShellUser = {
  id?: string | null;
  role?: string | null;
};

const supplierMeta = [...supplierMenu];

function SupplierShellContent({
  user,
  dashboardData,
  activeMenuName,
  onOpenDashboardTab,
  children,
}: {
  user?: SupplierShellUser;
  dashboardData: GlobalDashboardData;
  activeMenuName?: string;
  onOpenDashboardTab: (tab: string, menuId?: string) => void;
  children: ReactNode;
}) {
  const { state } = useSidebar();
  const desktopLeft = state === "collapsed" ? "md:left-0" : "md:left-[var(--sidebar-width)]";

  return (
    <SidebarInset className="dashboard-shell min-h-screen font-sans">
      <header
        className={`fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 shadow-sm backdrop-blur transition-[left] duration-200 ease-linear ${desktopLeft}`}
      >
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
          <h1 className="text-sm font-medium text-slate-600">{activeMenuName}</h1>
        </div>

        <div className="flex items-center gap-4 rounded-full border bg-white/95 px-3 py-1.5 shadow-sm">
          <span className="text-sm font-medium text-slate-700">
            {user?.role === "admin" ? "ผู้ดูแลระบบ" : "Store"}
          </span>
          <ManagerNotifications data={dashboardData} onOpenDashboardTab={onOpenDashboardTab} />
        </div>
      </header>

      <main className="space-y-6 p-8 pt-24">
        <NotificationsBanner data={dashboardData} onOpenDashboardTab={onOpenDashboardTab} />
        {children}
      </main>
    </SidebarInset>
  );
}

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
    "store-dashboard": <StoreDashboard data={managerData} userId={user?.id ?? null} />,
  };

  return (
    <SidebarProvider>
      <SidebarSupplier user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <DashboardDataCacheProvider initialData={dashboardData}>
        <ManagerDataCacheProvider initialData={managerData}>
          <DashboardAndManagerCacheAutoRefresh />
          <ManagerDashboardSync />
          <SupplierShellContent
            user={user}
            dashboardData={dashboardData}
            activeMenuName={activeMenu?.name}
            onOpenDashboardTab={openStoreTarget}
          >
            {supplierComponents[activeItem]}
          </SupplierShellContent>
        </ManagerDataCacheProvider>
      </DashboardDataCacheProvider>
    </SidebarProvider>
  );
}
