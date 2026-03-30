import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getGlobalDashboardData } from "@/lib/dashboard/get-global-dashboard-data";
import { getManagerPhaseData } from "@/lib/manager/get-manager-phase-data";
import { HomeShell } from "@/components/home-shell";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user;
  const dashboardData = await getGlobalDashboardData();
  const managerData =
    user.role === "manager" || user.role === "store" || user.role === "admin"
      ? await getManagerPhaseData()
      : null;

  return <HomeShell user={user} dashboardData={dashboardData} managerData={managerData} />;
}
