"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, History, PackageMinus, Search, XCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useManagerDataCache } from "@/components/manager-data-cache";
import { deriveIngredientStockStatus } from "@/lib/inventory-utils";
import type { IngredientStockStatus, StockDeductionStatus } from "@/lib/types/dashboard";
import type { ManagerPhaseData, ManagerStockDeductionRow } from "@/lib/types/manager";

type GroupedRequest = {
  transactionId: string;
  requestedBy: string;
  deductTime: string;
  note: string;
  items: string[];
  totalQty: number;
  status: StockDeductionStatus;
};

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

function ingredientStatusLabel(status: IngredientStockStatus) {
  if (status === "low_stock") return "ใกล้หมด";
  if (status === "out_of_stock") return "หมดสต็อก";
  if (status === "expiring_soon") return "ใกล้หมดอายุ";
  if (status === "expired") return "หมดอายุ";
  return "ปกติ";
}

function ingredientStatusBadgeClass(status: IngredientStockStatus) {
  if (status === "low_stock") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "out_of_stock") return "border-red-200 bg-red-50 text-red-700";
  if (status === "expiring_soon") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "expired") return "border-violet-200 bg-violet-50 text-violet-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function WithdrawRawMaterialsFromStock({ data }: { data: ManagerPhaseData | null }) {
  const { managerData, updateManagerData } = useManagerDataCache();
  const [createQuery, setCreateQuery] = useState("");
  const [createStatusFilter, setCreateStatusFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock" | "expiring_soon" | "expired"
  >("all");
  const [pendingQuery, setPendingQuery] = useState("");
  const [pendingStatusFilter, setPendingStatusFilter] = useState<"all" | "pending">("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<"all" | StockDeductionStatus>("all");
  const [quantityById, setQuantityById] = useState<Record<string, number>>({});
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalWarning, setApprovalWarning] = useState<string | null>(null);

  const ingredients = managerData?.ingredients ?? data?.ingredients ?? [];
  const deductions = managerData?.stockDeductions ?? data?.stockDeductions ?? [];

  const filteredIngredients = useMemo(() => {
    const normalizedQuery = createQuery.trim().toLowerCase();

    return ingredients.filter((item) => {
      const itemStatus = deriveIngredientStockStatus(item.currentQty, item.maxQty, item.expiryDate);
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.itemId.toLowerCase().includes(normalizedQuery) ||
        item.itemName.toLowerCase().includes(normalizedQuery);
      const matchesStatus = createStatusFilter === "all" || itemStatus === createStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [createQuery, createStatusFilter, ingredients]);

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
          status: item.status,
        });
      });

    return Array.from(grouped.values()).filter((item) => {
      const normalizedQuery = pendingQuery.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.transactionId.toLowerCase().includes(normalizedQuery) ||
        item.requestedBy.toLowerCase().includes(normalizedQuery) ||
        item.items.join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus = pendingStatusFilter === "all" || item.status === pendingStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [deductions, pendingQuery, pendingStatusFilter]);

  const filteredHistory = useMemo(() => {
    const grouped = new Map<string, GroupedRequest>();

    deductions.forEach((item) => {
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
        status: item.status,
      });
    });

    return Array.from(grouped.values()).filter((item) => {
      const normalizedQuery = historyQuery.trim().toLowerCase();
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.transactionId.toLowerCase().includes(normalizedQuery) ||
        item.requestedBy.toLowerCase().includes(normalizedQuery) ||
        item.items.join(" ").toLowerCase().includes(normalizedQuery);
      const matchesStatus = historyStatusFilter === "all" || item.status === historyStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [deductions, historyQuery, historyStatusFilter]);

  const selectedItems = useMemo(
    () => ingredients.filter((item) => (quantityById[item.itemId] ?? 0) > 0),
    [ingredients, quantityById]
  );

  const submitRequest = async (status: StockDeductionStatus) => {
    setApprovalWarning(null);
    const items = selectedItems.map((item) => ({
      itemId: item.itemId,
      deductQty: quantityById[item.itemId],
      note: noteById[item.itemId] || "",
    }));

    if (items.length === 0) return;

    try {
      setIsSubmitting(true);
      const response = await fetch("/api/stock-deductions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, status }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 409 && payload?.insufficientItems) {
          const detail = payload.insufficientItems
            .map((item: { itemName: string; currentQty: number; requestedQty: number; reason: string }) =>
              item.reason === "out_of_stock"
                ? `${item.itemName} หมดสต็อก`
                : `${item.itemName} คงเหลือ ${item.currentQty} แต่ขอเบิก ${item.requestedQty}`
            )
            .join(", ");
          setApprovalWarning(`ไม่สามารถอนุมัติได้ เนื่องจากวัตถุดิบไม่พอหรือหมดสต็อก: ${detail}`);
        }
        return;
      }

      const payload = await response.json();
      const createdItems = payload.items as ManagerStockDeductionRow[];

      updateManagerData((current) => {
        if (!current) return current;

        return {
          ...current,
          stockDeductions: [...createdItems, ...current.stockDeductions],
          ingredients:
            status === "approved"
              ? current.ingredients.map((item) => {
                  const matched = createdItems.find((record) => record.itemId === item.itemId);
                  if (!matched) return item;

                  const nextQty = Math.max(0, item.currentQty - matched.deductQty);
                  return {
                    ...item,
                    currentQty: nextQty,
                    stockStatus: deriveIngredientStockStatus(nextQty, item.maxQty, item.expiryDate),
                  };
                })
              : current.ingredients,
        };
      });

      setQuantityById({});
      setNoteById({});
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePendingStatus = async (
    transactionId: string,
    status: Extract<StockDeductionStatus, "approved" | "rejected">
  ) => {
    setApprovalWarning(null);

    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/stock-deductions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (response.status === 409 && payload?.insufficientItems) {
          const detail = payload.insufficientItems
            .map((item: { itemName: string; currentQty: number; requestedQty: number; reason: string }) =>
              item.reason === "out_of_stock"
                ? `${item.itemName} หมดสต็อก`
                : `${item.itemName} คงเหลือ ${item.currentQty} แต่ขอเบิก ${item.requestedQty}`
            )
            .join(", ");
          setApprovalWarning(`ไม่สามารถอนุมัติคำขอได้ เนื่องจากวัตถุดิบไม่พอหรือหมดสต็อก: ${detail}`);
        }
        return;
      }

      const payload = (await response.json()) as Array<{ transaction_id: string; status: StockDeductionStatus }>;

      updateManagerData((current) => {
        if (!current) return current;

        const approvedRows =
          status === "approved"
            ? current.stockDeductions.filter(
                (item) => item.transactionId === transactionId && item.status === "pending"
              )
            : [];

        return {
          ...current,
          stockDeductions: current.stockDeductions.map((item) =>
            item.transactionId === transactionId
              ? { ...item, status: payload[0]?.status ?? status }
              : item
          ),
          ingredients:
            status === "approved"
              ? current.ingredients.map((item) => {
                  const relatedRows = approvedRows.filter((row) => row.itemId === item.itemId);
                  if (relatedRows.length === 0) return item;

                  const deductTotal = relatedRows.reduce((sum, row) => sum + row.deductQty, 0);
                  const nextQty = Math.max(0, item.currentQty - deductTotal);
                  return {
                    ...item,
                    currentQty: nextQty,
                    stockStatus: deriveIngredientStockStatus(nextQty, item.maxQty, item.expiryDate),
                  };
                })
              : current.ingredients,
        };
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data) {
    return (
      <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">
        ยังไม่มีข้อมูลการตัดสต็อก
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <AlertDialog open={Boolean(approvalWarning)} onOpenChange={(open) => !open && setApprovalWarning(null)}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-red-100 text-red-600">
              <XCircle className="h-5 w-5" />
            </AlertDialogMedia>
            <AlertDialogTitle>ไม่สามารถอนุมัติรายการเบิกได้</AlertDialogTitle>
            <AlertDialogDescription>{approvalWarning ?? ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex items-center justify-center">
            <AlertDialogAction
              className="mx-auto w-auto self-center bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={() => setApprovalWarning(null)}
            >
              รับทราบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader>
          <CardTitle>ตัดสต๊อก/อนุมัติคำขอเบิก</CardTitle>
          <CardDescription>
            สร้างคำขอเบิก ตรวจสอบรายการรออนุมัติ และบันทึกผลการอนุมัติลงฐานข้อมูลจริง
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="create" className="gap-6">
            <TabsList className="grid w-full grid-cols-1 bg-red-50/70 sm:grid-cols-3">
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative w-full md:max-w-md md:flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={createQuery}
                    onChange={(event) => setCreateQuery(event.target.value)}
                    className="pl-9"
                    placeholder="ค้นหาด้วยรหัสหรือชื่อวัตถุดิบ"
                  />
                </div>
                <Select
                  value={createStatusFilter}
                  onValueChange={(
                    value:
                      | "all"
                      | "in_stock"
                      | "low_stock"
                      | "out_of_stock"
                      | "expiring_soon"
                      | "expired"
                  ) => setCreateStatusFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="กรองสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="in_stock">ปกติ</SelectItem>
                    <SelectItem value="low_stock">ใกล้หมด</SelectItem>
                    <SelectItem value="out_of_stock">หมดสต็อก</SelectItem>
                    <SelectItem value="expiring_soon">ใกล้หมดอายุ</SelectItem>
                    <SelectItem value="expired">หมดอายุ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="border-red-100 bg-white/90 shadow-sm">
                <CardContent className="pt-6">
                  <Table>
                    <TableHeader className="bg-red-50/70">
                      <TableRow>
                        <TableHead>รหัส</TableHead>
                        <TableHead>วัตถุดิบ</TableHead>
                        <TableHead>คงเหลือ</TableHead>
                        <TableHead>สถานะ</TableHead>
                        <TableHead>หน่วย</TableHead>
                        <TableHead>จำนวนที่ขอเบิก</TableHead>
                        <TableHead>หมายเหตุ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIngredients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                            {ingredients.length === 0
                              ? "ไม่มีรายการวัตถุดิบสำหรับเบิก"
                              : "ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรองสถานะ"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredIngredients.map((item) => {
                          const itemStatus = deriveIngredientStockStatus(
                            item.currentQty,
                            item.maxQty,
                            item.expiryDate
                          );

                          return (
                            <TableRow key={item.itemId} className="transition-colors hover:bg-red-100/90">
                              <TableCell className="font-medium">{item.itemId}</TableCell>
                              <TableCell>{item.itemName}</TableCell>
                              <TableCell>{item.currentQty}</TableCell>
                              <TableCell>
                                <Badge className={ingredientStatusBadgeClass(itemStatus)}>
                                  {ingredientStatusLabel(itemStatus)}
                                </Badge>
                              </TableCell>
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
                                  placeholder="เช่น ใช้สำหรับโปรโมชั่น"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>

                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <Button
                      onClick={() => void submitRequest("pending")}
                      className="bg-indigo-700 text-white hover:bg-indigo-800"
                      disabled={isSubmitting}
                    >
                      ส่งรออนุมัติ
                    </Button>
                    <Button
                      onClick={() => void submitRequest("approved")}
                      className="bg-emerald-700 text-white hover:bg-emerald-800"
                      disabled={isSubmitting}
                    >
                      อนุมัติและตัดสต๊อกทันที
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative w-full md:max-w-md md:flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={pendingQuery}
                    onChange={(event) => setPendingQuery(event.target.value)}
                    className="pl-9"
                    placeholder="ค้นหาเลขที่คำขอ ผู้ขอเบิก หรือวัตถุดิบ"
                  />
                </div>
                <Select value={pendingStatusFilter} onValueChange={(value: "all" | "pending") => setPendingStatusFilter(value)}>
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="กรองสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="pending">รออนุมัติ</SelectItem>
                  </SelectContent>
                </Select>
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
                            {deductions.some((item) => item.status === "pending")
                              ? "ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรองสถานะ"
                              : "ไม่มีรายการรออนุมัติในขณะนี้"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingGroups.map((item, index) => (
                          <TableRow
                            key={`${item.transactionId}-${index}`}
                            className="transition-colors hover:bg-amber-100/90"
                          >
                            <TableCell className="font-medium">{item.transactionId}</TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {item.items.map((name) => (
                                  <p key={name} className="text-sm">
                                    {name}
                                  </p>
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
                                  onClick={() => void updatePendingStatus(item.transactionId, "approved")}
                                  disabled={isSubmitting}
                                >
                                  <CheckCircle2 className="mr-1 h-4 w-4" />
                                  อนุมัติ
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-red-700 text-white hover:bg-red-800"
                                  onClick={() => void updatePendingStatus(item.transactionId, "rejected")}
                                  disabled={isSubmitting}
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
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative w-full md:max-w-md md:flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={historyQuery}
                    onChange={(event) => setHistoryQuery(event.target.value)}
                    className="pl-9"
                    placeholder="ค้นหาเลขที่คำขอ ผู้ขอเบิก หรือวัตถุดิบ"
                  />
                </div>
                <Select
                  value={historyStatusFilter}
                  onValueChange={(value: "all" | StockDeductionStatus) => setHistoryStatusFilter(value)}
                >
                  <SelectTrigger className="w-full md:w-[220px]">
                    <SelectValue placeholder="กรองสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="pending">รออนุมัติ</SelectItem>
                    <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
                    <SelectItem value="rejected">ปฏิเสธ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="border-slate-200 bg-white/90 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">ประวัติการตัดสต๊อก</CardTitle>
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
                      {filteredHistory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="py-8 text-center text-sm text-slate-500">
                            {deductions.length === 0
                              ? "ไม่มีประวัติการตัดสต๊อก"
                              : "ไม่พบรายการที่ตรงกับคำค้นหาหรือตัวกรองสถานะ"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredHistory.map((item, index) => (
                          <TableRow
                            key={`${item.transactionId}-${item.deductTime}-${index}`}
                            className="transition-colors hover:bg-red-100/90"
                          >
                            <TableCell className="font-medium">{item.transactionId}</TableCell>
                            <TableCell>{item.items.join(", ")}</TableCell>
                            <TableCell>{item.requestedBy}</TableCell>
                            <TableCell>{item.totalQty}</TableCell>
                            <TableCell>
                              <Badge className={badgeClass(item.status)}>{statusLabel(item.status)}</Badge>
                            </TableCell>
                            <TableCell>{formatDateTime(item.deductTime)}</TableCell>
                            <TableCell>{item.note || "-"}</TableCell>
                          </TableRow>
                        ))
                      )}
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
