"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, History, PackageMinus, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

function computeStockStatus(qty: number): IngredientStockStatus {
  if (qty <= 0) return "out_of_stock";
  if (qty <= 20) return "low_stock";
  return "in_stock";
}

function itemBadgeClass(status: IngredientStockStatus) {
  if (status === "out_of_stock") return "border-red-200 bg-red-50 text-red-700";
  if (status === "low_stock") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function itemStatusLabel(status: IngredientStockStatus) {
  if (status === "out_of_stock") return "หมดสต็อก";
  if (status === "low_stock") return "ใกล้หมด";
  return "พร้อมใช้งาน";
}

export function WithdrawRawMaterialsFromStock({ data }: { data: ManagerPhaseData | null }) {
  const [ingredients, setIngredients] = useState<ManagerIngredientRow[]>(data?.ingredients ?? []);
  const [deductions, setDeductions] = useState<ManagerStockDeductionRow[]>(data?.stockDeductions ?? []);
  const [selectedItemId, setSelectedItemId] = useState<string>(data?.ingredients[0]?.itemId ?? "");
  const [requestQty, setRequestQty] = useState<number>(1);
  const [requestNote, setRequestNote] = useState("");

  const selectedIngredient = useMemo(
    () => ingredients.find((item) => item.itemId === selectedItemId) ?? null,
    [ingredients, selectedItemId]
  );

  const pendingRequests = useMemo(
    () => deductions.filter((item) => item.status === "pending"),
    [deductions]
  );

  const submitRequest = (status: StockDeductionStatus) => {
    if (!selectedIngredient || requestQty <= 0) return;

    const nextRecord: ManagerStockDeductionRow = {
      transactionId: `REQ-${Date.now()}`,
      itemId: selectedIngredient.itemId,
      itemName: selectedIngredient.itemName,
      userId: "USR-MANAGER",
      requestedBy: "ผู้จัดการ",
      deductQty: requestQty,
      deductTime: new Date().toISOString(),
      status,
      note: requestNote || undefined,
    };

    setDeductions((current) => [nextRecord, ...current]);

    if (status === "approved") {
      setIngredients((current) =>
        current.map((item) =>
          item.itemId === selectedIngredient.itemId
            ? {
                ...item,
                currentQty: Math.max(0, item.currentQty - requestQty),
                stockStatus: computeStockStatus(Math.max(0, item.currentQty - requestQty)),
              }
            : item
        )
      );
    }

    setRequestQty(1);
    setRequestNote("");
  };

  const updatePendingStatus = (transactionId: string, status: Extract<StockDeductionStatus, "approved" | "rejected">) => {
    const target = deductions.find((item) => item.transactionId === transactionId);
    if (!target) return;

    setDeductions((current) =>
      current.map((item) => (item.transactionId === transactionId ? { ...item, status } : item))
    );

    if (status === "approved") {
      setIngredients((current) =>
        current.map((item) =>
          item.itemId === target.itemId
            ? {
                ...item,
                currentQty: Math.max(0, item.currentQty - target.deductQty),
                stockStatus: computeStockStatus(Math.max(0, item.currentQty - target.deductQty)),
              }
            : item
        )
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
          <CardDescription>สร้างคำขอใหม่ ตรวจสอบรายการที่รออนุมัติ และดูประวัติย้อนหลังในหน้าเดียว</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create" className="gap-6">
            <TabsList className="grid w-full grid-cols-3 bg-red-50/70">
              <TabsTrigger value="create" className="gap-2">
                <PackageMinus className="h-4 w-4" />
                สร้างคำขอ
              </TabsTrigger>
              <TabsTrigger value="pending" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                รออนุมัติ
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <History className="h-4 w-4" />
                ประวัติ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                <Card className="border-red-100 bg-white/90 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">ฟอร์มขอเบิกวัตถุดิบ</CardTitle>
                    <CardDescription>เลือกวัตถุดิบ จำนวนที่ต้องการ และบันทึกหมายเหตุสำหรับการอนุมัติ</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm font-medium text-slate-700">วัตถุดิบ</p>
                      <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                        <SelectTrigger>
                          <SelectValue placeholder="เลือกวัตถุดิบ" />
                        </SelectTrigger>
                        <SelectContent>
                          {ingredients.map((item) => (
                            <SelectItem key={item.itemId} value={item.itemId}>
                              {item.itemName} ({item.currentQty} {item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">จำนวนที่ต้องการเบิก</p>
                      <Input
                        type="number"
                        min={1}
                        value={requestQty}
                        onChange={(event) => setRequestQty(Number(event.target.value))}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-slate-700">หมายเหตุ</p>
                      <Input value={requestNote} onChange={(event) => setRequestNote(event.target.value)} placeholder="เช่น ใช้สำหรับกะเช้า / งานโปรโมชัน" />
                    </div>
                    <div className="flex gap-3 md:col-span-2">
                      <Button onClick={() => submitRequest("pending")} className="flex-1">
                        ส่งรออนุมัติ
                      </Button>
                      <Button onClick={() => submitRequest("approved")} variant="outline" className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50">
                        อนุมัติและตัดสต็อกทันที
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 bg-slate-50/80 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">สรุปรายการที่เลือก</CardTitle>
                    <CardDescription>ตรวจสอบจำนวนคงเหลือและสถานะก่อนยืนยันการเบิก</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedIngredient ? (
                      <>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Item</p>
                          <p className="mt-1 text-lg font-semibold text-slate-900">{selectedIngredient.itemName}</p>
                          <p className="text-sm text-slate-500">{selectedIngredient.itemId}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                            <p className="text-sm text-emerald-700">คงเหลือปัจจุบัน</p>
                            <p className="mt-1 text-2xl font-bold text-emerald-900">
                              {selectedIngredient.currentQty} {selectedIngredient.unit}
                            </p>
                          </div>
                          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm text-amber-700">หลังตัดสต็อก</p>
                            <p className="mt-1 text-2xl font-bold text-amber-900">
                              {Math.max(0, selectedIngredient.currentQty - requestQty)} {selectedIngredient.unit}
                            </p>
                          </div>
                        </div>
                        <Badge className={itemBadgeClass(computeStockStatus(selectedIngredient.currentQty - requestQty))}>
                          {itemStatusLabel(computeStockStatus(selectedIngredient.currentQty - requestQty))}
                        </Badge>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">เลือกวัตถุดิบเพื่อดูรายละเอียด</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pending">
              <Card className="border-amber-100 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">รายการที่รออนุมัติ</CardTitle>
                  <CardDescription>คำขอจากหน้าคลังที่ยังต้องตรวจสอบก่อนตัดสต็อกจริง</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader className="bg-amber-50/70">
                      <TableRow>
                        <TableHead>เลขที่คำขอ</TableHead>
                        <TableHead>วัตถุดิบ</TableHead>
                        <TableHead>ผู้ขอเบิก</TableHead>
                        <TableHead>จำนวน</TableHead>
                        <TableHead>หมายเหตุ</TableHead>
                        <TableHead>เวลา</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingRequests.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                            ไม่มีรายการรออนุมัติในขณะนี้
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingRequests.map((item, index) => (
                          <TableRow key={`${item.transactionId}-${item.itemId}-${index}`} className="hover:bg-amber-50/40">
                            <TableCell className="font-medium">{item.transactionId}</TableCell>
                            <TableCell>{item.itemName}</TableCell>
                            <TableCell>{item.requestedBy}</TableCell>
                            <TableCell>{item.deductQty}</TableCell>
                            <TableCell>{item.note || "-"}</TableCell>
                            <TableCell>{formatDateTime(item.deductTime)}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => updatePendingStatus(item.transactionId, "approved")}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  อนุมัติ
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-red-200 text-red-700 hover:bg-red-50"
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

            <TabsContent value="history">
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
                      {deductions.map((item, index) => (
                        <TableRow key={`${item.transactionId}-${item.itemId}-${item.deductTime}-${index}`} className="hover:bg-red-50/30">
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
