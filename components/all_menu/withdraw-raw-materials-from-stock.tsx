"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, History, PackageMinus, Search, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IngredientStockStatus, StockDeductionStatus } from "@/lib/types/dashboard";
import type { ManagerIngredientRow, ManagerPhaseData, ManagerStockDeductionRow } from "@/lib/types/manager";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function badgeClass(status: StockDeductionStatus) {
  if (status === "approved") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "rejected") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusLabel(status: StockDeductionStatus) {
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ปฏิเสธ";
  return "รออนุมัติ";
}

function computeStockStatus(qty: number, maxQty: number): IngredientStockStatus {
  if (qty <= 0) return "out_of_stock";
  if (maxQty > 0 && qty / maxQty <= 0.2) return "low_stock";
  return "in_stock";
}

type GroupedRequest = {
  transactionId: string;
  requestedBy: string;
  deductTime: string;
  note: string;
  items: string[];
  totalQty: number;
};

export function WithdrawRawMaterialsFromStock({ data }: { data: ManagerPhaseData | null }) {
  const [ingredients, setIngredients] = useState<ManagerIngredientRow[]>(data?.ingredients ?? []);
  const [deductions, setDeductions] = useState<ManagerStockDeductionRow[]>(data?.stockDeductions ?? []);
  const [createQuery, setCreateQuery] = useState("");
  const [pendingQuery, setPendingQuery] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [quantityById, setQuantityById] = useState<Record<string, number>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});

  const filteredIngredients = useMemo(
    () =>
      ingredients.filter(
        (item) =>
          item.itemId.toLowerCase().includes(createQuery.toLowerCase()) ||
          item.itemName.toLowerCase().includes(createQuery.toLowerCase())
      ),
    [ingredients, createQuery]
  );

  const pendingGroups = useMemo(() => {
    const grouped = new Map<string, GroupedRequest>();

    deductions
      .filter((item) => item.status === "pending")
      .forEach((item) => {
        const current = grouped.get(item.transactionId);
        if (current) {
          current.items.push(`${item.itemName} x ${item.deductQty}`);
          current.totalQty += item.deductQty;
          if (item.note) {
            current.note = current.note ? `${current.note}, ${item.note}` : item.note;
          }
          return;
        }

        grouped.set(item.transactionId, {
          transactionId: item.transactionId,
          requestedBy: item.requestedBy,
          deductTime: item.deductTime,
          note: item.note ?? "",
          items: [`${item.itemName} x ${item.deductQty}`],
          totalQty: item.deductQty,
        });
      });

    return Array.from(grouped.values()).filter(
      (item) =>
        item.transactionId.toLowerCase().includes(pendingQuery.toLowerCase()) ||
        item.requestedBy.toLowerCase().includes(pendingQuery.toLowerCase()) ||
        item.items.join(" ").toLowerCase().includes(pendingQuery.toLowerCase())
    );
  }, [deductions, pendingQuery]);

  const filteredHistory = useMemo(
    () =>
      deductions.filter(
        (item) =>
          item.transactionId.toLowerCase().includes(historyQuery.toLowerCase()) ||
          item.itemName.toLowerCase().includes(historyQuery.toLowerCase()) ||
          item.requestedBy.toLowerCase().includes(historyQuery.toLowerCase())
      ),
    [deductions, historyQuery]
  );

  const selectedItems = useMemo(
    () => ingredients.filter((item) => (quantityById[item.itemId] ?? 0) > 0),
    [ingredients, quantityById]
  );

  const submitRequest = (status: StockDeductionStatus) => {
    const batchItems = selectedItems;
    if (batchItems.length === 0) return;

    const transactionId = `REQ-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const nextRecords: ManagerStockDeductionRow[] = batchItems.map((item) => ({
      transactionId,
      itemId: item.itemId,
      itemName: item.itemName,
      userId: "USR-MANAGER",
      requestedBy: "ผู้จัดการ",
      deductQty: quantityById[item.itemId],
      deductTime: timestamp,
      status,
      note: noteById[item.itemId] || undefined,
    }));

    setDeductions((current) => [...nextRecords, ...current]);

    if (status === "approved") {
      setIngredients((current) =>
        current.map((item) => {
          const matched = nextRecords.find((record) => record.itemId === item.itemId);
          if (!matched) return item;
          const nextQty = Math.max(0, item.currentQty - matched.deductQty);
          return {
            ...item,
            currentQty: nextQty,
            stockStatus: computeStockStatus(nextQty, item.maxQty),
          };
        })
      );
    }

    setQuantityById({});
    setNoteById({});
  };

  const updatePendingStatus = (transactionId: string, status: Extract<StockDeductionStatus, "approved" | "rejected">) => {
    const targets = deductions.filter((item) => item.transactionId === transactionId);
    if (targets.length === 0) return;

    setDeductions((current) =>
      current.map((item) => (item.transactionId === transactionId ? { ...item, status } : item))
    );

    if (status === "approved") {
      setIngredients((current) =>
        current.map((item) => {
          const matched = targets.find((record) => record.itemId === item.itemId);
          if (!matched) return item;
          const nextQty = Math.max(0, item.currentQty - matched.deductQty);
          return {
            ...item,
            currentQty: nextQty,
            stockStatus: computeStockStatus(nextQty, item.maxQty),
          };
        })
      );
    }
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลการตัดสต็อก</section>;
  }

  return (
    <section className="space-y-6">
      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader>
          <CardTitle>ตัดสต็อกและอนุมัติคำขอเบิก</CardTitle>
          <CardDescription>ค้นหาวัตถุดิบ ระบุจำนวนในรูปแบบตาราง และค้นหารายการในแท็ปรออนุมัติหรือประวัติได้แยกกัน</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="gap-6">
            <TabsList className="grid w-full grid-cols-3 bg-red-50/70">
              <TabsTrigger value="create" className="gap-2">
                <PackageMinus className="h-4 w-4" />
                ฟอร์มขอเบิกวัตถุดิบ
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                รอการอนุมัติ
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                ประวัติ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={createQuery} onChange={(event) => setCreateQuery(event.target.value)} className="pl-9" placeholder="ค้นหาด้วยรหัสหรือชื่อวัตถุดิบ" />
              </div>
              <Card className="border-red-100 bg-white/90 shadow-sm">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader className="bg-red-50/70">
                      <TableRow>
                        <TableHead>รหัส</TableHead>
                        <TableHead>วัตถุดิบ</TableHead>
                        <TableHead>คงเหลือ</TableHead>
                        <TableHead>หน่วย</TableHead>
                        <TableHead>จำนวนที่ขอเบิก</TableHead>
                        <TableHead>หมายเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIngredients.map((item) => (
                        <TableRow key={item.itemId} className="transition-colors hover:bg-red-50/60">
                          <TableCell className="font-medium">{item.itemId}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.currentQty}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={0}
                              max={item.currentQty}
                              value={quantityById[item.itemId] ?? 0}
                              onChange={(event) =>
                                setQuantityById((current) => ({
                                  ...current,
                                  [item.itemId]: Number(event.target.value),
                                }))
                              }
                              className="w-28"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={noteById[item.itemId] ?? ""}
                              onChange={(event) =>
                                setNoteById((current) => ({
                                  ...current,
                                  [item.itemId]: event.target.value,
                                }))
                              }
                              placeholder="เช่น ใช้สำหรับโปรโมชัน"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button onClick={() => submitRequest("pending")} className="bg-indigo-700 text-white hover:bg-indigo-800">
                      ส่งรออนุมัติ
                    </Button>
                    <Button onClick={() => submitRequest("approved")} className="bg-emerald-700 text-white hover:bg-emerald-800">
                      อนุมัติและตัดสต็อกทันที
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={pendingQuery} onChange={(event) => setPendingQuery(event.target.value)} className="pl-9" placeholder="ค้นหาเลขที่คำขอ ผู้ขอเบิก หรือวัตถุดิบ" />
              </div>
              <Card className="border-amber-100 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">รายการที่รออนุมัติ</CardTitle>
                  <CardDescription>รวมรายการตามเลขที่คำขอ เพื่อให้อนุมัติหรือปฏิเสธได้ง่ายขึ้น</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-amber-50/70">
                      <TableRow>
                        <TableHead>เลขที่คำขอ</TableHead>
                        <TableHead>วัตถุดิบ</TableHead>
                        <TableHead>ผู้ขอเบิก</TableHead>
                        <TableHead>จำนวนรวม</TableHead>
                        <TableHead>หมายเหตุ</TableHead>
                        <TableHead>เวลา</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingGroups.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                            ไม่มีรายการรออนุมัติในขณะนี้
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingGroups.map((item, index) => (
                          <TableRow key={`${item.transactionId}-${index}`} className="transition-colors hover:bg-amber-50/60">
                            <TableCell className="font-medium">{item.transactionId}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.items.map((name) => (
                                  <p key={name} className="text-sm">{name}</p>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>{item.requestedBy}</TableCell>
                            <TableCell>{item.totalQty}</TableCell>
                            <TableCell>{item.note || "-"}</TableCell>
                            <TableCell>{formatDateTime(item.deductTime)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  className="bg-emerald-700 text-white hover:bg-emerald-800"
                                  onClick={() => updatePendingStatus(item.transactionId, "approved")}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  อนุมัติ
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-700 text-white hover:bg-red-800"
                                  onClick={() => updatePendingStatus(item.transactionId, "rejected")}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  ปฏิเสธ
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input value={historyQuery} onChange={(event) => setHistoryQuery(event.target.value)} className="pl-9" placeholder="ค้นหาเลขที่คำขอ ผู้ขอเบิก หรือวัตถุดิบ" />
              </div>
              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">ประวัติการตัดสต็อก</CardTitle>
                  <CardDescription>ติดตามทุกคำขอเบิกย้อนหลัง พร้อมสถานะการอนุมัติและหมายเหตุประกอบ</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-slate-50/90">
                      <TableRow>
                        <TableHead>เลขที่คำขอ</TableHead>
                        <TableHead>วัตถุดิบ</TableHead>
                        <TableHead>ผู้ขอเบิก</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>เวลา</TableHead>
                        <TableHead>หมายเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory.map((item, index) => (
                        <TableRow key={`${item.transactionId}-${item.itemId}-${item.deductTime}-${index}`} className="transition-colors hover:bg-red-50/60">
                          <TableCell className="font-medium">{item.transactionId}</TableCell>
                          <TableCell>{item.itemName}</TableCell>
                          <TableCell>{item.requestedBy}</TableCell>
                          <TableCell>{item.deductQty}</TableCell>
                          <TableCell>
                            <Badge className={badgeClass(item.status)}>{statusLabel(item.status)}</Badge>
                          </TableCell>
                          <TableCell>{formatDateTime(item.deductTime)}</TableCell>
                          <TableCell>{item.note || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </section>
  );
}
