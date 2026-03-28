"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown, Edit3, FilePlus2, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManagerDataCache } from "@/components/manager-data-cache";
import { cn } from "@/lib/utils";
import type { PurchaseOrderStatus } from "@/lib/types/dashboard";
import type { ManagerPhaseData, ManagerPurchaseOrderRow } from "@/lib/types/manager";

type IngredientOption = {
  itemId: string;
  itemName: string;
  unit: string;
  cost: number;
};

type SupplierOption = {
  id: string;
  name: string;
  role: string;
};

type PurchaseOrderForm = {
  poId: string;
  itemId: string;
  supplierId: string;
  supplierName: string;
  orderQty: number;
};

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

const emptyForm: PurchaseOrderForm = {
  poId: "",
  itemId: "",
  supplierId: "",
  supplierName: "",
  orderQty: 0,
};

export function PurchaseOrders({ data }: { data: ManagerPhaseData | null }) {
  const { managerData, updateManagerData } = useManagerDataCache();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseOrderStatus>("all");
  const [open, setOpen] = useState(false);
  const [editingPoId, setEditingPoId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [ingredientOpen, setIngredientOpen] = useState(false);
  const [supplierOpen, setSupplierOpen] = useState(false);
  const [supplierOptions, setSupplierOptions] = useState<SupplierOption[]>([]);
  const [form, setForm] = useState<PurchaseOrderForm>(emptyForm);
  const orders = managerData?.purchaseOrders ?? data?.purchaseOrders ?? [];
  const ingredientOptions = useMemo<IngredientOption[]>(
    () =>
      (managerData?.ingredients ?? data?.ingredients ?? []).map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        unit: item.unit,
        cost: item.cost,
      })),
    [data?.ingredients, managerData?.ingredients]
  );

  useEffect(() => {
    const loadOptions = async () => {
      const response = await fetch("/api/purchase-orders/options");
      if (!response.ok) return;
      const payload = await response.json();
      setSupplierOptions(payload.suppliers ?? []);
    };

    void loadOptions();
  }, []);

  const selectedIngredient = ingredientOptions.find((item) => item.itemId === form.itemId) ?? null;
  const selectedSupplier = supplierOptions.find((item) => item.id === form.supplierId) ?? null;
  const computedPriceTotal = selectedIngredient ? selectedIngredient.cost * Math.max(form.orderQty, 0) : 0;

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
    setFormError("");
    setForm({
      ...emptyForm,
      poId: `PO-${String(orders.length + 1).padStart(4, "0")}`,
    });
    setOpen(true);
  };

  const openEdit = (item: ManagerPurchaseOrderRow) => {
    setEditingPoId(item.poId);
    setFormError("");
    setForm({
      poId: item.poId,
      itemId: item.itemId,
      supplierId: item.approverId,
      supplierName: item.supplierName,
      orderQty: item.orderQty,
    });
    setOpen(true);
  };

  const saveOrder = async () => {
    if (!form.poId || !form.itemId || !form.supplierId || form.orderQty <= 0) {
      setFormError("กรุณาเลือกวัตถุดิบ เลือก supplier และกรอกจำนวนสั่งให้ครบ");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      const response = await fetch(
        editingPoId ? `/api/purchase-orders/${editingPoId}` : "/api/purchase-orders",
        {
          method: editingPoId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            poId: form.poId,
            itemId: form.itemId,
            supplierName: selectedSupplier?.name ?? form.supplierName,
            approverId: form.supplierId,
            orderQty: form.orderQty,
          }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        setFormError(payload.error ?? "ไม่สามารถบันทึกใบสั่งซื้อได้");
        return;
      }

      const nextOrder = payload as ManagerPurchaseOrderRow;
      if (editingPoId) {
        updateManagerData((current) => {
          if (!current) return current;
          return {
            ...current,
            purchaseOrders: current.purchaseOrders.map((item) =>
              item.poId === editingPoId ? nextOrder : item
            ),
          };
        });
      } else {
        updateManagerData((current) => {
          if (!current) return current;
          return {
            ...current,
            purchaseOrders: [nextOrder, ...current.purchaseOrders],
          };
        });
      }
      setOpen(false);
    } catch {
      setFormError("ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่อบันทึกใบสั่งซื้อได้");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteOrder = async (poId: string) => {
    try {
      const response = await fetch(`/api/purchase-orders/${poId}`, { method: "DELETE" });
      if (!response.ok) return;
      updateManagerData((current) => {
        if (!current) return current;
        return {
          ...current,
          purchaseOrders: current.purchaseOrders.filter((row) => row.poId !== poId),
        };
      });
    } catch {
      // keep UI if delete fails
    }
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
            <CardDescription>สร้างและแก้ไขใบสั่งซื้อจากวัตถุดิบจริงในระบบ พร้อมเลือก supplier จากผู้ใช้ที่มีสิทธิ์ store</CardDescription>
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
                      <Button variant="outline" size="sm" onClick={() => void deleteOrder(item.poId)}>
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
            <DialogDescription>เลือกวัตถุดิบและ supplier จากรายการในระบบ แล้วระบบจะคำนวณยอดรวมอัตโนมัติให้</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">เลขที่ PO</p>
              <Input value={form.poId} onChange={(event) => setForm((current) => ({ ...current, poId: event.target.value }))} placeholder="เช่น PO-0001" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">รหัสวัตถุดิบ / ชื่อวัตถุดิบ / หน่วย</p>
              <Popover open={ingredientOpen} onOpenChange={setIngredientOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedIngredient ? `${selectedIngredient.itemId} - ${selectedIngredient.itemName} (${selectedIngredient.unit})` : "เลือกวัตถุดิบ"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[420px] overflow-hidden p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหาวัตถุดิบ..." />
                    <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                      {ingredientOptions.length} รายการ
                    </div>
                    <CommandList className="h-72 max-h-[min(18rem,var(--radix-popover-content-available-height))]">
                      <CommandEmpty>ไม่พบวัตถุดิบ</CommandEmpty>
                      <CommandGroup>
                        {ingredientOptions.map((item) => (
                          <CommandItem
                            key={item.itemId}
                            value={`${item.itemId} ${item.itemName} ${item.unit}`}
                            onSelect={() => {
                              setForm((current) => ({ ...current, itemId: item.itemId }));
                              setIngredientOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.itemId === item.itemId ? "opacity-100" : "opacity-0")} />
                            <span>{item.itemId} - {item.itemName} ({item.unit})</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Supplier (สิทธิ์ Store)</p>
              <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedSupplier ? selectedSupplier.name : "เลือก supplier"}
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[360px] overflow-hidden p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ค้นหา supplier..." />
                    <div className="border-b border-slate-100 px-3 py-2 text-xs text-slate-500">
                      {supplierOptions.length} รายการ
                    </div>
                    <CommandList className="max-h-[min(18rem,var(--radix-popover-content-available-height))]">
                      <CommandEmpty>ไม่พบ supplier</CommandEmpty>
                      <CommandGroup>
                        {supplierOptions.map((user) => (
                          <CommandItem
                            key={user.id}
                            value={`${user.name} ${user.id} ${user.role}`}
                            onSelect={() => {
                              setForm((current) => ({
                                ...current,
                                supplierId: user.id,
                                supplierName: user.name,
                              }));
                              setSupplierOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", form.supplierId === user.id ? "opacity-100" : "opacity-0")} />
                            <span>{user.name}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">จำนวนสั่ง</p>
              <Input type="number" min={1} value={form.orderQty || ""} onChange={(event) => setForm((current) => ({ ...current, orderQty: Number(event.target.value) }))} placeholder="จำนวนสั่ง" />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">หน่วย</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{selectedIngredient?.unit ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">ต้นทุนต่อหน่วย</p>
                  <p className="mt-1 text-sm font-medium text-slate-800">{selectedIngredient ? formatCurrency(selectedIngredient.cost) : "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-500">ยอดรวม</p>
                  <p className="mt-1 text-sm font-semibold text-sky-800">{formatCurrency(computedPriceTotal)}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">ระบบจะตั้งสถานะเป็นรอดำเนินการทุกครั้งที่สร้าง และจะคำนวณยอดรวมจากจำนวนสั่ง x ราคาทุนสินค้าอัตโนมัติ</p>
            </div>

            {formError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:col-span-2">
                {formError}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              ยกเลิก
            </Button>
            <Button onClick={() => void saveOrder()} className="bg-sky-700 text-white hover:bg-sky-800" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
