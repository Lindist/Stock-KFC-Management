"use client";

import { useMemo, useState } from "react";
import { CalendarRange, Download, FileBarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ReportType } from "@/lib/types/dashboard";
import type { ManagerIngredientRow, ManagerPhaseData, ManagerPurchaseOrderRow, ManagerStockDeductionRow } from "@/lib/types/manager";

type ReportPeriod = "year" | "month" | "week" | "day" | "custom";

type StockSummaryRecord = {
  key: string;
  primary: string;
  secondary: string;
  metricA: string;
  metricB: string;
  metricC: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB" }).format(value);
}

function toStockRows(items: ManagerIngredientRow[]): StockSummaryRecord[] {
  return items.map((item) => ({
    key: item.itemId,
    primary: item.itemName,
    secondary: item.itemId,
    metricA: `${item.currentQty} ${item.unit}`,
    metricB: item.stockStatus,
    metricC: formatDate(item.expiryDate),
  }));
}

function toDeductionRows(items: ManagerStockDeductionRow[]): StockSummaryRecord[] {
  return items.map((item, index) => ({
    key: `${item.transactionId}-${index}`,
    primary: item.itemName,
    secondary: item.transactionId,
    metricA: `${item.deductQty}`,
    metricB: item.status,
    metricC: formatDate(item.deductTime),
  }));
}

function toPurchaseRows(items: ManagerPurchaseOrderRow[]): StockSummaryRecord[] {
  return items.map((item, index) => ({
    key: `${item.poId}-${index}`,
    primary: item.itemName,
    secondary: item.poId,
    metricA: `${item.orderQty} ${item.unit}`,
    metricB: item.status,
    metricC: formatCurrency(item.priceTotal),
  }));
}

export function StockReport({ data }: { data: ManagerPhaseData | null }) {
  const [reportType, setReportType] = useState<ReportType>("stock_summary");
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().slice(0, 10));
  const [dateTo, setDateTo] = useState(new Date().toISOString().slice(0, 10));
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const reportRows = useMemo(() => {
    if (!data) return [];
    if (reportType === "stock_deduction") return toDeductionRows(data.stockDeductions);
    if (reportType === "purchase_order") return toPurchaseRows(data.purchaseOrders);
    return toStockRows(data.ingredients);
  }, [data, reportType]);

  const generateReport = () => {
    setGeneratedAt(new Date().toISOString());
  };

  const downloadReport = () => {
    const payload = {
      reportType,
      period,
      dateFrom,
      dateTo,
      generatedAt: new Date().toISOString(),
      rows: reportRows,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${reportType}-${dateFrom}-${dateTo}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลรายงาน</section>;
  }

  return (
    <section className="space-y-6">
      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader>
          <CardTitle>รายงานสต็อกและการจัดซื้อ</CardTitle>
          <CardDescription>เลือกประเภท ช่วงเวลา และสร้าง snapshot รายงานเพื่อดูบนหน้าจอหรือดาวน์โหลดออกไป</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-5">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">ประเภทรายงาน</p>
              <Select value={reportType} onValueChange={(value) => setReportType(value as ReportType)}>
                <SelectTrigger>
                  <SelectValue placeholder="ประเภทรายงาน" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stock_summary">สรุปสต็อก</SelectItem>
                  <SelectItem value="stock_deduction">ประวัติตัดสต็อก</SelectItem>
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
              <Input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">วันที่สิ้นสุด</p>
              <Input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={generateReport} className="flex-1">
                <FileBarChart2 className="mr-2 h-4 w-4" />
                แสดงรายงาน
              </Button>
              <Button variant="outline" onClick={downloadReport} className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                ดาวน์โหลด
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-red-200 bg-red-50/80 shadow-sm">
              <CardHeader className="space-y-1">
                <CardDescription className="text-red-700">ประเภทรายงาน</CardDescription>
                <CardTitle className="text-xl text-red-950">{reportType}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
              <CardHeader className="space-y-1">
                <CardDescription className="text-amber-700">ช่วงเวลาที่เลือก</CardDescription>
                <CardTitle className="text-xl text-amber-950">{period}</CardTitle>
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
                <CardDescription>แสดง snapshot ตามประเภทที่เลือกในรูปแบบตาราง</CardDescription>
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
                    <TableHead>หัวข้อหลัก</TableHead>
                    <TableHead>อ้างอิง</TableHead>
                    <TableHead>ค่า 1</TableHead>
                    <TableHead>ค่า 2</TableHead>
                    <TableHead>ค่า 3</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportRows.map((row) => (
                    <TableRow key={row.key} className="hover:bg-red-50/30">
                      <TableCell className="font-medium">{row.primary}</TableCell>
                      <TableCell>{row.secondary}</TableCell>
                      <TableCell>{row.metricA}</TableCell>
                      <TableCell>{row.metricB}</TableCell>
                      <TableCell>{row.metricC}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </section>
  );
}
