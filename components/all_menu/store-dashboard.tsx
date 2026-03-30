"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ClipboardList, Eye, Search, ShoppingBag, Truck } from "lucide-react";
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
import type { PurchaseOrderStatus } from "@/lib/types/dashboard";
import type { ManagerPhaseData, ManagerPurchaseOrderRow } from "@/lib/types/manager";

function formatDate(value: string) {
  if (!value) {
    return "ยังไม่กำหนด";
  }

  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) {
    return "ยังไม่กำหนด";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
  }).format(value);
}

function statusLabel(status: PurchaseOrderStatus) {
  if (status === "arrived") return "ส่งของแล้ว";
  if (status === "received") return "รับของแล้ว";
  return "รอดำเนินการ";
}

function statusBadgeClass(status: PurchaseOrderStatus) {
  if (status === "arrived") return "border-sky-200 bg-sky-50 text-sky-700";
  if (status === "received") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function metricTone(status: PurchaseOrderStatus) {
  if (status === "arrived") {
    return {
      card: "border-sky-200/80 bg-gradient-to-br from-sky-50 via-white to-cyan-50",
      iconWrap: "bg-sky-100 text-sky-700 ring-1 ring-sky-200",
      icon: Truck,
    };
  }

  if (status === "received") {
    return {
      card: "border-emerald-200/80 bg-gradient-to-br from-emerald-50 via-white to-teal-50",
      iconWrap: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
      icon: ShoppingBag,
    };
  }

  return {
    card: "border-amber-200/80 bg-gradient-to-br from-amber-50 via-white to-orange-50",
    iconWrap: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
    icon: ClipboardList,
  };
}

const statusOptions: Array<{ value: "all" | PurchaseOrderStatus; label: string }> = [
  { value: "all", label: "ทุกสถานะ" },
  { value: "pending", label: "รอดำเนินการ" },
  { value: "arrived", label: "ส่งของแล้ว" },
];

export function StoreDashboard({ data }: { data: ManagerPhaseData | null }) {
  const { managerData, updateManagerData } = useManagerDataCache();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PurchaseOrderStatus>("all");
  const [deliveryDateFilter, setDeliveryDateFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<ManagerPurchaseOrderRow | null>(null);
  const [updatingPoId, setUpdatingPoId] = useState<string | null>(null);
  const [statusError, setStatusError] = useState("");

  const orders = managerData?.purchaseOrders ?? data?.purchaseOrders ?? [];

  const metrics = useMemo(
    () => ({
      pending: orders.filter((item) => item.status === "pending").length,
      arrived: orders.filter((item) => item.status === "arrived").length,
      received: orders.filter((item) => item.status === "received").length,
    }),
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return orders.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0
          ? true
          : item.poId.toLowerCase().includes(normalizedQuery) ||
            item.itemId.toLowerCase().includes(normalizedQuery) ||
            item.itemName.toLowerCase().includes(normalizedQuery) ||
            item.supplierName.toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchesDate =
        deliveryDateFilter.length === 0
          ? true
          : item.deliveryDate
            ? new Date(item.deliveryDate).toISOString().slice(0, 10) === deliveryDateFilter
            : false;

      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [deliveryDateFilter, orders, query, statusFilter]);

  const handleStatusChange = async (order: ManagerPurchaseOrderRow, nextStatus: PurchaseOrderStatus) => {
    if (order.status === nextStatus) {
      return;
    }

    try {
      setUpdatingPoId(order.poId);
      setStatusError("");

      const response = await fetch(`/api/purchase-orders/${order.poId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setStatusError(payload.error ?? "ไม่สามารถอัปเดตสถานะใบสั่งซื้อได้");
        return;
      }

      const nextOrder = payload as ManagerPurchaseOrderRow;
      updateManagerData((current) => {
        if (!current) return current;

        return {
          ...current,
          purchaseOrders: current.purchaseOrders.map((item) =>
            item.poId === order.poId ? nextOrder : item
          ),
        };
      });

      setSelectedOrder((current) => (current?.poId === order.poId ? nextOrder : current));
    } catch {
      setStatusError("ไม่สามารถเชื่อมต่อฐานข้อมูลเพื่ออัปเดตสถานะได้");
    } finally {
      setUpdatingPoId(null);
    }
  };

  const metricCards: Array<{
    key: PurchaseOrderStatus;
    title: string;
    value: number;
    description: string;
  }> = [
    {
      key: "pending",
      title: "รอดำเนินการ",
      value: metrics.pending,
      description: "ใบสั่งซื้อที่ยังรอการติดตามและอัปเดตสถานะ",
    },
    {
      key: "arrived",
      title: "ส่งของแล้ว",
      value: metrics.arrived,
      description: "รายการที่ supplier ส่งของมาถึงแล้ว รอรับเข้าคลัง",
    },
    {
      key: "received",
      title: "รับของแล้ว",
      value: metrics.received,
      description: "ใบสั่งซื้อที่ยืนยันรับเข้าเรียบร้อยแล้ว",
    },
  ];

  if (!data && !managerData) {
    return (
      <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">
        ยังไม่มีข้อมูลใบสั่งซื้อสำหรับส่วน Store
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {metricCards.map((metric) => {
          const tone = metricTone(metric.key);
          const Icon = tone.icon;

          return (
            <Card key={metric.key} className={`dashboard-panel rounded-2xl border shadow-sm ${tone.card}`}>
              <CardHeader className="border-b border-slate-200/70 pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription className="text-sm font-medium text-slate-600">
                      {metric.title}
                    </CardDescription>
                    <CardTitle className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
                      {metric.value.toLocaleString("th-TH")}
                    </CardTitle>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tone.iconWrap}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 text-sm text-slate-600">{metric.description}</CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="dashboard-panel rounded-2xl border shadow-sm">
        <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>จัดการใบสั่งซื้อของ Store</CardTitle>
            <CardDescription>
              ค้นหา กรอง และอัปเดตสถานะใบสั่งซื้อโดยไม่ต้องรีเฟรชหน้า
            </CardDescription>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="relative min-w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="ค้นหา PO / รหัสวัตถุดิบ / ชื่อวัตถุดิบ"
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | PurchaseOrderStatus)}
            >
              <SelectTrigger className="w-full min-w-44">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="date"
                value={deliveryDateFilter}
                onChange={(event) => setDeliveryDateFilter(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {statusError}
            </div>
          ) : null}

          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>รหัส PO</TableHead>
                <TableHead>รายการวัตถุดิบ</TableHead>
                <TableHead>วันกำหนดส่ง</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead className="w-[220px]">อัปเดตสถานะ</TableHead>
                <TableHead className="text-right">ดูรายละเอียด</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-slate-500">
                    ไม่พบใบสั่งซื้อที่ตรงกับเงื่อนไขที่เลือก
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((item, index) => (
                  <TableRow
                    key={`${item.poId}-${item.itemId}-${index}`}
                    className="transition-colors hover:bg-slate-200/85"
                  >
                    <TableCell className="font-medium">{item.poId}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-900">{item.itemName}</p>
                        <p className="text-xs text-slate-500">
                          {item.itemId} • {item.orderQty.toLocaleString("th-TH")} {item.unit}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                    <TableCell>
                      <Badge className={statusBadgeClass(item.status)}>{statusLabel(item.status)}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.status === "received" ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                          รับของแล้ว
                        </div>
                      ) : (
                        <Select
                          value={item.status}
                          onValueChange={(value) =>
                            void handleStatusChange(item, value as PurchaseOrderStatus)
                          }
                          disabled={updatingPoId === item.poId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">รอดำเนินการ</SelectItem>
                            <SelectItem value="arrived">ส่งของแล้ว</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-sky-200 text-sky-700 hover:bg-sky-50 hover:text-sky-800"
                        onClick={() => setSelectedOrder(item)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        ดูรายละเอียด
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={selectedOrder !== null} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดใบสั่งซื้อ</DialogTitle>
            <DialogDescription>
              ตรวจสอบข้อมูลเชิงลึกของ PO และสถานะล่าสุดจากฐานข้อมูล
            </DialogDescription>
          </DialogHeader>

          {selectedOrder ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">เลขที่ PO</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedOrder.poId}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">สถานะล่าสุด</p>
                <div className="mt-2">
                  <Badge className={statusBadgeClass(selectedOrder.status)}>
                    {statusLabel(selectedOrder.status)}
                  </Badge>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">วัตถุดิบ</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedOrder.itemName}</p>
                <p className="text-sm text-slate-500">
                  {selectedOrder.itemId} • {selectedOrder.unit}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Supplier</p>
                <p className="mt-2 font-semibold text-slate-900">{selectedOrder.supplierName}</p>
                <p className="text-sm text-slate-500">ผู้อนุมัติอ้างอิง: {selectedOrder.approverName}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">จำนวนสั่ง / รับแล้ว</p>
                <p className="mt-2 font-semibold text-slate-900">
                  {selectedOrder.orderQty.toLocaleString("th-TH")} /{" "}
                  {selectedOrder.receivedQty.toLocaleString("th-TH")} {selectedOrder.unit}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">ยอดรวม</p>
                <p className="mt-2 font-semibold text-slate-900">{formatCurrency(selectedOrder.priceTotal)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">วันที่สร้าง</p>
                <p className="mt-2 font-semibold text-slate-900">{formatDateTime(selectedOrder.createdAt)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">วันที่กำหนดส่ง</p>
                <p className="mt-2 font-semibold text-slate-900">{formatDateTime(selectedOrder.deliveryDate)}</p>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              ปิด
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
