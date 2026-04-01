"use client";

import { useMemo, useState } from "react";
import { Edit3, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManagerDataCache } from "@/components/manager-data-cache";
import { deriveIngredientStockStatus } from "@/lib/inventory-utils";
import type { IngredientStockStatus } from "@/lib/types/dashboard";
import type { ManagerIngredientRow, ManagerPhaseData } from "@/lib/types/manager";

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

function computeStockStatus(qty: number, maxQty: number, expiryDate?: string) {
  return deriveIngredientStockStatus(qty, maxQty, expiryDate);
}

function readableStatusLabel(status: IngredientStockStatus) {
  if (status === "expired") return "หมดอายุ";
  if (status === "expiring_soon") return "ใกล้หมดอายุ";
  if (status === "out_of_stock") return "หมดสต็อก";
  if (status === "low_stock") return "ใกล้หมด";
  return "ปกติ";
}

function badgeClass(status: IngredientStockStatus) {
  if (status === "expired") return "border-violet-200 bg-violet-50 text-violet-700";
  if (status === "expiring_soon") return "border-orange-200 bg-orange-50 text-orange-700";
  if (status === "out_of_stock") return "border-red-200 bg-red-50 text-red-700";
  if (status === "low_stock") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusLabel(status: IngredientStockStatus) {
  if (status === "out_of_stock") return "หมดสต็อก";
  if (status === "low_stock") return "ใกล้หมด";
  return "ปกติ";
}

type IngredientFormState = {
  itemId: string;
  itemName: string;
  unit: string;
  cost: number;
  expiryDate: string;
  currentQty: number;
  maxQty: number;
};

function getNextIngredientId(items: ManagerIngredientRow[]) {
  const maxId = items.reduce((max, item) => {
    const matched = item.itemId.match(/^ING(\d+)$/i);
    const numericValue = matched ? Number(matched[1]) : 0;
    return Number.isFinite(numericValue) ? Math.max(max, numericValue) : max;
  }, 0);

  return `ING${String(maxId + 1).padStart(3, "0")}`;
}

export function RawMaterialWarehouse({ data }: { data: ManagerPhaseData | null }) {
  const { managerData, updateManagerData } = useManagerDataCache();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IngredientStockStatus>("all");
  const [open, setOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<IngredientFormState>({
    itemId: "",
    itemName: "",
    unit: "",
    cost: 0,
    expiryDate: "",
    currentQty: 0,
    maxQty: 0,
  });
  const items = managerData?.ingredients ?? data?.ingredients ?? [];

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesQuery =
          item.itemId.toLowerCase().includes(query.toLowerCase()) ||
          item.itemName.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "all" ? true : item.stockStatus === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [items, query, statusFilter]
  );

  const openCreate = () => {
    setEditingItemId(null);
    setForm({
      itemId: getNextIngredientId(items),
      itemName: "",
      unit: "",
      cost: 0,
      expiryDate: "",
      currentQty: 0,
      maxQty: 0,
    });
    setFormError("");
    setOpen(true);
  };

  const openEdit = (item: ManagerIngredientRow) => {
    setEditingItemId(item.itemId);
    setForm({
      itemId: item.itemId,
      itemName: item.itemName,
      unit: item.unit,
      cost: item.cost,
      expiryDate: item.expiryDate.slice(0, 10),
      currentQty: item.currentQty,
      maxQty: item.maxQty,
    });
    setFormError("");
    setOpen(true);
  };

  const mapIngredientRow = (payload: {
    item_id: string;
    item_name: string;
    unit: string;
    cost: number;
    createdAt?: string;
    expiry_date: string;
    current_qty: number;
    max_qty: number;
    alert_threshold: number;
    stock_status: IngredientStockStatus;
  }): ManagerIngredientRow => ({
    itemId: payload.item_id,
    itemName: payload.item_name,
    unit: payload.unit,
    cost: payload.cost,
    createdAt: payload.createdAt ?? new Date().toISOString(),
    expiryDate: payload.expiry_date,
    currentQty: payload.current_qty,
    maxQty: payload.max_qty,
    alertThreshold: payload.alert_threshold,
    stockStatus: payload.stock_status,
  });

  const saveItem = async () => {
    if (!form.itemName || !form.unit || !form.expiryDate || form.maxQty <= 0) {
      setFormError("กรุณากรอกข้อมูลให้ครบ และระบุ จำนวนมากที่สุดที่สามารถเก็บในสต็อกได้ มากกว่า 0");
      return;
    }

    if (form.currentQty > form.maxQty) {
      setFormError("จำนวนคงเหลือต้องไม่มากกว่า จำนวนมากที่สุดที่สามารถเก็บในสต็อกได้");
      return;
    }

    setFormError("");

    try {
      setIsSubmitting(true);

      const response = await fetch(
        editingItemId ? `/api/ingredients/${editingItemId}` : "/api/ingredients",
        {
          method: editingItemId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            alertThreshold:
              items.find((item) => item.itemId === editingItemId)?.alertThreshold ??
              Math.max(10, Math.floor(form.maxQty * 0.2)),
          }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        setFormError(payload.error ?? "ไม่สามารถบันทึกข้อมูลวัตถุดิบได้");
        return;
      }

      const nextItem = mapIngredientRow(payload);
      if (editingItemId) {
        updateManagerData((current) => {
          if (!current) return current;
          return {
            ...current,
            ingredients: current.ingredients.map((item) =>
              item.itemId === editingItemId ? nextItem : item
            ),
          };
        });
      } else {
        updateManagerData((current) => {
          if (!current) return current;
          return {
            ...current,
            ingredients: [nextItem, ...current.ingredients],
          };
        });
      }
      setOpen(false);
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อบันทึกข้อมูลได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/ingredients/${itemId}`, { method: "DELETE" });
      if (!response.ok) {
        return;
      }
      updateManagerData((current) => {
        if (!current) return current;
        return {
          ...current,
          ingredients: current.ingredients.filter((row) => row.itemId !== itemId),
        };
      });
    } catch {
      // Keep current UI state when delete fails.
    }
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลวัตถุดิบ</section>;
  }

  return (
    <section className="space-y-6">
      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>คลังวัตถุดิบ</CardTitle>
            <CardDescription>ค้นหา กรองสถานะ และจัดการข้อมูลวัตถุดิบโดยคำนวณสถานะจากสัดส่วนคงเหลือเทียบกับ จำนวนมากที่สุดที่สามารถเก็บในสต็อกได้</CardDescription>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap max-md:w-full">
            <div className="relative w-full md:min-w-64 md:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="ค้นหาจากรหัสหรือชื่อวัตถุดิบ" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | IngredientStockStatus)}>
              <SelectTrigger className="w-full md:w-44">
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
            <Button onClick={openCreate} className="w-full bg-sky-700 text-white hover:bg-sky-800 md:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              เพิ่มวัตถุดิบลงคลัง
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>ชื่อวัตถุดิบ</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead><div>จำนวนมากที่สุด</div><div>ที่สามารถเก็บในสต็อกได้</div></TableHead>
                <TableHead>หน่วย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันหมดอายุ</TableHead>
                <TableHead>ต้นทุน</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-sm text-slate-500">
                    ไม่มีรายการวัตถุดิบ
                  </TableCell>
                </TableRow>
              ) : (
                filteredItems.map((item) => (
                  <TableRow key={item.itemId} className="transition-colors hover:bg-sky-100/90">
                    <TableCell className="font-medium">{item.itemId}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.currentQty}</TableCell>
                    <TableCell>{item.maxQty}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Badge className={badgeClass(item.stockStatus)}>{readableStatusLabel(item.stockStatus)}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(item.expiryDate)}</TableCell>
                    <TableCell>{formatCurrency(item.cost)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void deleteItem(item.itemId)}>
                          <Trash2 className="h-4 w-4 text-red-600" />
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItemId ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบลงคลัง"}</DialogTitle>
            <DialogDescription>ระบุ จำนวนมากที่สุดที่สามารถเก็บในสต็อกได้ เพื่อให้ระบบคำนวณสถานะจากสัดส่วนคงเหลืออัตโนมัติ</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">รหัสวัตถุดิบ</p>
              <Input value={form.itemId} onChange={(e) => setForm((current) => ({ ...current, itemId: e.target.value }))} placeholder="เช่น ING001" disabled={true} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ชื่อวัตถุดิบ</p>
              <Input value={form.itemName} onChange={(e) => setForm((current) => ({ ...current, itemName: e.target.value }))} placeholder="เช่น Chicken Fillet" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">หน่วย</p>
              <Input value={form.unit} onChange={(e) => setForm((current) => ({ ...current, unit: e.target.value }))} placeholder="เช่น kg / pack / box" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">จำนวนคงเหลือ</p>
              <Input type="number" value={form.currentQty} onChange={(e) => setForm((current) => ({ ...current, currentQty: Number(e.target.value) }))} placeholder="จำนวนคงเหลือ" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">จำนวนมากที่สุดที่สามารถเก็บในสต็อกได้</p>
              <Input type="number" min={1} value={form.maxQty || ""} onChange={(e) => setForm((current) => ({ ...current, maxQty: Number(e.target.value) }))} placeholder="จำเป็นต้องกรอก" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ต้นทุน</p>
              <Input type="number" value={form.cost} onChange={(e) => setForm((current) => ({ ...current, cost: Number(e.target.value) }))} placeholder="ราคาต้นทุน" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-sm font-medium text-slate-700">วันหมดอายุ</p>
              <Input type="date" value={form.expiryDate.slice(0, 10)} onChange={(e) => setForm((current) => ({ ...current, expiryDate: e.target.value }))} />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <p className="text-sm font-medium text-slate-700">สถานะที่ระบบคำนวณ</p>
              <p className="mt-2 text-sm text-slate-600">หากคงเหลือเป็น 0 จะแสดงหมดสต็อก และหากคงเหลือน้อยกว่าหรือเท่ากับ 20% ของ จำนวนมากที่สุดที่สามารถเก็บในสต็อกได้ จะแสดงใกล้หมด</p>
              <div className="mt-3">
                <Badge className={badgeClass(computeStockStatus(form.currentQty, form.maxQty, form.expiryDate))}>
                  {readableStatusLabel(computeStockStatus(form.currentQty, form.maxQty, form.expiryDate))}
                </Badge>
              </div>
            </div>
            {formError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>ยกเลิก</Button>
            <Button onClick={() => void saveItem()} className="bg-sky-700 text-white hover:bg-sky-800" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
