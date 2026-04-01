"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ClipboardCheck,
  PackageCheck,
  RefreshCw,
  Search,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDashboardDataCache } from "@/components/dashboard-data-cache";
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

type DashboardTabValue = "ingredients" | "deductions" | "alerts" | "orders" | "receipts";

type GroupedDeductionRow = {
  transactionId: string;
  itemSummary: string;
  totalQty: number;
  requestedBy: string;
  deductTime: string;
  status: StockDeductionStatus;
};

const metricIcons = {
  neutral: Boxes,
  warning: ClipboardCheck,
  danger: AlertTriangle,
  success: CheckCircle2,
} as const;

const rowHoverClass =
  "transition-colors hover:bg-[rgba(127,29,29,0.11)] hover:shadow-[inset_4px_0_0_0_rgba(185,28,28,0.94)]";

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
  if (status === "expired") {
    return "หมดอายุ";
  }

  if (status === "expiring_soon") {
    return "ใกล้หมดอายุ";
  }

  if (status === "out_of_stock") {
    return "หมดสต็อก";
  }

  if (status === "low_stock") {
    return "ใกล้หมด";
  }

  return "ปกติ";
}

function stockStatusBadgeVariant(status: IngredientStockStatus) {
  if (status === "expired" || status === "expiring_soon") {
    return "secondary";
  }

  if (status === "out_of_stock") {
    return "destructive";
  }

  if (status === "low_stock") {
    return "secondary";
  }

  return "outline";
}

function stockStatusBadgeClass(status: IngredientStockStatus) {
  if (status === "expired") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (status === "expiring_soon") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

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
    return "หมดสต็อก";
  }

  return "สต็อกต่ำ";
}

function alertTypeBadgeClass(type: LowStockAlertType) {
  if (type === "out_of_stock") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function deductionStatusLabel(status: StockDeductionStatus) {
  if (status === "approved") {
    return "อนุมัติแล้ว";
  }

  if (status === "rejected") {
    return "ปฏิเสธ";
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
    return "ส่งของแล้ว";
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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="dashboard-panel flex min-h-40 items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function NoResultState({ message }: { message: string }) {
  return (
    <div className="dashboard-panel flex min-h-28 items-center justify-center rounded-lg border border-dashed border-border/70 bg-white/70 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function TabToolbar({
  searchQuery,
  onSearchChange,
  filterValue,
  onFilterChange,
  searchPlaceholder,
  filterPlaceholder,
  options,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filterValue: string;
  onFilterChange: (value: string) => void;
  searchPlaceholder: string;
  filterPlaceholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center">
      <div className="relative w-full md:flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-10 w-full rounded-xl bg-white pl-9"
        />
      </div>
      <Select value={filterValue} onValueChange={onFilterChange}>
        <SelectTrigger className="h-10 w-full rounded-xl bg-white md:w-56">
          <SelectValue placeholder={filterPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function DashboardManager({ data, initialTab, onTabChange }: DashboardManagerProps) {
  const { dashboardData } = useDashboardDataCache();
  const source = dashboardData ?? data;
  const [activeTab, setActiveTab] = useState<DashboardTabValue>(
    (initialTab as DashboardTabValue | undefined) ?? "ingredients"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const groupedStockDeductions = useMemo(() => {
    const grouped = new Map<string, GroupedDeductionRow>();

    for (const item of source.stockDeductions) {
      const current = grouped.get(item.transactionId);
      if (current) {
        current.itemSummary = `${current.itemSummary}, ${item.itemName} x ${item.deductQty}`;
        current.totalQty += item.deductQty;
        continue;
      }

      grouped.set(item.transactionId, {
        transactionId: item.transactionId,
        itemSummary: `${item.itemName} x ${item.deductQty}`,
        totalQty: item.deductQty,
        requestedBy: item.requestedBy,
        deductTime: item.deductTime,
        status: item.status,
      });
    }

    return Array.from(grouped.values()).sort(
      (left, right) => new Date(right.deductTime).getTime() - new Date(left.deductTime).getTime()
    );
  }, [source.stockDeductions]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredIngredients = useMemo(() => {
    return source.ingredients.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.itemId.toLowerCase().includes(normalizedQuery) ||
        item.itemName.toLowerCase().includes(normalizedQuery) ||
        item.unit.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterValue === "all" || item.stockStatus === filterValue;

      return matchesQuery && matchesFilter;
    });
  }, [filterValue, normalizedQuery, source.ingredients]);

  const filteredDeductions = useMemo(() => {
    return groupedStockDeductions.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.transactionId.toLowerCase().includes(normalizedQuery) ||
        item.itemSummary.toLowerCase().includes(normalizedQuery) ||
        item.requestedBy.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterValue === "all" || item.status === filterValue;

      return matchesQuery && matchesFilter;
    });
  }, [filterValue, groupedStockDeductions, normalizedQuery]);

  const filteredAlerts = useMemo(() => {
    return source.lowStockAlerts.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.alertId.toLowerCase().includes(normalizedQuery) ||
        item.itemId.toLowerCase().includes(normalizedQuery) ||
        item.itemName.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterValue === "all" || item.alertType === filterValue;

      return matchesQuery && matchesFilter;
    });
  }, [filterValue, normalizedQuery, source.lowStockAlerts]);

  const filteredOrders = useMemo(() => {
    return source.purchaseOrders.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.poId.toLowerCase().includes(normalizedQuery) ||
        item.itemId.toLowerCase().includes(normalizedQuery) ||
        item.itemName.toLowerCase().includes(normalizedQuery) ||
        item.supplierName.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterValue === "all" || item.status === filterValue;

      return matchesQuery && matchesFilter;
    });
  }, [filterValue, normalizedQuery, source.purchaseOrders]);

  const filteredReceipts = useMemo(() => {
    return source.receipts.filter((item) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.poId.toLowerCase().includes(normalizedQuery) ||
        item.itemId.toLowerCase().includes(normalizedQuery) ||
        item.itemName.toLowerCase().includes(normalizedQuery) ||
        item.supplierName.toLowerCase().includes(normalizedQuery);
      const matchesFilter = filterValue === "all" || item.status === filterValue;

      return matchesQuery && matchesFilter;
    });
  }, [filterValue, normalizedQuery, source.receipts]);

  const toolbarConfig = useMemo(() => {
    if (activeTab === "deductions") {
      return {
        searchPlaceholder: "ค้นหาจากรหัสคำขอ ผู้ขอเบิก หรือวัตถุดิบ",
        filterPlaceholder: "กรองสถานะคำขอ",
        options: [
          { value: "all", label: "ทั้งหมด" },
          { value: "pending", label: deductionStatusLabel("pending") },
          { value: "approved", label: deductionStatusLabel("approved") },
          { value: "rejected", label: deductionStatusLabel("rejected") },
        ],
      };
    }

    if (activeTab === "alerts") {
      return {
        searchPlaceholder: "ค้นหา Alert ID รหัส หรือชื่อวัตถุดิบ",
        filterPlaceholder: "กรองประเภทแจ้งเตือน",
        options: [
          { value: "all", label: "ทั้งหมด" },
          { value: "low_stock", label: alertTypeLabel("low_stock") },
          { value: "out_of_stock", label: alertTypeLabel("out_of_stock") },
        ],
      };
    }

    if (activeTab === "orders") {
      return {
        searchPlaceholder: "ค้นหาเลขที่ PO, supplier หรือวัตถุดิบ",
        filterPlaceholder: "กรองสถานะใบสั่งซื้อ",
        options: [
          { value: "all", label: "ทั้งหมด" },
          { value: "pending", label: orderStatusLabel("pending") },
          { value: "arrived", label: orderStatusLabel("arrived") },
          { value: "received", label: orderStatusLabel("received") },
        ],
      };
    }

    if (activeTab === "receipts") {
      return {
        searchPlaceholder: "ค้นหาเลขที่ PO, supplier หรือวัตถุดิบ",
        filterPlaceholder: "กรองสถานะการรับเข้า",
        options: [
          { value: "all", label: "ทั้งหมด" },
          { value: "arrived", label: orderStatusLabel("arrived") },
          { value: "received", label: orderStatusLabel("received") },
        ],
      };
    }

    return {
      searchPlaceholder: "ค้นหาจากรหัสหรือชื่อวัตถุดิบ",
      filterPlaceholder: "กรองสถานะวัตถุดิบ",
      options: [
        { value: "all", label: "ทั้งหมด" },
        { value: "in_stock", label: stockStatusLabel("in_stock") },
        { value: "low_stock", label: stockStatusLabel("low_stock") },
        { value: "out_of_stock", label: stockStatusLabel("out_of_stock") },
        { value: "expiring_soon", label: stockStatusLabel("expiring_soon") },
        { value: "expired", label: stockStatusLabel("expired") },
      ],
    };
  }, [activeTab]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Dashboard</h1>
          <p className="text-slate-500">ภาพรวมคลัง วัตถุดิบ การตัดสต็อก และใบสั่งซื้อจากฐานข้อมูลกลาง</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-slate-300 bg-white/85 text-slate-700 shadow-sm">
            อัปเดตล่าสุด {formatDate(source.generatedAt)}
          </Badge>
          <Button variant="outline" size="sm" disabled className="bg-white/80 shadow-sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Live Snapshot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {source.metrics.map((metric) => {
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
          setActiveTab(value as DashboardTabValue);
          setSearchQuery("");
          setFilterValue("all");
          onTabChange?.(value);
        }}
        className="gap-4"
      >
        <TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-2xl bg-white/55 p-1 shadow-sm backdrop-blur">
          <TabsTrigger value="ingredients" className="w-full sm:w-auto data-[state=active]:bg-red-700 data-[state=active]:text-white">
            คลังวัตถุดิบ
          </TabsTrigger>
          <TabsTrigger value="deductions" className="w-full sm:w-auto data-[state=active]:bg-red-700 data-[state=active]:text-white">
            ประวัติตัดสต็อก
          </TabsTrigger>
          <TabsTrigger value="alerts" className="w-full sm:w-auto data-[state=active]:bg-red-700 data-[state=active]:text-white">
            วัตถุดิบใกล้หมด
          </TabsTrigger>
          <TabsTrigger value="orders" className="w-full sm:w-auto data-[state=active]:bg-red-700 data-[state=active]:text-white">
            ประวัติสั่งซื้อ
          </TabsTrigger>
          <TabsTrigger value="receipts" className="w-full sm:w-auto data-[state=active]:bg-red-700 data-[state=active]:text-white">
            ประวัติรับสินค้า
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ingredients">
          <Card className="dashboard-panel shadow-sm backdrop-blur">
            <CardHeader>
              <CardTitle>คลังวัตถุดิบ</CardTitle>
              <CardDescription>แสดงข้อมูลวัตถุดิบล่าสุดจากฐานข้อมูล พร้อมสถานะสต็อกและวันหมดอายุ</CardDescription>
            </CardHeader>
            <CardContent>
              <TabToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                searchPlaceholder={toolbarConfig.searchPlaceholder}
                filterPlaceholder={toolbarConfig.filterPlaceholder}
                options={toolbarConfig.options}
              />
              {source.ingredients.length === 0 ? (
                <EmptyState message="ยังไม่มีข้อมูลวัตถุดิบในระบบ" />
              ) : filteredIngredients.length === 0 ? (
                <NoResultState message="ไม่พบรายการวัตถุดิบที่ตรงกับคำค้นหาหรือเงื่อนไขที่เลือก" />
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
                    {filteredIngredients.map((item) => (
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
              <CardTitle>ประวัติการตัดสต็อก</CardTitle>
              <CardDescription>รวมคำขอเบิก การอนุมัติ และผลการตัดสต็อกจาก StockDeduction</CardDescription>
            </CardHeader>
            <CardContent>
              <TabToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                searchPlaceholder={toolbarConfig.searchPlaceholder}
                filterPlaceholder={toolbarConfig.filterPlaceholder}
                options={toolbarConfig.options}
              />
              {groupedStockDeductions.length === 0 ? (
                <EmptyState message="ยังไม่มีประวัติการตัดสต็อก" />
              ) : filteredDeductions.length === 0 ? (
                <NoResultState message="ไม่พบประวัติการตัดสต๊อกที่ตรงกับคำค้นหาหรือเงื่อนไขที่เลือก" />
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
                    {filteredDeductions.map((item) => (
                      <TableRow key={`${item.transactionId}-${item.deductTime}`} className={rowHoverClass}>
                        <TableCell className="font-medium">{item.transactionId}</TableCell>
                        <TableCell>{item.itemSummary}</TableCell>
                        <TableCell>{item.totalQty}</TableCell>
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
              <CardDescription>รายการแจ้งเตือนจาก LowStockAlert สำหรับติดตามสต็อกต่ำและหมดสต็อก</CardDescription>
            </CardHeader>
            <CardContent>
              <TabToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                searchPlaceholder={toolbarConfig.searchPlaceholder}
                filterPlaceholder={toolbarConfig.filterPlaceholder}
                options={toolbarConfig.options}
              />
              {source.lowStockAlerts.length === 0 ? (
                <EmptyState message="ยังไม่มีรายการแจ้งเตือน" />
              ) : filteredAlerts.length === 0 ? (
                <NoResultState message="ไม่พบรายการแจ้งเตือนที่ตรงกับคำค้นหาหรือเงื่อนไขที่เลือก" />
              ) : (
                <Table className="rounded-xl">
                  <TableHeader className="bg-[rgba(148,163,184,0.08)]">
                    <TableRow>
                      <TableHead>Alert ID</TableHead>
                      <TableHead>วัตถุดิบ</TableHead>
                      <TableHead>ประเภท</TableHead>
                      <TableHead>จำนวน</TableHead>
                      <TableHead>เวลาแจ้งเตือน</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAlerts.map((item) => (
                      <TableRow key={item.alertId} className={rowHoverClass}>
                        <TableCell className="font-medium">{item.alertId}</TableCell>
                        <TableCell>{item.itemName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={alertTypeBadgeClass(item.alertType)}>
                            {alertTypeLabel(item.alertType)}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.alertQty}</TableCell>
                        <TableCell>{formatDate(item.alertTime)}</TableCell>
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
              <CardDescription>สรุปรายการ PO ล่าสุด พร้อม supplier สถานะ และยอดรวม</CardDescription>
            </CardHeader>
            <CardContent>
              <TabToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                searchPlaceholder={toolbarConfig.searchPlaceholder}
                filterPlaceholder={toolbarConfig.filterPlaceholder}
                options={toolbarConfig.options}
              />
              {source.purchaseOrders.length === 0 ? (
                <EmptyState message="ยังไม่มีข้อมูลใบสั่งซื้อ" />
              ) : filteredOrders.length === 0 ? (
                <NoResultState message="ไม่พบรายการใบสั่งซื้อที่ตรงกับคำค้นหาหรือเงื่อนไขที่เลือก" />
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
                    {filteredOrders.map((item) => (
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
              <CardDescription>แสดงเฉพาะ PO ที่อยู่ในสถานะส่งของแล้วหรือรับเข้าแล้วเพื่อติดตามการรับเข้า</CardDescription>
            </CardHeader>
            <CardContent>
              <TabToolbar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                filterValue={filterValue}
                onFilterChange={setFilterValue}
                searchPlaceholder={toolbarConfig.searchPlaceholder}
                filterPlaceholder={toolbarConfig.filterPlaceholder}
                options={toolbarConfig.options}
              />
              {source.receipts.length === 0 ? (
                <EmptyState message="ยังไม่มีประวัติรับสินค้า" />
              ) : filteredReceipts.length === 0 ? (
                <NoResultState message="ไม่พบประวัติรับสินค้าที่ตรงกับคำค้นหาหรือเงื่อนไขที่เลือก" />
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
                    {filteredReceipts.map((item) => (
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
