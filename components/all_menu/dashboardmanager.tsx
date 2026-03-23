"use client";

export function DashboardManager() {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold text-slate-800">แดชบอร์ด</h1>
      <p className="mb-8 text-slate-500">ภาพรวมระบบจัดการคลังวัตถุดิบ KFC</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
          </div>
          <h3 className="text-sm font-medium text-slate-500">วัตถุดิบทั้งหมด</h3>
          <p className="mt-1 text-2xl font-bold">48</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-rose-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h3 className="text-sm font-medium text-slate-500">วัตถุดิบใกล้หมด</h3>
          <p className="mt-1 text-2xl font-bold">5</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-4 rounded-lg bg-amber-50 p-3 text-amber-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
          </div>
          <h3 className="text-sm font-medium text-slate-500">รอการอนุมัติเบิก</h3>
          <p className="mt-1 text-2xl font-bold">3</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white p-6 text-center shadow-sm">
          <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-emerald-600">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          </div>
          <h3 className="text-sm font-medium text-slate-500">ใบสั่งซื้อรอรับ</h3>
          <p className="mt-1 text-2xl font-bold">2</p>
        </div>
      </div>
    </section>
  );
}
