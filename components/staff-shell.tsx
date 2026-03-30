"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { CreateMaterialRequest } from "@/components/all_menu/create-a-material-requisition-request";
import { DashboardCacheAutoRefresh } from "@/components/cache-auto-refresh";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { DashboardDataCacheProvider } from "@/components/dashboard-data-cache";
import { ManagerNotifications, NotificationsBanner } from "@/components/manager-notifications";
import { SidebarRequest, type RequestMenuItemId, requestMenu } from "@/components/sidebar-request";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { GlobalDashboardData } from "@/lib/types/dashboard";

type StaffShellUser = {
  role?: string | null;
};

const requestMeta = [...requestMenu];

export function StaffShell({
  user,
  dashboardData,
}: {
  user?: StaffShellUser;
  dashboardData: GlobalDashboardData;
}) {
  const [activeItem, setActiveItem] = useState<RequestMenuItemId>("dashboard");
  const [dashboardTab, setDashboardTab] = useState<string>("ingredients");
  const activeMenu = requestMeta.find((item) => item.id === activeItem);

  const requestComponents: Record<RequestMenuItemId, ReactNode> = {
    dashboard: (
      <DashboardManager
        key={`staff-dashboard-${dashboardTab}`}
        data={dashboardData}
        initialTab={dashboardTab}
        onTabChange={setDashboardTab}
      />
    ),
    "create-request": <CreateMaterialRequest user={user} />,
  };

  return (
    <SidebarProvider>
      <SidebarRequest user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <DashboardDataCacheProvider initialData={dashboardData}>
        <DashboardCacheAutoRefresh />
        <SidebarInset className="dashboard-shell min-h-screen font-sans">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 shadow-sm backdrop-blur">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
              <h1 className="text-sm font-medium text-slate-600">{activeMenu?.name}</h1>
            </div>

            <div className="flex items-center gap-4 rounded-full border bg-white/95 px-3 py-1.5 shadow-sm">
              <span className="text-sm font-medium text-slate-700">เธเธเธฑเธเธเธฒเธ</span>
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
            {requestComponents[activeItem]}
          </main>
        </SidebarInset>
      </DashboardDataCacheProvider>
    </SidebarProvider>
  );
}
