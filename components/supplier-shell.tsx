"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { DashboardDataCacheProvider } from "@/components/dashboard-data-cache";
import { ManagerNotifications, NotificationsBanner } from "@/components/manager-notifications";
import { SidebarSupplier, type SupplierMenuItemId, supplierMenu } from "@/components/sidebar-supplier";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { GlobalDashboardData } from "@/lib/types/dashboard";

type SupplierShellUser = {
  role?: string | null;
};

function SupplierPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="dashboard-panel rounded-2xl border p-6">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="mt-2 text-slate-500">{description}</p>
    </section>
  );
}

const supplierMeta = [...supplierMenu];

export function SupplierShell({
  user,
  dashboardData,
}: {
  user?: SupplierShellUser;
  dashboardData: GlobalDashboardData;
}) {
  const [activeItem, setActiveItem] = useState<SupplierMenuItemId>("dashboard");
  const [dashboardTab, setDashboardTab] = useState<string>("ingredients");
  const activeMenu = supplierMeta.find((item) => item.id === activeItem);

  const supplierComponents: Record<SupplierMenuItemId, ReactNode> = {
    dashboard: (
      <DashboardManager
        key={`supplier-dashboard-${dashboardTab}`}
        data={dashboardData}
        initialTab={dashboardTab}
        onTabChange={setDashboardTab}
      />
    ),
    "supplier-list": (
      <SupplierPlaceholder
        title="เธฃเธฒเธขเธเธทเนเธญเธเธฑเธเธเธฅเธฒเธขเน€เธญเธญเธฃเน"
        description="Phase 1 เน€เธเธทเนเธญเธก Global Dashboard เธฃเนเธงเธกเนเธฅเนเธง เนเธฅเธฐเธเธทเนเธเธ—เธตเนเธเธตเนเธเธฃเนเธญเธกเธ•เนเธญเธขเธญเธ”เธซเธเนเธฒเธเธฑเธ”เธเธฒเธฃเธฃเธฒเธขเธเธทเนเธญเธเธฑเธเธเธฅเธฒเธขเน€เธญเธญเธฃเนเนเธ Phase เธ–เธฑเธ”เนเธ"
      />
    ),
    "supplier-add": (
      <SupplierPlaceholder
        title="เน€เธเธดเนเธกเธเธฑเธเธเธฅเธฒเธขเน€เธญเธญเธฃเน"
        description="เธเธทเนเธเธ—เธตเนเธเธตเนเน€เธ•เธฃเธตเธขเธกเนเธงเนเธชเธณเธซเธฃเธฑเธเธเธญเธฃเนเธกเน€เธเธดเนเธกเธเธฑเธเธเธฅเธฒเธขเน€เธญเธญเธฃเน เนเธ”เธขเธขเธฑเธเนเธเน shell เนเธฅเธฐ dashboard เธเธฅเธฒเธเธเธธเธ”เน€เธ”เธตเธขเธงเธเธฑเธ"
      />
    ),
    "supplier-categories": (
      <SupplierPlaceholder
        title="เธซเธกเธงเธ”เธซเธกเธนเนเธงเธฑเธ•เธ–เธธเธ”เธดเธ"
        description="เธเธทเนเธเธ—เธตเนเธเธตเนเน€เธ•เธฃเธตเธขเธกเนเธงเนเธชเธณเธซเธฃเธฑเธเธซเธกเธงเธ”เธซเธกเธนเนเนเธฅเธฐเธเธฒเธฃเธเธฑเธ”เธเธฅเธธเนเธกเธงเธฑเธ•เธ–เธธเธ”เธดเธเนเธเธเธฑเนเธเธเธฑเธเธเธฅเธฒเธขเน€เธญเธญเธฃเน"
      />
    ),
  };

  return (
    <SidebarProvider>
      <SidebarSupplier user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <DashboardDataCacheProvider initialData={dashboardData}>
        <SidebarInset className="dashboard-shell min-h-screen font-sans">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
              <h1 className="text-sm font-medium text-slate-600">{activeMenu?.name}</h1>
            </div>

            <div className="flex items-center gap-4 rounded-full border bg-white/95 px-3 py-1.5 shadow-sm">
              <span className="text-sm font-medium text-slate-700">เธเธนเนเธ”เธนเนเธฅเธฃเธฐเธเธ</span>
              <ManagerNotifications
                data={dashboardData}
                onOpenDashboardTab={(tab) => {
                  setActiveItem("dashboard");
                  setDashboardTab(tab);
                }}
              />
            </div>
          </header>

          <main className="space-y-6 p-8">
            <NotificationsBanner
              data={dashboardData}
              onOpenDashboardTab={(tab) => {
                setActiveItem("dashboard");
                setDashboardTab(tab);
              }}
            />
            {supplierComponents[activeItem]}
          </main>
        </SidebarInset>
      </DashboardDataCacheProvider>
    </SidebarProvider>
  );
}
