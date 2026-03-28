"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { ManagerPhaseData } from "@/lib/types/manager";

type ManagerDataCacheContextValue = {
  managerData: ManagerPhaseData | null;
  updateManagerData: (
    updater: (current: ManagerPhaseData | null) => ManagerPhaseData | null
  ) => void;
  setManagerData: (next: ManagerPhaseData | null) => void;
};

const ManagerDataCacheContext = createContext<ManagerDataCacheContextValue | null>(null);

export function ManagerDataCacheProvider({
  initialData,
  children,
}: {
  initialData: ManagerPhaseData | null;
  children: ReactNode;
}) {
  const [managerData, setManagerData] = useState<ManagerPhaseData | null>(initialData);

  const value = useMemo<ManagerDataCacheContextValue>(
    () => ({
      managerData,
      setManagerData,
      updateManagerData: (updater) => {
        setManagerData((current) => updater(current));
      },
    }),
    [managerData]
  );

  return (
    <ManagerDataCacheContext.Provider value={value}>
      {children}
    </ManagerDataCacheContext.Provider>
  );
}

export function useManagerDataCache() {
  const context = useContext(ManagerDataCacheContext);
  if (!context) {
    throw new Error("useManagerDataCache must be used within ManagerDataCacheProvider");
  }

  return context;
}
