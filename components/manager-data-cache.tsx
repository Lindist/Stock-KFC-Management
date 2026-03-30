"use client";

import { createContext, useCallback, useContext, useMemo, useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import type { ManagerPhaseData } from "@/lib/types/manager";

type ManagerDataCacheContextValue = {
  managerData: ManagerPhaseData | null;
  updateManagerData: (
    updater: (current: ManagerPhaseData | null) => ManagerPhaseData | null
  ) => void;
  setManagerData: Dispatch<SetStateAction<ManagerPhaseData | null>>;
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
  const updateManagerData = useCallback(
    (updater: (current: ManagerPhaseData | null) => ManagerPhaseData | null) => {
      setManagerData((current) => updater(current));
    },
    []
  );

  const value = useMemo<ManagerDataCacheContextValue>(
    () => ({
      managerData,
      setManagerData,
      updateManagerData,
    }),
    [managerData, updateManagerData]
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
