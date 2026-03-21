import { getSession } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { SidebarMenu } from "@/components/sidebarmenu";
import { SidebarRequest } from "@/components/sidebar-request";
import { CreateMaterialRequest } from "@/components/all_menu/create-a-material-requisition-request";
import { Bell } from "lucide-react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default async function Home() {
  const session = await getSession();
  
  if (!session) {
    redirect("/sign-in");
  }

  const user = session.user;
  const role = user.role; // "manager" | "store" | "staff"

  if (role === "staff") {
    // UI for Staff
    return (
      <SidebarProvider>
        <SidebarRequest user={user} />
        <SidebarInset className="bg-slate-50 min-h-screen font-sans">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 transition-all">
            <div className="flex items-center gap-4">
               <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
               <h1 className="text-sm font-medium text-slate-600">คำขอเบิก</h1>
            </div>
            
            <div className="flex items-center gap-4 border px-3 py-1.5 rounded-full shadow-sm">
                <span className="text-sm font-medium text-slate-700">พนักงาน</span>
                <div className="relative cursor-pointer">
                  <Bell className="w-5 h-5 text-slate-500" />
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

  // UI for Manager or Store
  return (
    <SidebarProvider>
      <SidebarMenu user={user} />
      <SidebarInset className="bg-[#f8f9fa] min-h-screen font-sans">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4">
             <SidebarTrigger className="-ml-2 text-slate-500 hover:text-slate-800" />
             <h1 className="text-sm font-medium text-slate-600">หน้าหลัก</h1>
          </div>
          
          <div className="flex items-center gap-4 border px-3 py-1.5 rounded-full shadow-sm bg-white">
              <span className="text-sm font-medium text-slate-700">
                {role === "manager" ? "ผู้จัดการ" : "Store"}
              </span>
              <div className="relative cursor-pointer">
                <Bell className="w-5 h-5 text-slate-500" />
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white">
                  3
                </span>
              </div>
          </div>
        </header>
        
        <main className="p-8">
           <h1 className="text-2xl font-bold mb-4 text-slate-800">แดชบอร์ด</h1>
           <p className="text-slate-500 mb-8">ภาพรวมระบบจัดการคลังวัตถุดิบ KFC</p>
           {/* Content for dashboard can be injected here */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                 <div className="p-3 bg-red-50 text-red-600 rounded-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                 </div>
                 <h3 className="text-sm text-slate-500 font-medium">วัตถุดิบทั้งหมด</h3>
                 <p className="text-2xl font-bold mt-1">48</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                 <div className="p-3 bg-rose-50 text-rose-600 rounded-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                 </div>
                 <h3 className="text-sm text-slate-500 font-medium">วัตถุดิบใกล้หมด</h3>
                 <p className="text-2xl font-bold mt-1">5</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
                 </div>
                 <h3 className="text-sm text-slate-500 font-medium">รอการอนุมัติเบิก</h3>
                 <p className="text-2xl font-bold mt-1">3</p>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                 </div>
                 <h3 className="text-sm text-slate-500 font-medium">ใบสั่งซื้อรอรับ</h3>
                 <p className="text-2xl font-bold mt-1">2</p>
              </div>
           </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
