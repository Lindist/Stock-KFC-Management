"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { DashboardManager } from "@/components/all_menu/dashboardmanager";
import { ManagerNotifications } from "@/components/manager-notifications";
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
        title="รายชื่อซัพพลายเออร์"
        description="Phase 1 เชื่อม Global Dashboard ร่วมแล้ว และพื้นที่นี้พร้อมต่อยอดหน้าจัดการรายชื่อซัพพลายเออร์ใน Phase ถัดไป"
      />
    ),
    "supplier-add": (
      <SupplierPlaceholder
        title="เพิ่มซัพพลายเออร์"
        description="พื้นที่นี้เตรียมไว้สำหรับฟอร์มเพิ่มซัพพลายเออร์ โดยยังใช้ shell และ dashboard กลางชุดเดียวกัน"
      />
    ),
    "supplier-categories": (
      <SupplierPlaceholder
        title="หมวดหมู่วัตถุดิบ"
        description="พื้นที่นี้เตรียมไว้สำหรับหมวดหมู่และการจัดกลุ่มวัตถุดิบในฝั่งซัพพลายเออร์"
      />
    ),
  };

  return (
    <SidebarProvider>
      <SidebarSupplier user={user} activeItem={activeItem} onSelect={setActiveItem} />
      <SidebarInset className="dashboard-shell min-h-screen font-sans">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
            <h1 className="text-sm font-medium text-slate-600">{activeMenu?.name}</h1>
          </div>

          <div className="flex items-center gap-4 rounded-full border bg-white/95 px-3 py-1.5 shadow-sm">
            <span className="text-sm font-medium text-slate-700">ผู้ดูแลระบบ</span>
            <ManagerNotifications
              data={dashboardData}
              onOpenDashboardTab={(tab) => {
                setActiveItem("dashboard");
                setDashboardTab(tab);
              }}
            />
          </div>
        </header>

        <main className="p-8">{supplierComponents[activeItem]}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
