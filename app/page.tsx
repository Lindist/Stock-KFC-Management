import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { SidebarRequest } from "@/components/sidebar-request";
import { CreateMaterialRequest } from "@/components/all_menu/create-a-material-requisition-request";
import { Bell } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { ManagerShell } from "@/components/manager-shell";
import { getGlobalDashboardData } from "@/lib/dashboard/get-global-dashboard-data";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user;
  const role = user.role;

  if (role === "staff") {
    return (
      <SidebarProvider>
        <SidebarRequest user={user} />
        <SidebarInset className="min-h-screen bg-slate-50 font-sans">
          <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 transition-all">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
              <h1 className="text-sm font-medium text-slate-600">คำขอเบิก</h1>
            </div>

            <div className="flex items-center gap-4 rounded-full border px-3 py-1.5 shadow-sm">
              <span className="text-sm font-medium text-slate-700">พนักงาน</span>
              <div className="relative cursor-pointer">
                <Bell className="h-5 w-5 text-slate-500" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                  2
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8">
            <CreateMaterialRequest user={user} />
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const dashboardData = await getGlobalDashboardData();

  return <ManagerShell user={user} dashboardData={dashboardData} />;
}
