"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, CheckCheck, Clock3, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardDataCache } from "@/components/dashboard-data-cache";
import { useManagerDataCache } from "@/components/manager-data-cache";
import type { ManagerIngredientRow, ManagerPhaseData } from "@/lib/types/manager";

function isExpired(dateString: string) {
  return new Date(dateString).getTime() < Date.now();
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date(value));
}

function defaultThreshold(item: ManagerIngredientRow) {
  return item.alertThreshold;
}

export function SetUpNotifications({ data }: { data: ManagerPhaseData | null }) {
  const { managerData, updateManagerData } = useManagerDataCache();
  const { updateDashboardData } = useDashboardDataCache();
  const [thresholds, setThresholds] = useState<Record<string, number>>(
    () => Object.fromEntries((data?.ingredients ?? []).map((item) => [item.itemId, defaultThreshold(item)]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const ingredients = managerData?.ingredients ?? data?.ingredients ?? [];

  useEffect(() => {
    setThresholds(
      Object.fromEntries(ingredients.map((item) => [item.itemId, item.alertThreshold]))
    );
  }, [ingredients]);

  const summary = useMemo(() => {
    const expiredCount = ingredients.filter((item) => isExpired(item.expiryDate)).length;
    const lowCount = ingredients.filter(
      (item) => item.currentQty <= (thresholds[item.itemId] ?? defaultThreshold(item))
    ).length;

    return {
      normalCount: Math.max(ingredients.length - lowCount - expiredCount, 0),
      lowCount,
      expiredCount,
    };
  }, [ingredients, thresholds]);

  const saveThresholds = async () => {
    try {
      setIsSubmitting(true);
      const response = await fetch("/api/ingredients/thresholds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thresholds: ingredients.map((item) => ({
            itemId: item.itemId,
            alertThreshold: thresholds[item.itemId] ?? defaultThreshold(item),
          })),
        }),
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const processedItemIds = new Set<string>((payload.items ?? []).map((item: { itemId: string }) => item.itemId));
      const nextDashboardAlerts = (payload.alerts ?? []).map((item: {
        alertId: string;
        itemId: string;
        alertType: "low_stock" | "out_of_stock";
        alertQty: number;
        alertTime: string;
      }) => {
        const ingredient = ingredients.find((row) => row.itemId === item.itemId);
        return {
          alertId: item.alertId,
          itemId: item.itemId,
          itemName: ingredient?.itemName ?? item.itemId,
          alertType: item.alertType,
          alertQty: item.alertQty,
          alertTime: item.alertTime,
        };
      });

      updateManagerData((current) => {
        if (!current) return current;
        const nextAlerts = (payload.alerts ?? []).map((item: {
          alertId: string;
          itemId: string;
          alertType: "low_stock" | "out_of_stock";
          alertQty: number;
          alertTime: string;
        }) => {
          const ingredient = current.ingredients.find((row) => row.itemId === item.itemId);
          return {
            alertId: item.alertId,
            itemId: item.itemId,
            itemName: ingredient?.itemName ?? item.itemId,
            unit: ingredient?.unit ?? "-",
            currentQty: ingredient?.currentQty ?? item.alertQty,
            alertType: item.alertType,
            alertQty: item.alertQty,
            alertTime: item.alertTime,
          };
        });

        return {
          ...current,
          ingredients: current.ingredients.map((item) => ({
            ...item,
            alertThreshold: thresholds[item.itemId] ?? item.alertThreshold,
          })),
          alerts: [
            ...nextAlerts,
            ...current.alerts.filter((item) => !processedItemIds.has(item.itemId)),
          ],
        };
      });
      updateDashboardData((current) => {
        const allLowStockAlerts = [
          ...nextDashboardAlerts,
          ...current.lowStockAlerts.filter((item) => !processedItemIds.has(item.itemId)),
        ].sort((left, right) => new Date(right.alertTime).getTime() - new Date(left.alertTime).getTime());
        const mergedLowStockAlerts = allLowStockAlerts.slice(0, 6);

        return {
          ...current,
          lowStockAlerts: mergedLowStockAlerts,
          highlight: {
            ...current.highlight,
            lowStockAlerts: allLowStockAlerts.length,
          },
          metrics: current.metrics.map((metric) =>
            metric.key === "alerts"
              ? {
                  ...metric,
                  value: allLowStockAlerts.length,
                  tone: allLowStockAlerts.length > 0 ? "danger" : "success",
                }
              : metric
          ),
          generatedAt: new Date().toISOString(),
        };
      });
      setIsSaved(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!data) {
    return <section className="dashboard-panel rounded-2xl border p-6 text-sm text-slate-500">ยังไม่มีข้อมูลแจ้งเตือน</section>;
  }

  return (
    <section className="space-y-6">
      {summary.lowCount > 0 ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-900">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>มีวัตถุดิบต่ำกว่าค่าแจ้งเตือน</AlertTitle>
          <AlertDescription>
            พบ {summary.lowCount} รายการที่ควรติดตามและอาจต้องวางแผนสั่งซื้อหรือเติมคลังเพิ่ม
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-emerald-200 bg-emerald-50/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-emerald-700">สถานะปกติ</CardDescription>
              <CardTitle className="mt-2 text-3xl text-emerald-900">{summary.normalCount}</CardTitle>
            </div>
            <CheckCheck className="h-10 w-10 rounded-2xl bg-white p-2 text-emerald-700 shadow-sm" />
          </CardHeader>
        </Card>
        <Card className="border-amber-200 bg-amber-50/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-amber-700">ต่ำกว่าค่าแจ้งเตือน</CardDescription>
              <CardTitle className="mt-2 text-3xl text-amber-900">{summary.lowCount}</CardTitle>
            </div>
            <BellRing className="h-10 w-10 rounded-2xl bg-white p-2 text-amber-700 shadow-sm" />
          </CardHeader>
        </Card>
        <Card className="border-red-200 bg-red-50/80 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardDescription className="text-red-700">หมดอายุแล้ว</CardDescription>
              <CardTitle className="mt-2 text-3xl text-red-900">{summary.expiredCount}</CardTitle>
            </div>
            <Clock3 className="h-10 w-10 rounded-2xl bg-white p-2 text-red-700 shadow-sm" />
          </CardHeader>
        </Card>
      </div>

      <Card className="dashboard-panel rounded-2xl border">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>ตั้งค่าแจ้งเตือนรายวัตถุดิบ</CardTitle>
            <CardDescription>ปรับค่า threshold รายแถว และบันทึกลงฐานข้อมูลจริงด้วยปุ่มเดียว</CardDescription>
          </div>
          <Button onClick={() => void saveThresholds()} className={`${isSaved ? 'bg-emerald-700 text-white hover:bg-emerald-800' : 'bg-sky-700 text-white hover:bg-sky-800'}`} disabled={isSubmitting}>
            {isSubmitting ? "กำลังบันทึก..." : isSaved ? "บันทึกการตั้งค่าแล้ว" : "บันทึกทั้งหมด"}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead>รหัส</TableHead>
                <TableHead>วัตถุดิบ</TableHead>
                <TableHead>คงเหลือ</TableHead>
                <TableHead>หน่วย</TableHead>
                <TableHead>ค่าแจ้งเตือน</TableHead>
                <TableHead>วันหมดอายุ</TableHead>
                <TableHead>สถานะ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ingredients.map((item, index) => {
                const threshold = thresholds[item.itemId] ?? defaultThreshold(item);
                const expired = isExpired(item.expiryDate);
                const low = item.currentQty <= threshold;

                return (
                  <TableRow key={`${item.itemId}-${index}`} className="transition-colors hover:bg-red-100/90">
                    <TableCell className="font-medium">{item.itemId}</TableCell>
                    <TableCell>{item.itemName}</TableCell>
                    <TableCell>{item.currentQty}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        value={threshold}
                        onChange={(event) => {
                          setIsSaved(false);
                          setThresholds((current) => ({
                            ...current,
                            [item.itemId]: Number(event.target.value),
                          }));
                        }}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>{formatDate(item.expiryDate)}</TableCell>
                    <TableCell>
                      {expired ? (
                        <Badge className="border-red-200 bg-red-50 text-red-700">หมดอายุ</Badge>
                      ) : low ? (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">เตือนต่ำกว่ากำหนด</Badge>
                      ) : (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">ปกติ</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
