"use client";

import { useMemo, useState } from "react";
import { BellRing, CheckCheck, Clock3, TriangleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const [ingredients, setIngredients] = useState<ManagerIngredientRow[]>(data?.ingredients ?? []);
  const [thresholds, setThresholds] = useState<Record<string, number>>(
    () => Object.fromEntries((data?.ingredients ?? []).map((item) => [item.itemId, defaultThreshold(item)]))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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

      setIngredients((current) =>
        current.map((item) => ({
          ...item,
          alertThreshold: thresholds[item.itemId] ?? item.alertThreshold,
        }))
      );
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
          <Button onClick={() => void saveThresholds()} className="bg-sky-700 text-white hover:bg-sky-800" disabled={isSubmitting}>
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
                  <TableRow key={`${item.itemId}-${index}`} className="transition-colors hover:bg-red-50/60">
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
