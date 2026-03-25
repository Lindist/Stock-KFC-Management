import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getGlobalDashboardData } from "@/lib/dashboard/get-global-dashboard-data";
import { HomeShell } from "@/components/home-shell";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user;
  const dashboardData = await getGlobalDashboardData();
  return <HomeShell user={user} dashboardData={dashboardData} />;
}
