"use client";

import dynamic from "next/dynamic";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

const ManagerShell = dynamic(
  () => import("@/components/manager-shell").then((mod) => mod.ManagerShell),
  { ssr: false }
);
const StaffShell = dynamic(
  () => import("@/components/staff-shell").then((mod) => mod.StaffShell),
  { ssr: false }
);
const SupplierShell = dynamic(
  () => import("@/components/supplier-shell").then((mod) => mod.SupplierShell),
  { ssr: false }
);

type HomeShellUser = {
  role?: string | null;
  [key: string]: unknown;
};

export function HomeShell({
  user,
  dashboardData,
  managerData,
}: {
  user: HomeShellUser;
  dashboardData: GlobalDashboardData;
  managerData: ManagerPhaseData | null;
}) {
  if (user.role === "staff") {
    return <StaffShell user={user} dashboardData={dashboardData} />;
  }

  if (user.role === "admin" || user.role === "store") {
    return <SupplierShell user={user} dashboardData={dashboardData} managerData={managerData} />;
  }

  return <ManagerShell user={user} dashboardData={dashboardData} managerData={managerData} />;
}
