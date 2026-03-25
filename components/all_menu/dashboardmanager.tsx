"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  BellRing,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  GlobalDashboardData,
  IngredientStockStatus,
  LowStockAlertType,
  PurchaseOrderStatus,
  StockDeductionStatus,
} from "@/lib/types/dashboard";

type DashboardManagerProps = {
  data: GlobalDashboardData;
  initialTab?: string;
  onTabChange?: (tab: string) => void;
};

const metricIcons = {
  neutral: Boxes,
  warning: ClipboardCheck,
  danger: AlertTriangle,
  success: CheckCircle2,
} as const;

const rowHoverClass =
  "hover:bg-[rgba(127,29,29,0.055)] hover:shadow-[inset_4px_0_0_0_rgba(185,28,28,0.88)]";

function formatDate(value: string) {
  if (!value) {
    return "-";
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
    maximumFractionDigits: 2,
  }).format(value);
}

function metricCardClass(tone: keyof typeof metricIcons) {
  if (tone === "danger") {
    return "border-red-200/90 shadow-[0_18px_42px_rgba(185,28,28,0.14)]";
  }

  if (tone === "warning") {
    return "border-amber-200/95 shadow-[0_18px_42px_rgba(217,119,6,0.14)]";
  }

  if (tone === "success") {
    return "border-emerald-200/95 shadow-[0_18px_42px_rgba(5,150,105,0.14)]";
  }

  return "border-sky-200/90 shadow-[0_18px_42px_rgba(14,116,144,0.12)]";
}

function metricIconClass(tone: keyof typeof metricIcons) {
  if (tone === "danger") {
    return "bg-[linear-gradient(135deg,rgba(254,226,226,0.98),rgba(254,202,202,0.95))] text-red-700 ring-1 ring-red-200";
  }

  if (tone === "warning") {
    return "bg-[linear-gradient(135deg,rgba(254,243,199,0.98),rgba(253,230,138,0.95))] text-amber-700 ring-1 ring-amber-200";
  }

  if (tone === "success") {
    return "bg-[linear-gradient(135deg,rgba(209,250,229,0.98),rgba(167,243,208,0.95))] text-emerald-700 ring-1 ring-emerald-200";
  }

  return "bg-[linear-gradient(135deg,rgba(224,242,254,0.98),rgba(186,230,253,0.95))] text-sky-700 ring-1 ring-sky-200";
}

function stockStatusLabel(status: IngredientStockStatus) {
  if (status === "out_of_stock") {
    return "หมดสต๊อก";
  }

  if (status === "low_stock") {
    return "ใกล้หมด";
  }

  return "ปกติ";
}

function stockStatusBadgeVariant(status: IngredientStockStatus) {
  if (status === "out_of_stock") {
    return "destructive";
  }

  if (status === "low_stock") {
    return "secondary";
  }

  return "outline";
}

function stockStatusBadgeClass(status: IngredientStockStatus) {
  if (status === "out_of_stock") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "low_stock") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function alertTypeLabel(type: LowStockAlertType) {
  if (type === "out_of_stock") {
    return "หมดสต๊อก";
  }

  if (type === "expiry") {
    return "ใกล้หมดอายุ";
  }

  return "สต๊อกต่ำ";
}

function deductionStatusLabel(status: StockDeductionStatus) {
  if (status === "approved") {
    return "อนุมัติแล้ว";
  }

  if (status === "rejected") {
    return "ถูกปฏิเสธ";
  }

  return "รออนุมัติ";
}

function deductionBadgeClass(status: StockDeductionStatus) {
  if (status === "approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "rejected") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function orderStatusLabel(status: PurchaseOrderStatus) {
  if (status === "received") {
    return "รับเข้าแล้ว";
  }

  if (status === "arrived") {
    return "สินค้ามาถึง";
  }

  return "รอดำเนินการ";
}

function orderStatusVariant(status: PurchaseOrderStatus) {
  if (status === "pending") {
    return "secondary";
  }

  if (status === "arrived") {
    return "outline";
  }

  return "default";
}

function orderBadgeClass(status: PurchaseOrderStatus) {
  if (status === "received") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "arrived") {
    return "border-sky-200 bg-sky-50 text-sky-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function alertReadBadgeClass(isRead: "Y" | "N") {
  if (isRead === "Y") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="dashboard-panel flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

export function DashboardManager({ data, initialTab, onTabChange }: DashboardManagerProps) {
  const [activeTab, setActiveTab] = useState(initialTab ?? "ingredients");
  const [showGlobalAlert, setShowGlobalAlert] = useState(true);

  const hasAttention = useMemo(
    () =>
      data.highlight.unreadAlerts > 0 ||
      data.highlight.pendingDeductionApprovals > 0 ||
      data.highlight.pendingPurchaseOrders > 0,
    [data.highlight]
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Dashboard</h1>
          <p className="text-slate-500">
            ภาพรวมคลัง วัตถุดิบ การตัดสต๊อก และใบสั่งซื้อจากฐานข้อมูลกลาง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 bg-white/85 text-slate-700 shadow-sm">
            อัปเดตล่าสุด {formatDate(data.generatedAt)}
          </Badge>
          <Button variant="outline" size="sm" disabled className="bg-white/80 shadow-sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Live Snapshot
          </Button>
        </div>
      </div>

      {showGlobalAlert && hasAttention && (
        <Alert className="border-amber-200 bg-[linear-gradient(135deg,rgba(255,247,221,0.96),rgba(255,252,244,0.92))] text-amber-950 shadow-sm backdrop-blur">
          <BellRing className="h-4 w-4" />
          <AlertTitle>มีรายการที่ต้องติดตามในระบบ</AlertTitle>
          <AlertDescription>
            มีแจ้งเตือนค้าง {data.highlight.unreadAlerts} รายการ, คำขอรออนุมัติ{" "}
            {data.highlight.pendingDeductionApprovals} รายการ และใบสั่งซื้อรอรับ{" "}
            {data.highlight.pendingPurchaseOrders} รายการ
          </AlertDescription>
          <AlertAction className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setActiveTab("alerts")}>
              ดูแจ้งเตือน
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowGlobalAlert(false)}>
              ปิด
            </Button>
          </AlertAction>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map((metric) => {
          const Icon = metricIcons[metric.tone];

          return (
            <Card
              key={metric.key}
              className={`dashboard-panel bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(255,248,245,0.88))] backdrop-blur ${metricCardClass(metric.tone)}`}
            >
              <CardHeader className="border-b border-slate-100/80">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardDescription>{metric.label}</CardDescription>
                    <CardTitle className="mt-2 text-3xl font-semibold">{metric.value}</CardTitle>
                  </div>
                  <div className={`rounded-xl p-2 ${metricIconClass(metric.tone)}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">{metric.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          onTabChange?.(value);
        }}
        className="gap-4"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-white/55 p-1 shadow-sm backdrop-blur">
          <TabsTrigger value="ingredients" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            คลังวัตถุดิบ
          </TabsTrigger>
          <TabsTrigger value="deductions" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            ประวัติตัดสต๊อก
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            วัตถุดิบใกล้หมด
          </TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            ประวัติสั่งซื้อ
          </TabsTrigger>
          <TabsTrigger value="receipts" className="data-[state=active]:bg-red-700 data-[state=active]:text-white">
            ประวัติรับสินค้า
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients">
          <Card className="dashboard-panel shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>คลังวัตถุดิบ</CardTitle>
              <CardDescription>แสดงข้อมูลวัตถุดิบล่าสุดจากฐานข้อมูล พร้อมสถานะสต๊อกและวันหมดอายุ</CardDescription>
            </CardHeader>
            <CardContent>
              {data.ingredients.length === 0 ? (
                <EmptyState message="ยังไม่มีข้อมูลวัตถุดิบในระบบ" />
              ) : (
                <Table className="rounded-xl">
                  <TableHeader className="bg-[rgba(148,163,184,0.08)]">
                    <TableRow>
                      <TableHead>รหัส</TableHead>
                      <TableHead>ชื่อวัตถุดิบ</TableHead>
                      <TableHead>หน่วย</TableHead>
                      <TableHead>ต้นทุน/หน่วย</TableHead>
                      <TableHead>วันหมดอายุ</TableHead>
                      <TableHead>คงเหลือ</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.ingredients.map((item) => (
                      <TableRow key={item.itemId} className={rowHoverClass}>
                        <TableCell className="font-medium">{item.itemId}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>{formatCurrency(item.cost)}</TableCell>
                        <TableCell>{formatDate(item.expiryDate)}</TableCell>
                        <TableCell>{item.currentQty}</TableCell>
                        <TableCell>
                          <Badge
                            variant={stockStatusBadgeVariant(item.stockStatus)}
                            className={stockStatusBadgeClass(item.stockStatus)}
                          >
                            {stockStatusLabel(item.stockStatus)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deductions">
          <Card className="dashboard-panel shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>ประวัติการตัดสต๊อก</CardTitle>
              <CardDescription>รวมคำขอเบิก การอนุมัติ และผลการตัดสต๊อกจาก `StockDeduction`</CardDescription>
            </CardHeader>
            <CardContent>
              {data.stockDeductions.length === 0 ? (
                <EmptyState message="ยังไม่มีประวัติการตัดสต๊อก" />
              ) : (
                <Table className="rounded-xl">
                  <TableHeader className="bg-[rgba(148,163,184,0.08)]">
                    <TableRow>
                      <TableHead>รหัสคำขอ</TableHead>
                      <TableHead>วัตถุดิบ</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead>ผู้ขอเบิก</TableHead>
                      <TableHead>วันเวลา</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.stockDeductions.map((item, index) => (
                      <TableRow
                        key={`${item.transactionId}-${item.itemId}-${item.deductTime}-${index}`}
                        className={rowHoverClass}
                      >
                        <TableCell className="font-medium">{item.transactionId}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.deductQty}</TableCell>
                        <TableCell>{item.requestedBy}</TableCell>
                        <TableCell>{formatDate(item.deductTime)}</TableCell>
                        <TableCell>
                          <Badge className={deductionBadgeClass(item.status)}>
                            {deductionStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card className="dashboard-panel shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>วัตถุดิบใกล้หมด</CardTitle>
              <CardDescription>รายการแจ้งเตือนจาก `LowStockAlert` สำหรับติดตามสต๊อกต่ำ หมดสต๊อก และใกล้หมดอายุ</CardDescription>
            </CardHeader>
            <CardContent>
              {data.lowStockAlerts.length === 0 ? (
                <EmptyState message="ยังไม่มีรายการแจ้งเตือน" />
              ) : (
                <Table className="rounded-xl">
                  <TableHeader className="bg-[rgba(148,163,184,0.08)]">
                    <TableRow>
                      <TableHead>Alert ID</TableHead>
                      <TableHead>วัตถุดิบ</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead>เวลาแจ้งเตือน</TableHead>
                      <TableHead>สถานะอ่าน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.lowStockAlerts.map((item) => (
                      <TableRow key={item.alertId} className={rowHoverClass}>
                        <TableCell className="font-medium">{item.alertId}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{alertTypeLabel(item.alertType)}</TableCell>
                        <TableCell>{item.alertQty}</TableCell>
                        <TableCell>{formatDate(item.alertTime)}</TableCell>
                        <TableCell>
                          <Badge className={alertReadBadgeClass(item.isRead)}>
                            {item.isRead === "Y" ? "อ่านแล้ว" : "ยังไม่อ่าน"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="dashboard-panel shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>ประวัติสั่งซื้อ</CardTitle>
              <CardDescription>สรุปรายการ PO ล่าสุดจาก `PurchaseOrder` พร้อมผู้อนุมัติ สถานะ และยอดรวม</CardDescription>
            </CardHeader>
            <CardContent>
              {data.purchaseOrders.length === 0 ? (
                <EmptyState message="ยังไม่มีข้อมูลใบสั่งซื้อ" />
              ) : (
                <Table className="rounded-xl">
                  <TableHeader className="bg-[rgba(148,163,184,0.08)]">
                    <TableRow>
                      <TableHead>รหัส PO</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>วัตถุดิบ</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead>ราคารวม</TableHead>
                      <TableHead>กำหนดส่ง</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.purchaseOrders.map((item) => (
                      <TableRow key={item.poId} className={rowHoverClass}>
                        <TableCell className="font-medium">{item.poId}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.orderQty}</TableCell>
                        <TableCell>{formatCurrency(item.priceTotal)}</TableCell>
                        <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                        <TableCell>
                          <Badge variant={orderStatusVariant(item.status)} className={orderBadgeClass(item.status)}>
                            {orderStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts">
          <Card className="dashboard-panel shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>ประวัติรับสินค้า</CardTitle>
              <CardDescription>แสดงเฉพาะ PO ที่สถานะเป็น `arrived` หรือ `received` เพื่อใช้ติดตามการรับเข้า</CardDescription>
            </CardHeader>
            <CardContent>
              {data.receipts.length === 0 ? (
                <EmptyState message="ยังไม่มีประวัติรับสินค้า" />
              ) : (
                <Table className="rounded-xl">
                  <TableHeader className="bg-[rgba(148,163,184,0.08)]">
                    <TableRow>
                      <TableHead>รหัส PO</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>รายการ</TableHead>
                      <TableHead>จำนวนสั่ง</TableHead>
                      <TableHead>รับจริง</TableHead>
                      <TableHead>วันรับ/ส่ง</TableHead>
                      <TableHead>สถานะ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.receipts.map((item) => (
                      <TableRow key={item.poId} className={rowHoverClass}>
                        <TableCell className="font-medium">{item.poId}</TableCell>
                        <TableCell>{item.supplierName}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>{item.orderQty}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <PackageCheck className="h-4 w-4 text-emerald-600" />
                            <span>{item.receivedQty}</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(item.deliveryDate)}</TableCell>
                        <TableCell>
                          <Badge variant={orderStatusVariant(item.status)} className={orderBadgeClass(item.status)}>
                            {orderStatusLabel(item.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
