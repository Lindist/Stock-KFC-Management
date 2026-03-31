"use client";

import { useState, useEffect } from "react";
import { Search, Send, Bell, Package, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner"; // Assuming sonner is used for toast notifications
import { cn } from "@/lib/utils";

export function CreateMaterialRequest({ user }: { user?: any }) {
  const [activeTab, setActiveTab] = useState("create");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<any[]>([]);

  // Fetch ingredients from API
  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await fetch("/api/ingredients");
        if (res.ok) {
          const data = await res.json();
          // Map to local format for form
          setItems(data.map((ing: any) => ({
            id: ing._id,
            item_id: ing.item_id,
            name: ing.item_name,
            stock: ing.current_qty,
            unit: ing.unit,
            quantity: ""
          })));
        }
      } catch (e) {
        console.error("Failed to fetch ingredients", e);
      }
    };
    
    fetchIngredients();
  }, []);

  const handleQuantityChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: value } : item))
    );
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/requests");
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchHistory();
    }
  }, [activeTab]);

  const handleSubmit = async () => {
    const selectedItems = items.filter((item) => item.quantity && Number(item.quantity) > 0);
    if (selectedItems.length === 0) {
      toast.error("กรุณาระบุจำนวนสำหรับอย่างน้อย 1 รายการ");
      return;
    }

    setLoading(true);
    try {
      // Map for the backend schema which expects `item_id`
      const payloadItems = selectedItems.map(item => ({
        item_id: item.item_id,
        quantity: item.quantity
      }));

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (res.ok) {
        toast.success("ส่งคำขออนุมัติเบิกสำเร็จ");
        // Clear quantities
        setItems((prev) => prev.map((item) => ({ ...item, quantity: "" })));
        setActiveTab("history"); // Auto switch to history
      } else {
        toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error) {
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">สร้างคำขอเบิกวัตถุดิบ</h2>
        <p className="text-sm text-slate-500 mt-1">เลือกวัตถุดิบที่ต้องการเบิกและส่งคำขอให้ผู้จัดการอนุมัติ</p>
      </div>

      {/* Tabs */}
      <div className="flex w-full flex-wrap gap-2 rounded-lg bg-slate-100 p-1 shadow-sm sm:w-fit sm:flex-nowrap sm:items-center sm:space-x-2">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all sm:flex-none ${
            activeTab === "create" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          สร้างคำขอเบิก
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all sm:flex-none ${
            activeTab === "history" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ประวัติ
        </button>
      </div>

      {/* Tab Content: Create Request */}
      {activeTab === "create" && (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/50">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-slate-800">แบบฟอร์มขอเบิกวัตถุดิบ</h3>
            <p className="text-sm text-slate-500 mb-6">เลือกวัตถุดิบและระบุจำนวนที่ต้องการเบิก</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">ค้นหาและเลือกวัตถุดิบ</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    placeholder="พิมพ์ชื่อวัตถุดิบ เช่น ไก่สด, แป้งสาลี..." 
                    className="pl-9 bg-slate-50/50"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-slate-700">รายการที่เลือก</h4>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                    {items.length} รายการ
                  </span>
                </div>

                <div className="space-y-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>ไม่พบรายการวัตถุดิบ</p>
                  </div>
                ) : (
                  items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.item_id.toLowerCase().includes(searchQuery.toLowerCase())).map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">[{item.item_id}] คงเหลือ: {item.stock} {item.unit}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="number"
                          placeholder="จำนวน"
                          className="w-24 h-9 text-right"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                          min="0"
                        />
                        <span className="text-sm text-slate-600 w-8">{item.unit}</span>
                      </div>
                    </div>
                  ))
                )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading}
                  className="bg-[#c8102e] hover:bg-[#a00c25] text-white shadow-md gap-2 rounded-lg px-6"
                >
                  <Send className="w-4 h-4" />
                  ส่งคำขออนุมัติเบิก
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab Content: History */}
      {activeTab === "history" && (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="p-6 border-b border-slate-100">
               <h3 className="text-base font-semibold text-slate-800">ประวัติการเบิก</h3>
               <p className="text-sm text-slate-500">รายการเบิกวัตถุดิบที่ผ่านมา</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50/80 text-slate-600 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">รหัสคำขอ</th>
                    <th className="px-6 py-3">วัตถุดิบ</th>
                    <th className="px-6 py-3">จำนวน</th>
                    <th className="px-6 py-3">ผู้ขอเบิก</th>
                    <th className="px-6 py-3">วันที่</th>
                    <th className="px-6 py-3">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {requests.length > 0 ? (
                    requests.map((req, idx) => {
                      // Status color
                      const isApproved = req.status === "อนุมัติแล้ว";
                      const isRejected = req.status === "ปฏิเสธ";
                      
                      return (
                        <tr key={req._id || idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-700">{req.requestId || `REQ-${100+idx}`}</td>
                          <td className="px-6 py-4 text-slate-600">
                            {req.items?.length > 0 ? (
                              <div className="space-y-1">
                                {req.items.map((item: any, i: number) => (
                                  <div key={i}>{item.name}</div>
                                ))}
                              </div>
                            ) : "N/A"}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {req.items?.length > 0 ? (
                              <div className="space-y-1">
                                {req.items.map((item: any, i: number) => (
                                  <div key={i}>{item.quantity} {item.unit}</div>
                                ))}
                              </div>
                            ) : ""}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{req.userName}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 text-[11px] font-semibold rounded-md",
                              isApproved ? "bg-green-100 text-green-700" :
                              isRejected ? "bg-red-100 text-red-700" :
                              "bg-yellow-100 text-yellow-700" // e.g. รออนุมัติ
                            )}>
                              {req.status || "รออนุมัติ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        {loading ? "กำลังโหลดข้อมูล..." : 
                        <div className="text-center py-8 text-slate-500">
                          <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>ไม่มีประวัติการเบิก</p>
                        </div>}
                      </td>
                    </tr>
                  )}
                  {/* Mock history just in case DB is empty to match picture */}
                  {/* {requests.length === 0 && !loading && [
                    { id: "REQ-099", item: "ซอสพริก", qty: "10 ขวด", date: "2026-02-15", status: "อนุมัติแล้ว" },
                    { id: "REQ-098", item: "ไก่สด (ปีก)", qty: "15 กก.", date: "2026-02-14", status: "ปฏิเสธ" },
                  ].map(mock => (
                     <tr key={mock.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-medium text-slate-700">{mock.id}</td>
                        <td className="px-6 py-4 text-slate-600">{mock.item}</td>
                        <td className="px-6 py-4 text-slate-600">{mock.qty}</td>
                        <td className="px-6 py-4 text-slate-600">พนักงาน A</td>
                        <td className="px-6 py-4 text-slate-500">{mock.date}</td>
                        <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 text-[11px] font-semibold rounded-md",
                              mock.status === "อนุมัติแล้ว" ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60" : "bg-rose-50 text-rose-600 border border-rose-200/60"
                            )}>
                              {mock.status}
                            </span>
                          </td>
                     </tr>
                  ))} */}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
