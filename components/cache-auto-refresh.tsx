"use client";

import { useCallback, useEffect } from "react";
import { useDashboardDataCache } from "@/components/dashboard-data-cache";
import { useManagerDataCache } from "@/components/manager-data-cache";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

const AUTO_REFRESH_INTERVAL_MS = 30 * 60 * 1000;

type SnapshotResponse = {
  dashboardData?: GlobalDashboardData;
  managerData?: ManagerPhaseData | null;
};

function useSnapshotInterval(
  onSnapshot: (payload: SnapshotResponse) => void
) {
  useEffect(() => {
    let isCancelled = false;

    const refreshSnapshot = async () => {
      try {
        const response = await fetch("/api/cache-snapshot", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as SnapshotResponse;
        if (!isCancelled) {
          onSnapshot(payload);
        }
      } catch {
        // Keep existing cached data when background refresh fails.
      }
    };

    const intervalId = window.setInterval(() => {
      void refreshSnapshot();
    }, AUTO_REFRESH_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [onSnapshot]);
}

export function DashboardCacheAutoRefresh() {
  const { setDashboardData } = useDashboardDataCache();

  const applySnapshot = useCallback(
    (payload: SnapshotResponse) => {
      if (payload.dashboardData) {
        setDashboardData(payload.dashboardData);
      }
    },
    [setDashboardData]
  );

  useSnapshotInterval(applySnapshot);

  return null;
}

export function DashboardAndManagerCacheAutoRefresh() {
  const { setDashboardData } = useDashboardDataCache();
  const { setManagerData } = useManagerDataCache();

  const applySnapshot = useCallback(
    (payload: SnapshotResponse) => {
      if (payload.dashboardData) {
        setDashboardData(payload.dashboardData);
      }

      if ("managerData" in payload) {
        setManagerData(payload.managerData ?? null);
      }
    },
    [setDashboardData, setManagerData]
  );

  useSnapshotInterval(applySnapshot);

  return null;
}
