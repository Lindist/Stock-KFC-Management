"use client";

import { useMemo, useState } from "react";
import { Edit3, FilePlus2, Search, Trash2 } from "lucide-react";
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
import type { PurchaseOrderStatus } from "@/lib/types/dashboard";
import type { ManagerPhaseData, ManagerPurchaseOrderRow } from "@/lib/types/manager";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function badgeClass(status: PurchaseOrderStatus) {
  if (status === "received") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "arrived") return "border-sky-200 bg-sky-50 text-sky-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function statusLabel(status: PurchaseOrderStatus) {
  if (status === "received") return "รับเข้าครบแล้ว";
  if (status === "arrived") return "ของมาถึงแล้ว";
  return "รอดำเนินการ";
}

const emptyForm: ManagerPurchaseOrderRow = {
  poId: "",
  itemId: "",
  itemName: "",
  unit: "",
  approverId: "USR001",
  approverName: "ผู้จัดการ",
  supplierName: "",
  orderQty: 0,
  receivedQty: 0,
  priceTotal: 0,
  deliveryDate: "",
  status: "pending",
};

export function PurchaseOrders({ data }: { data: ManagerPhaseData | null }) {
  const [orders, setOrders] = useState<ManagerPurchaseOrderRow[]>(data?.purchaseOrders ?? []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseOrderStatus>("all");
  const [open, setOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [form, setForm] = useState<ManagerPurchaseOrderRow>(emptyForm);

  const filteredOrders = useMemo(
    () =>
      orders.filter((item) => {
        const matchesQuery =
          item.poId.toLowerCase().includes(query.toLowerCase()) ||
          item.itemName.toLowerCase().includes(query.toLowerCase()) ||
          item.supplierName.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [orders, query, statusFilter]
  );

  const openCreate = () => {
    setEditingPoId(null);
    setForm({
      ...emptyForm,
      poId: `PO-${String(orders.length + 1).padStart(4, "0")}`,
      deliveryDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  };

  const openEdit = (item: ManagerPurchaseOrderRow) => {
    setEditingPoId(item.poId);
    setForm({
      ...item,
      deliveryDate: item.deliveryDate.slice(0, 10),
    });
    setOpen(true);
  };

  const saveOrder = () => {
    if (!form.poId || !form.itemName || !form.supplierName) return;

    if (editingPoId) {
      setOrders((current) => current.map((item) => (item.poId === editingPoId ? form : item)));
    } else {
      setOrders((current) => [form, ...current]);
    }

    setOpen(false);
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลใบสั่งซื้อ</section>;
  }

  return (
    <section className="space-y-6">
      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>ใบสั่งซื้อ</CardTitle>
            <CardDescription>ค้นหา ติดตามสถานะ และจัดการรายการสั่งซื้อวัตถุดิบจาก supplier</CardDescription>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative min-w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="ค้นหาเลขที่ PO / วัตถุดิบ / supplier" />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | PurchaseOrderStatus)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="arrived">ของมาถึงแล้ว</SelectItem>
                <SelectItem value="received">รับเข้าครบแล้ว</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openCreate} className="bg-sky-700 text-white hover:bg-sky-800">
              <FilePlus2 className="mr-2 h-4 w-4" />
              เพิ่มใบสั่งซื้อ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>เลขที่ PO</TableHead>
                <TableHead>วัตถุดิบ</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>จำนวนสั่ง</TableHead>
                <TableHead>รับแล้ว</TableHead>
                <TableHead>ยอดรวม</TableHead>
                <TableHead>กำหนดส่ง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((item, index) => (
                <TableRow key={`${item.poId}-${item.itemId}-${index}`} className="transition-colors hover:bg-red-50/60">
                  <TableCell className="font-medium">{item.poId}</TableCell>
                  <TableCell>
                    <div>
                      <p>{item.itemName}</p>
                      <p className="text-xs text-slate-500">{item.itemId}</p>
                    </div>
                  </TableCell>
                  <TableCell>{item.supplierName}</TableCell>
                  <TableCell>{item.orderQty.toLocaleString("th-TH")} {item.unit}</TableCell>
                  <TableCell>{item.receivedQty.toLocaleString("th-TH")} {item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.priceTotal)}</TableCell>
                  <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                  <TableCell>
                    <Badge className={badgeClass(item.status)}>{statusLabel(item.status)}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setOrders((current) => current.filter((row) => row.poId !== item.poId))}>
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
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editingPoId ? "แก้ไขใบสั่งซื้อ" : "เพิ่มใบสั่งซื้อ"}</DialogTitle>
            <DialogDescription>กรอกรายละเอียด PO เพื่อใช้ติดตามการจัดซื้อและการรับวัตถุดิบเข้าคลัง</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">เลขที่ PO</p>
              <Input value={form.poId} onChange={(event) => setForm((current) => ({ ...current, poId: event.target.value }))} placeholder="เช่น PO-0001" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Supplier</p>
              <Input value={form.supplierName} onChange={(event) => setForm((current) => ({ ...current, supplierName: event.target.value }))} placeholder="ชื่อ supplier" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">รหัสวัตถุดิบ</p>
              <Input value={form.itemId} onChange={(event) => setForm((current) => ({ ...current, itemId: event.target.value }))} placeholder="เช่น ING001" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ชื่อวัตถุดิบ</p>
              <Input value={form.itemName} onChange={(event) => setForm((current) => ({ ...current, itemName: event.target.value }))} placeholder="ชื่อวัตถุดิบ" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">หน่วย</p>
              <Input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="เช่น box / kg" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">จำนวนสั่ง</p>
              <Input type="number" value={form.orderQty} onChange={(event) => setForm((current) => ({ ...current, orderQty: Number(event.target.value) }))} placeholder="จำนวนสั่ง" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">จำนวนที่รับแล้ว</p>
              <Input type="number" value={form.receivedQty} onChange={(event) => setForm((current) => ({ ...current, receivedQty: Number(event.target.value) }))} placeholder="จำนวนที่รับแล้ว" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ยอดรวม</p>
              <Input type="number" value={form.priceTotal} onChange={(event) => setForm((current) => ({ ...current, priceTotal: Number(event.target.value) }))} placeholder="ยอดรวม" />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">กำหนดส่ง</p>
              <Input type="date" value={form.deliveryDate.slice(0, 10)} onChange={(event) => setForm((current) => ({ ...current, deliveryDate: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">สถานะ</p>
              <Select value={form.status} onValueChange={(value) => setForm((current) => ({ ...current, status: value as PurchaseOrderStatus }))}>
                <SelectTrigger>
                  <SelectValue placeholder="สถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">รอดำเนินการ</SelectItem>
                  <SelectItem value="arrived">ของมาถึงแล้ว</SelectItem>
                  <SelectItem value="received">รับเข้าครบแล้ว</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={saveOrder} className="bg-sky-700 text-white hover:bg-sky-800">บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
