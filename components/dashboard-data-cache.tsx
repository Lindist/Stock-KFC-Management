"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { GlobalDashboardData } from "@/lib/types/dashboard";

type DashboardDataCacheContextValue = {
  dashboardData: GlobalDashboardData;
  setDashboardData: (next: GlobalDashboardData) => void;
  updateDashboardData: (updater: (current: GlobalDashboardData) => GlobalDashboardData) => void;
};

const DashboardDataCacheContext = createContext<DashboardDataCacheContextValue | null>(null);

export function DashboardDataCacheProvider({
  initialData,
  children,
}: {
  initialData: GlobalDashboardData;
  children: ReactNode;
}) {
  const [dashboardData, setDashboardData] = useState(initialData);

  const value = useMemo<DashboardDataCacheContextValue>(
    () => ({
      dashboardData,
      setDashboardData,
      updateDashboardData: (updater) => {
        setDashboardData((current) => updater(current));
      },
    }),
    [dashboardData]
  );

  return (
    <DashboardDataCacheContext.Provider value={value}>
      {children}
    </DashboardDataCacheContext.Provider>
  );
}

export function useDashboardDataCache() {
  const context = useContext(DashboardDataCacheContext);
  if (!context) {
    throw new Error("useDashboardDataCache must be used within DashboardDataCacheProvider");
  }

  return context;
}
