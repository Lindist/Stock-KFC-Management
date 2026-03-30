"use client";

import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { GlobalDashboardData } from "@/lib/types/dashboard";

type DashboardDataCacheContextValue = {
  dashboardData: GlobalDashboardData;
  setDashboardData: Dispatch<SetStateAction<GlobalDashboardData>>;
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
  const updateDashboardData = useCallback((updater: (current: GlobalDashboardData) => GlobalDashboardData) => {
    setDashboardData((current) => updater(current));
  }, []);

  const value = useMemo<DashboardDataCacheContextValue>(
    () => ({
      dashboardData,
      setDashboardData,
      updateDashboardData,
    }),
    [dashboardData, updateDashboardData]
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
