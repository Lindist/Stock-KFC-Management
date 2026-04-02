import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { getGlobalDashboardData } from "@/lib/dashboard/get-global-dashboard-data";
import { getManagerPhaseData } from "@/lib/manager/get-manager-phase-data";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    const dashboardData = await getGlobalDashboardData();
    const managerData =
      role === "manager" || role === "admin"
        ? await getManagerPhaseData()
        : role === "store"
          ? await getManagerPhaseData({ purchaseOrderApproverId: session.user.id })
        : null;

    return NextResponse.json({
      dashboardData,
      managerData,
      refreshedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error refreshing cache snapshot:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
