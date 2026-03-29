"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ClipboardList, Package, ShoppingCart, TriangleAlert, X } from "lucide-react";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardDataCache } from "@/components/dashboard-data-cache";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDate(value: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value)
  );
}

function formatAlertType(value: string) {
  if (value === "low_stock") return "วัตถุดิบใกล้หมด";
  if (value === "out_of_stock") return "วัตถุดิบหมดสต็อก";
  if (value === "expiry") return "วัตถุดิบใกล้หมดอายุ";
  return value;
}

function buildStorageKey(prefix: string, data: GlobalDashboardData, count: number) {
  return `${prefix}:${data.generatedAt}:${count}`;
}

export function NotificationsBanner({
  data,
  onOpenDashboardTab,
}: {
  data: GlobalDashboardData;
  onOpenDashboardTab: (tab: string) => void;
}) {
  const { dashboardData } = useDashboardDataCache();
  const source = dashboardData ?? data;
  const approvalCount = useMemo(() => source.highlight.pendingDeductionApprovals, [source.highlight]);
  const purchaseOrderCount = useMemo(() => source.highlight.pendingPurchaseOrders, [source.highlight]);
  const lowThresholdCount = useMemo(() => source.highlight.lowStockAlerts, [source.highlight]);
  const expiryCount = useMemo(
    () => source.highlight.expiringIngredients + source.highlight.expiredIngredients,
    [source.highlight]
  );
  const [dismissApproval, setDismissApproval] = useState(true);
  const [dismissPurchaseOrders, setDismissPurchaseOrders] = useState(true);
  const [dismissLowThreshold, setDismissLowThreshold] = useState(true);
  const [dismissExpiry, setDismissExpiry] = useState(true);
  const approvalStorageKey = buildStorageKey("approval-notifications", source, approvalCount);
  const purchaseOrderStorageKey = buildStorageKey("purchase-order-notifications", source, purchaseOrderCount);
  const lowThresholdStorageKey = buildStorageKey("low-threshold-notifications", source, lowThresholdCount);
  const expiryStorageKey = buildStorageKey("expiry-notifications", source, expiryCount);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissApproval(
      approvalCount <= 0 || window.sessionStorage.getItem(approvalStorageKey) === "dismissed"
    );
    setDismissPurchaseOrders(
      purchaseOrderCount <= 0 || window.sessionStorage.getItem(purchaseOrderStorageKey) === "dismissed"
    );
    setDismissLowThreshold(
      lowThresholdCount <= 0 || window.sessionStorage.getItem(lowThresholdStorageKey) === "dismissed"
    );
    setDismissExpiry(expiryCount <= 0 || window.sessionStorage.getItem(expiryStorageKey) === "dismissed");
  }, [
    approvalCount,
    approvalStorageKey,
    expiryCount,
    expiryStorageKey,
    lowThresholdCount,
    lowThresholdStorageKey,
    purchaseOrderCount,
    purchaseOrderStorageKey,
  ]);

  const closeApprovalBanner = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(approvalStorageKey, "dismissed");
    }
    setDismissApproval(true);
  };

  const closePurchaseOrderBanner = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(purchaseOrderStorageKey, "dismissed");
    }
    setDismissPurchaseOrders(true);
  };

  const closeLowThresholdBanner = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(lowThresholdStorageKey, "dismissed");
    }
    setDismissLowThreshold(true);
  };

  const closeExpiryBanner = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(expiryStorageKey, "dismissed");
    }
    setDismissExpiry(true);
  };

  return (
    <>
      {approvalCount > 0 && !dismissApproval ? (
        <Alert className="dashboard-panel border-red-200 bg-gradient-to-r from-red-50 via-white to-amber-50 text-red-950 shadow-sm">
          <TriangleAlert className="h-4 w-4 text-red-600" />
          <AlertTitle>มีคำขอรออนุมัติ</AlertTitle>
          <AlertDescription>
            มีคำขอรออนุมัติ {approvalCount} รายการที่ควรตรวจสอบและตัดสินใจในระบบ
          </AlertDescription>
          <AlertAction className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => onOpenDashboardTab("deductions")}
            >
              ดูรายละเอียด
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
              onClick={closeApprovalBanner}
              aria-label="ปิดแจ้งเตือนคำขออนุมัติ"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {purchaseOrderCount > 0 && !dismissPurchaseOrders ? (
        <Alert className="dashboard-panel border-sky-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 text-sky-950 shadow-sm">
          <ShoppingCart className="h-4 w-4 text-sky-600" />
          <AlertTitle>มีใบสั่งซื้อรอติดตาม</AlertTitle>
          <AlertDescription>
            มีใบสั่งซื้อรอติดตาม {purchaseOrderCount} รายการที่ควรตรวจสอบสถานะการรับเข้า
          </AlertDescription>
          <AlertAction className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-sky-600 text-white hover:bg-sky-700"
              onClick={() => onOpenDashboardTab("orders")}
            >
              ดูรายการ
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
              onClick={closePurchaseOrderBanner}
              aria-label="ปิดแจ้งเตือนใบสั่งซื้อ"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {lowThresholdCount > 0 && !dismissLowThreshold ? (
        <Alert className="dashboard-panel border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50 text-amber-950 shadow-sm">
          <Package className="h-4 w-4 text-amber-600" />
          <AlertTitle>มีวัตถุดิบต่ำกว่าค่าแจ้งเตือน</AlertTitle>
          <AlertDescription>
            พบ {lowThresholdCount} รายการที่ควรติดตามและอาจต้องวางแผนสั่งซื้อหรือเติมคลังเพิ่ม
          </AlertDescription>
          <AlertAction className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => onOpenDashboardTab("alerts")}
            >
              ดูรายการ
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
              onClick={closeLowThresholdBanner}
              aria-label="ปิดแจ้งเตือนวัตถุดิบต่ำกว่าค่ากำหนด"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      {expiryCount > 0 && !dismissExpiry ? (
        <Alert className="dashboard-panel border-violet-200 bg-gradient-to-r from-violet-50 via-white to-rose-50 text-violet-950 shadow-sm">
          <Package className="h-4 w-4 text-violet-600" />
          <AlertTitle>มีวัตถุดิบใกล้หมดอายุหรือหมดอายุ</AlertTitle>
          <AlertDescription>
            พบวัตถุดิบใกล้หมดอายุ {source.highlight.expiringIngredients} รายการ และหมดอายุแล้ว {source.highlight.expiredIngredients} รายการ
          </AlertDescription>
          <AlertAction className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-violet-600 text-white hover:bg-violet-700"
              onClick={() => onOpenDashboardTab("ingredients")}
            >
              ดูรายการ
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
              onClick={closeExpiryBanner}
              aria-label="ปิดแจ้งเตือนวันหมดอายุ"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertAction>
        </Alert>
      ) : null}
    </>
  );
}

export function ManagerNotifications({
  data,
  onOpenDashboardTab,
}: {
  data: GlobalDashboardData;
  onOpenDashboardTab: (tab: string) => void;
}) {
  const { dashboardData } = useDashboardDataCache();
  const source = dashboardData ?? data;
  const badgeCount = useMemo(() => {
    return (
      source.highlight.lowStockAlerts +
      source.highlight.pendingDeductionApprovals +
      source.highlight.pendingPurchaseOrders +
      source.highlight.expiringIngredients +
      source.highlight.expiredIngredients
    );
  }, [source.highlight]);

  const latestAlerts = source.lowStockAlerts.slice(0, 4);
  const latestExpiryAlerts = source.expiryAlerts.slice(0, 4);
  const latestApprovals = source.stockDeductions.filter((item) => item.status === "pending").slice(0, 4);
  const latestOrders = source.purchaseOrders.slice(0, 4);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative cursor-pointer rounded-full p-1.5 hover:bg-slate-100">
        <Bell className="h-5 w-5 text-slate-500" />
        {badgeCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[360px] rounded-xl shadow-lg">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>แจ้งเตือน</span>
          <Badge variant="outline">อัปเดต {formatDate(source.generatedAt)}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Package className="h-4 w-4" />
          วัตถุดิบใกล้หมด
        </DropdownMenuLabel>
        {latestAlerts.length === 0 ? (
          <DropdownMenuItem disabled>ไม่มีแจ้งเตือนล่าสุด</DropdownMenuItem>
        ) : (
          latestAlerts.map((item, index) => (
            <DropdownMenuItem
              key={`${item.alertId}-${item.alertTime}-${index}`}
              onSelect={() => onOpenDashboardTab("alerts")}
              className="flex flex-col items-start gap-0.5"
            >
              <div className="text-sm font-medium">{item.itemName}</div>
              <div className="text-xs text-muted-foreground">
                {formatAlertType(item.alertType)} เมื่อ {formatDate(item.alertTime)}
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <Package className="h-4 w-4" />
          วัตถุดิบใกล้หมดอายุ
        </DropdownMenuLabel>
        {latestExpiryAlerts.length === 0 ? (
          <DropdownMenuItem disabled>ไม่มีแจ้งเตือนวันหมดอายุ</DropdownMenuItem>
        ) : (
          latestExpiryAlerts.map((item, index) => (
            <DropdownMenuItem
              key={`${item.itemId}-${item.expiryDate}-${index}`}
              onSelect={() => onOpenDashboardTab("ingredients")}
              className="flex flex-col items-start gap-0.5"
            >
              <div className="text-sm font-medium">{item.itemName}</div>
              <div className="text-xs text-muted-foreground">
                {item.stockStatus === "expired" ? "หมดอายุแล้ว" : "ใกล้หมดอายุ"} เมื่อ {formatDate(item.expiryDate)}
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          คำขอเบิกที่รออนุมัติ
        </DropdownMenuLabel>
        {latestApprovals.length === 0 ? (
          <DropdownMenuItem disabled>ไม่มีคำขอรออนุมัติ</DropdownMenuItem>
        ) : (
          latestApprovals.map((item, index) => (
            <DropdownMenuItem
              key={`${item.transactionId}-${item.itemId}-${item.deductTime}-${index}`}
              onSelect={() => onOpenDashboardTab("deductions")}
              className="flex flex-col items-start gap-0.5"
            >
              <div className="text-sm font-medium">
                {item.itemName} x {item.deductQty}
              </div>
              <div className="text-xs text-muted-foreground">
                โดย {item.requestedBy} เมื่อ {formatDate(item.deductTime)}
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          ใบสั่งซื้อ
        </DropdownMenuLabel>
        {latestOrders.length === 0 ? (
          <DropdownMenuItem disabled>ไม่มีใบสั่งซื้อล่าสุด</DropdownMenuItem>
        ) : (
          latestOrders.map((item, index) => (
            <DropdownMenuItem
              key={`${item.poId}-${item.itemId}-${item.deliveryDate}-${index}`}
              onSelect={() => onOpenDashboardTab("orders")}
              className="flex flex-col items-start gap-0.5"
            >
              <div className="text-sm font-medium">
                {item.poId} x {item.itemName}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.supplierName} เมื่อ {formatDate(item.deliveryDate)}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
