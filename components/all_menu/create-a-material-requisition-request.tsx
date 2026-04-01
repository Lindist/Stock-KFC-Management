"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Package, Search, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type IngredientOption = {
  id: string;
  item_id: string;
  name: string;
  stock: number;
  unit: string;
  quantity: string;
};

type RequestHistoryItem = {
  _id?: string;
  requestId?: string;
  userName?: string;
  createdAt: string;
  status?: string;
  items?: Array<{
    name?: string;
    quantity?: number | string;
    unit?: string;
  }>;
};

export function CreateMaterialRequest({ user }: { user?: unknown }) {
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [requests, setRequests] = useState<RequestHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<IngredientOption[]>([]);

  useEffect(() => {
    const fetchIngredients = async () => {
      try {
        const res = await fetch("/api/ingredients");
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        setItems(
          data.map((ing: any) => ({
            id: ing._id,
            item_id: ing.item_id,
            name: ing.item_name,
            stock: ing.current_qty,
            unit: ing.unit,
            quantity: "",
          }))
        );
      } catch (error) {
        console.error("Failed to fetch ingredients", error);
      }
    };

    fetchIngredients();
  }, []);

  useEffect(() => {
    if (activeTab !== "history") {
      return;
    }

    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/requests");
        if (!res.ok) {
          return;
        }

        const data = await res.json();
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch history", error);
      }
    };

    fetchHistory();
  }, [activeTab]);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) || item.item_id.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  const handleQuantityChange = (id: string, value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: value } : item))
    );
  };

  const handleSubmit = async () => {
    const selectedItems = items.filter((item) => item.quantity && Number(item.quantity) > 0);

    if (selectedItems.length === 0) {
      toast.error("กรุณาระบุจำนวนสำหรับอย่างน้อย 1 รายการ");
      return;
    }

    setLoading(true);
    try {
      const payloadItems = selectedItems.map((item) => ({
        item_id: item.item_id,
        quantity: item.quantity,
      }));

      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payloadItems }),
      });

      if (!res.ok) {
        toast.error("เกิดข้อผิดพลาดในการส่งข้อมูล");
        return;
      }

      toast.success("ส่งคำขออนุมัติเบิกสำเร็จ");
      setItems((prev) => prev.map((item) => ({ ...item, quantity: "" })));
      setActiveTab("history");
    } catch (error) {
      console.error("Failed to submit request", error);
      toast.error("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">สร้างคำขอเบิกวัตถุดิบ</h2>
        <p className="mt-1 text-sm text-slate-500">
          เลือกวัตถุดิบที่ต้องการเบิกและส่งคำขอให้ผู้จัดการอนุมัติ
        </p>
      </div>

      <div className="flex w-full flex-wrap gap-2 rounded-lg bg-slate-100 p-1 shadow-sm sm:w-fit sm:flex-nowrap">
        <button
          onClick={() => setActiveTab("create")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all sm:flex-none ${
            activeTab === "create" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          สร้างคำขอเบิก
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all sm:flex-none ${
            activeTab === "history" ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          ประวัติ
        </button>
      </div>

      {activeTab === "create" ? (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200/50">
          <CardContent className="p-6">
            <h3 className="text-base font-semibold text-slate-800">แบบฟอร์มขอเบิกวัตถุดิบ</h3>
            <p className="mb-6 text-sm text-slate-500">เลือกวัตถุดิบและระบุจำนวนที่ต้องการเบิก</p>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  ค้นหาและเลือกวัตถุดิบ
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="พิมพ์ชื่อวัตถุดิบหรือรหัสวัตถุดิบ"
                    className="bg-slate-50/50 pl-9"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="pt-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium text-slate-700">รายการที่เลือก</h4>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    {filteredItems.length} รายการ
                  </span>
                </div>

                <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                  {filteredItems.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <Package className="mx-auto mb-2 h-12 w-12 opacity-50" />
                      <p>ไม่พบรายการวัตถุดิบ</p>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="break-words text-sm font-medium text-slate-800">{item.name}</div>
                          <div className="mt-0.5 break-words text-xs text-slate-500">
                            [{item.item_id}] คงเหลือ: {item.stock} {item.unit}
                          </div>
                        </div>

                        <div className="flex w-full items-center gap-2 sm:w-auto">
                          <Input
                            type="number"
                            placeholder="จำนวน"
                            className="h-9 w-full min-w-0 text-right sm:w-24"
                            value={item.quantity}
                            onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                            min="0"
                          />
                          <span className="shrink-0 text-sm text-slate-600">{item.unit}</span>
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
                  className="w-full gap-2 rounded-lg bg-[#c8102e] px-6 text-white shadow-md hover:bg-[#a00c25] sm:w-auto"
                >
                  <Send className="h-4 w-4" />
                  ส่งคำขออนุมัติเบิก
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-slate-200/50">
          <CardContent className="p-0">
            <div className="border-b border-slate-100 p-6">
              <h3 className="text-base font-semibold text-slate-800">ประวัติการเบิก</h3>
              <p className="text-sm text-slate-500">รายการเบิกวัตถุดิบที่ผ่านมา</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 font-medium text-slate-600">
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
                      const isApproved = req.status === "อนุมัติแล้ว";
                      const isRejected = req.status === "ปฏิเสธ";

                      return (
                        <tr key={req._id || idx} className="transition-colors hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-medium text-slate-700">
                            {req.requestId || `REQ-${100 + idx}`}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {req.items?.length ? (
                              <div className="space-y-1">
                                {req.items.map((item, index) => (
                                  <div key={index}>{item.name}</div>
                                ))}
                              </div>
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {req.items?.length ? (
                              <div className="space-y-1">
                                {req.items.map((item, index) => (
                                  <div key={index}>
                                    {item.quantity} {item.unit}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-slate-600">{req.userName}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(req.createdAt).toLocaleDateString("th-TH")}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={cn(
                                "rounded-md px-2.5 py-1 text-[11px] font-semibold",
                                isApproved
                                  ? "bg-green-100 text-green-700"
                                  : isRejected
                                    ? "bg-red-100 text-red-700"
                                    : "bg-yellow-100 text-yellow-700"
                              )}
                            >
                              {req.status || "รออนุมัติ"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        {loading ? (
                          "กำลังโหลดข้อมูล..."
                        ) : (
                          <div className="py-8 text-center text-slate-500">
                            <History className="mx-auto mb-2 h-12 w-12 opacity-50" />
                            <p>ไม่มีประวัติการเบิก</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
