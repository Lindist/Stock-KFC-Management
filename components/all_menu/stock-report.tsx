"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarRange, FileBarChart2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManagerDataCache } from "@/components/manager-data-cache";
import type { ReportType } from "@/lib/types/dashboard";
import type { ManagerIngredientRow, ManagerPhaseData, ManagerPurchaseOrderRow, ManagerStockDeductionRow } from "@/lib/types/manager";

type ReportPeriod = "year" | "month" | "week" | "day" | "custom";

type ReportRow = {
  key: string;
  createdAt: string;
  primary: string;
  secondary: string;
  metricA: string;
  metricB: string;
  metricC: string;
};

function toDateInputValue(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateInput(value: string, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function getPeriodRange(period: ReportPeriod, anchor: Date) {
  const start = new Date(anchor);
  const end = new Date(anchor);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === "day") {
    return { start, end };
  }

  if (period === "week") {
    const dayOfWeek = start.getDay();
    start.setDate(start.getDate() - dayOfWeek);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  if (period === "month") {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
    return { start, end };
  }

  if (period === "year") {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
    return { start, end };
  }

  return { start, end };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

function translateStockStatus(status: string) {
  if (status === "expired") return "หมดอายุ";
  if (status === "expiring_soon") return "ใกล้หมดอายุ";
  if (status === "out_of_stock") return "หมดสต็อก";
  if (status === "low_stock") return "ใกล้หมด";
  if (status === "in_stock") return "ปกติ";
  return status;
}

function translateDeductionStatus(status: string) {
  if (status === "approved") return "อนุมัติแล้ว";
  if (status === "rejected") return "ปฏิเสธ";
  if (status === "pending") return "รออนุมัติ";
  return status;
}

function translateReportType(reportType: ReportType) {
  if (reportType === "stock_deduction") return "ประวัติตัดสต็อก";
  if (reportType === "purchase_order") return "ประวัติสั่งซื้อ";
  return "สรุปสต็อก";
}

function translatePeriod(period: ReportPeriod) {
  if (period === "year") return "ปีนี้";
  if (period === "month") return "เดือนนี้";
  if (period === "week") return "สัปดาห์นี้";
  if (period === "day") return "วันนี้";
  return "กำหนดเอง";
}

function toStockRows(items: ManagerIngredientRow[]): ReportRow[] {
  return items.map((item) => ({
    key: item.itemId,
    createdAt: item.createdAt,
    primary: item.itemId,
    secondary: item.itemName,
    metricA: `${item.currentQty} ${item.unit}`,
    metricB: translateStockStatus(item.stockStatus),
    metricC: formatDate(item.expiryDate),
  }));
}

function toDeductionRows(items: ManagerStockDeductionRow[]): ReportRow[] {
  return items.map((item, index) => ({
    key: `${item.transactionId}-${index}`,
    createdAt: item.createdAt,
    primary: item.transactionId,
    secondary: item.itemName,
    metricA: `${item.deductQty}`,
    metricB: item.requestedBy,
    metricC: translateDeductionStatus(item.status),
  }));
}

function toPurchaseRows(items: ManagerPurchaseOrderRow[]): ReportRow[] {
  return items
    .filter((item) => item.status === "received")
    .map((item, index) => ({
    key: `${item.poId}-${index}`,
    createdAt: item.createdAt,
    primary: item.poId,
    secondary: item.itemName,
    metricA: `${item.orderQty} ${item.unit}`,
    metricB: item.supplierName,
    metricC: formatCurrency(item.priceTotal),
    }));
}

function getColumnLabels(reportType: ReportType) {
  if (reportType === "stock_deduction") {
    return ["เลขที่คำขอ", "วัตถุดิบ", "จำนวนเบิก", "ผู้ขอเบิก", "สถานะ"];
  }
  if (reportType === "purchase_order") {
    return ["เลขที่ PO", "วัตถุดิบ", "จำนวนสั่ง", "Supplier", "ยอดรวม"];
  }
  return ["รหัสวัตถุดิบ", "ชื่อวัตถุดิบ", "คงเหลือ", "สถานะ", "วันหมดอายุ"];
}

export function StockReport({ data }: { data: ManagerPhaseData | null }) {
  const { managerData } = useManagerDataCache();
  const [reportType, setReportType] = useState<ReportType>("stock_summary");
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const source = managerData ?? data;

  const baseRows = useMemo(() => {
    if (!source) return [];
    if (reportType === "stock_deduction") return toDeductionRows(source.stockDeductions);
    if (reportType === "purchase_order") return toPurchaseRows(source.purchaseOrders);
    return toStockRows(source.ingredients);
  }, [reportType, source]);

  useEffect(() => {
    if (period === "custom") {
      return;
    }

    const { start, end } = getPeriodRange(period, new Date());
    setDateFrom(toDateInputValue(start));
    setDateTo(toDateInputValue(end));
  }, [period]);

  const reportRows = useMemo(() => {
    const startDate = parseDateInput(dateFrom);
    const endDate = parseDateInput(dateTo, true);

    return baseRows.filter((row) => {
      const createdAt = new Date(row.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }

      if (startDate && createdAt < startDate) {
        return false;
      }

      if (endDate && createdAt > endDate) {
        return false;
      }

      return true;
    });
  }, [baseRows, dateFrom, dateTo]);

  const columnLabels = getColumnLabels(reportType);

  const generateReport = () => {
    setGeneratedAt(new Date().toISOString());
  };

  const printReport = () => {
    const printWindow = window.open("", "_blank", "width=1080,height=800");
    if (!printWindow) return;

    const rows = reportRows
      .map(
        (row) => `
          <tr>
            <td>${row.primary}</td>
            <td>${row.secondary}</td>
            <td>${row.metricA}</td>
            <td>${row.metricB}</td>
            <td>${row.metricC}</td>
          </tr>
        `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
            h1 { margin-bottom: 8px; }
            p { color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            th { background: #fee2e2; }
          </style>
        </head>
        <body>
          <h1>รายงาน ${translateReportType(reportType)}</h1>
          <p>ช่วงเวลา ${dateFrom} ถึง ${dateTo}</p>
          <table>
            <thead>
              <tr>
                <th>${columnLabels[0]}</th>
                <th>${columnLabels[1]}</th>
                <th>${columnLabels[2]}</th>
                <th>${columnLabels[3]}</th>
                <th>${columnLabels[4]}</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลรายงาน</section>;
  }

  return (
    <section className="space-y-6">
      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader>
          <CardTitle>รายงานสต็อกและการจัดซื้อ</CardTitle>
          <CardDescription>เลือกประเภท ช่วงเวลา และแสดงรายงานบนหน้าจอพร้อมพิมพ์เอกสารออกมาได้ทันที</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ประเภทรายงาน</p>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทรายงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_summary">สรุปสต็อก</SelectItem>
                  <SelectItem value="stock_deduction">ประวัติสต็อก</SelectItem>
                  <SelectItem value="purchase_order">ประวัติสั่งซื้อ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ช่วงเวลา</p>
              <Select value={period} onValueChange={(value) => setPeriod(value as ReportPeriod)}>
                <SelectTrigger>
                  <SelectValue placeholder="ช่วงเวลา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">ปีนี้</SelectItem>
                  <SelectItem value="month">เดือนนี้</SelectItem>
                  <SelectItem value="week">สัปดาห์นี้</SelectItem>
                  <SelectItem value="day">วันนี้</SelectItem>
                  <SelectItem value="custom">กำหนดเอง</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">วันที่เริ่มต้น</p>
              <Input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                disabled={period !== "custom"}
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">วันที่สิ้นสุด</p>
              <Input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                disabled={period !== "custom"}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row xl:flex-nowrap xl:items-end">
              <Button onClick={generateReport} className="bg-sky-700 text-white hover:bg-sky-800">
                <FileBarChart2 className="mr-2 h-4 w-4" />
                แสดงรายงาน
              </Button>
              <Button onClick={printReport} className="bg-emerald-700 text-white hover:bg-emerald-800">
                <Printer className="mr-2 h-4 w-4" />
                พิมพ์รายงาน
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 bg-red-50/80 shadow-sm">
              <CardHeader className="space-y-1">
                <CardDescription className="text-red-700">ประเภทรายงาน</CardDescription>
                <CardTitle className="text-xl text-red-950">{translateReportType(reportType)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
              <CardHeader className="space-y-1">
                <CardDescription className="text-amber-700">ช่วงเวลาที่เลือก</CardDescription>
                <CardTitle className="text-xl text-amber-950">{translatePeriod(period)}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/80 shadow-sm">
              <CardHeader className="space-y-1">
                <CardDescription className="text-emerald-700">สร้างล่าสุด</CardDescription>
                <CardTitle className="text-base text-emerald-950">
                  {generatedAt ? formatDate(generatedAt) : "ยังไม่ได้สร้าง"}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card className="border-slate-200 bg-white/90 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">ตัวอย่างข้อมูลรายงาน</CardTitle>
                <CardDescription>หัวตารางจะเปลี่ยนตามประเภทรายงานที่เลือก</CardDescription>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600">
                <CalendarRange className="h-4 w-4" />
                {dateFrom} ถึง {dateTo}
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader className="bg-slate-50/90">
                  <TableRow>
                    <TableHead>{columnLabels[0]}</TableHead>
                    <TableHead>{columnLabels[1]}</TableHead>
                    <TableHead>{columnLabels[2]}</TableHead>
                    <TableHead>{columnLabels[3]}</TableHead>
                    <TableHead>{columnLabels[4]}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportRows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-sm text-slate-500">
                        ไม่มีรายการรายงาน
                      </TableCell>
                    </TableRow>
                  ) : (
                    reportRows.map((row) => (
                      <TableRow key={row.key} className="transition-colors hover:bg-red-100/90">
                        <TableCell className="font-medium">{row.primary}</TableCell>
                        <TableCell>{row.secondary}</TableCell>
                        <TableCell>{row.metricA}</TableCell>
                        <TableCell>{row.metricB}</TableCell>
                        <TableCell>{row.metricC}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
