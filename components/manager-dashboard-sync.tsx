"use client";

import { useEffect } from "react";
import { useDashboardDataCache } from "@/components/dashboard-data-cache";
import { useManagerDataCache } from "@/components/manager-data-cache";
import { reconcileDashboardCache } from "@/lib/dashboard/reconcile-dashboard-cache";

export function ManagerDashboardSync() {
  const { updateDashboardData } = useDashboardDataCache();
  const { managerData } = useManagerDataCache();

  useEffect(() => {
    if (!managerData) {
      return;
    }

    updateDashboardData((current) => reconcileDashboardCache(current, managerData));
  }, [managerData, updateDashboardData]);

  return null;
}
