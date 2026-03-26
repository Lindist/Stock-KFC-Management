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
import type { IngredientStockStatus } from "@/lib/types/dashboard";
import type { ManagerIngredientRow, ManagerPhaseData } from "@/lib/types/manager";

function formatDate(value: string) {
  return value ? new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value)) : "-";
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

function badgeClass(status: IngredientStockStatus) {
  if (status === "out_of_stock") return "border-red-200 bg-red-50 text-red-700";
  if (status === "low_stock") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusLabel(status: IngredientStockStatus) {
  if (status === "out_of_stock") return "หมดสต๊อก";
  if (status === "low_stock") return "ใกล้หมด";
  return "ปกติ";
}

export function RawMaterialWarehouse({ data }: { data: ManagerPhaseData | null }) {
  const [items, setItems] = useState<ManagerIngredientRow[]>(data?.ingredients ?? []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | IngredientStockStatus>("all");
  const [open, setOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [form, setForm] = useState<ManagerIngredientRow>({
    itemId: "",
    itemName: "",
    unit: "",
    cost: 0,
    expiryDate: "",
    currentQty: 0,
    stockStatus: "in_stock",
  });

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
      itemId: `ING${String(items.length + 1).padStart(3, "0")}`,
      itemName: "",
      unit: "",
      cost: 0,
      expiryDate: "",
      currentQty: 0,
      stockStatus: "in_stock",
    });
    setOpen(true);
  };

  const openEdit = (item: ManagerIngredientRow) => {
    setEditingItemId(item.itemId);
    setForm(item);
    setOpen(true);
  };

  const saveItem = () => {
    if (!form.itemName || !form.unit) return;
    if (editingItemId) {
      setItems((current) => current.map((item) => (item.itemId === editingItemId ? form : item)));
    } else {
      setItems((current) => [form, ...current]);
    }
    setOpen(false);
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
            <CardDescription>ค้นหา กรองสถานะ และจัดการข้อมูลวัตถุดิบในคลัง</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" placeholder="ค้นหารหัสหรือชื่อวัตถุดิบ" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | IngredientStockStatus)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="กรองสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="in_stock">ปกติ</SelectItem>
                <SelectItem value="low_stock">ใกล้หมด</SelectItem>
                <SelectItem value="out_of_stock">หมดสต๊อก</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate}>
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
                <TableHead>หน่วย</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>วันหมดอายุ</TableHead>
                <TableHead>ต้นทุน</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.itemId} className="hover:bg-red-50/40">
                  <TableCell className="font-medium">{item.itemId}</TableCell>
                  <TableCell>{item.itemName}</TableCell>
                  <TableCell>{item.currentQty}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell><Badge className={badgeClass(item.stockStatus)}>{statusLabel(item.stockStatus)}</Badge></TableCell>
                  <TableCell>{formatDate(item.expiryDate)}</TableCell>
                  <TableCell>{formatCurrency(item.cost)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}><Edit3 className="h-4 w-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => setItems((current) => current.filter((row) => row.itemId !== item.itemId))}>
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingItemId ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบลงคลัง"}</DialogTitle>
            <DialogDescription>อัปเดตรายละเอียดวัตถุดิบให้พร้อมใช้งานในระบบคลัง</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input value={form.itemId} onChange={(e) => setForm((current) => ({ ...current, itemId: e.target.value }))} placeholder="รหัสวัตถุดิบ" />
            <Input value={form.itemName} onChange={(e) => setForm((current) => ({ ...current, itemName: e.target.value }))} placeholder="ชื่อวัตถุดิบ" />
            <Input value={form.unit} onChange={(e) => setForm((current) => ({ ...current, unit: e.target.value }))} placeholder="หน่วย" />
            <Input type="number" value={form.currentQty} onChange={(e) => setForm((current) => ({ ...current, currentQty: Number(e.target.value) }))} placeholder="คงเหลือ" />
            <Input type="number" value={form.cost} onChange={(e) => setForm((current) => ({ ...current, cost: Number(e.target.value) }))} placeholder="ต้นทุน" />
            <Input type="date" value={form.expiryDate.slice(0, 10)} onChange={(e) => setForm((current) => ({ ...current, expiryDate: e.target.value }))} />
            <Select value={form.stockStatus} onValueChange={(value) => setForm((current) => ({ ...current, stockStatus: value as IngredientStockStatus }))}>
              <SelectTrigger className="w-full"><SelectValue placeholder="สถานะ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">ปกติ</SelectItem>
                <SelectItem value="low_stock">ใกล้หมด</SelectItem>
                <SelectItem value="out_of_stock">หมดสต๊อก</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>ยกเลิก</Button>
            <Button onClick={saveItem}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
