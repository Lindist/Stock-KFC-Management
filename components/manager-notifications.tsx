"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, ClipboardList, Package, ShoppingCart, TriangleAlert, X } from "lucide-react";
import type { GlobalDashboardData, LowStockAlertType, PurchaseOrderStatus } from "@/lib/types/dashboard";
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
    return "ยังไม่กำหนด";
  }

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatAlertType(value: LowStockAlertType) {
  if (value === "out_of_stock") {
    return "วัตถุดิบหมดสต็อก";
  }

  return "วัตถุดิบใกล้หมด";
}

function buildStorageKey(prefix: string, data: GlobalDashboardData, count: number) {
  return `${prefix}:${data.generatedAt}:${count}`;
}

function NotificationAlert({
  icon,
  title,
  description,
  buttonClassName,
  buttonLabel,
  onView,
  onDismiss,
  dismissLabel,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonClassName: string;
  buttonLabel: string;
  onView: () => void;
  onDismiss: () => void;
  dismissLabel: string;
  className: string;
}) {
  return (
    <Alert className={className}>
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="pr-0 sm:pr-2">{description}</AlertDescription>
      <AlertAction>
        <Button size="sm" className={buttonClassName} onClick={onView}>
          {buttonLabel}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-slate-500 hover:bg-white hover:text-slate-800"
          onClick={onDismiss}
          aria-label={dismissLabel}
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertAction>
    </Alert>
  );
}

export function NotificationsBanner({
  data,
  onOpenDashboardTab,
}: {
  data: GlobalDashboardData;
  onOpenDashboardTab: (tab: string, menuId?: string) => void;
}) {
  const { dashboardData } = useDashboardDataCache();
  const source = dashboardData ?? data;
  const approvalCount = source.highlight.pendingDeductionApprovals;
  const purchaseOrderCount = source.highlight.pendingPurchaseOrders;
  const arrivedOrderCount = source.highlight.arrivedPurchaseOrders;
  const lowThresholdCount = source.highlight.lowStockAlerts;
  const expiryCount = source.highlight.expiringIngredients + source.highlight.expiredIngredients;

  const [dismissApproval, setDismissApproval] = useState(true);
  const [dismissPurchaseOrders, setDismissPurchaseOrders] = useState(true);
  const [dismissArrivedOrders, setDismissArrivedOrders] = useState(true);
  const [dismissLowThreshold, setDismissLowThreshold] = useState(true);
  const [dismissExpiry, setDismissExpiry] = useState(true);

  const approvalStorageKey = buildStorageKey("approval-notifications", source, approvalCount);
  const purchaseOrderStorageKey = buildStorageKey("purchase-order-notifications", source, purchaseOrderCount);
  const arrivedOrderStorageKey = buildStorageKey("arrived-order-notifications", source, arrivedOrderCount);
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
    setDismissArrivedOrders(
      arrivedOrderCount <= 0 || window.sessionStorage.getItem(arrivedOrderStorageKey) === "dismissed"
    );
    setDismissLowThreshold(
      lowThresholdCount <= 0 || window.sessionStorage.getItem(lowThresholdStorageKey) === "dismissed"
    );
    setDismissExpiry(
      expiryCount <= 0 || window.sessionStorage.getItem(expiryStorageKey) === "dismissed"
    );
  }, [
    approvalCount,
    approvalStorageKey,
    purchaseOrderCount,
    purchaseOrderStorageKey,
    arrivedOrderCount,
    arrivedOrderStorageKey,
    lowThresholdCount,
    lowThresholdStorageKey,
    expiryCount,
    expiryStorageKey,
  ]);

  const dismiss = (storageKey: string, setter: (value: boolean) => void) => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "dismissed");
    }
    setter(true);
  };

  return (
    <>
      {approvalCount > 0 && !dismissApproval ? (
        <NotificationAlert
          icon={<TriangleAlert className="h-4 w-4 text-red-600" />}
          title="มีคำขอรออนุมัติ"
          description={`มีคำขอรออนุมัติ ${approvalCount} รายการที่ควรตรวจสอบและตัดสินใจในระบบ`}
          buttonClassName="bg-red-600 text-white hover:bg-red-700"
          buttonLabel="ดูรายละเอียด"
          onView={() => onOpenDashboardTab("deductions", "withdraw")}
          onDismiss={() => dismiss(approvalStorageKey, setDismissApproval)}
          dismissLabel="ปิดแจ้งเตือนคำขอรออนุมัติ"
          className="dashboard-panel border-red-200 bg-gradient-to-r from-red-50 via-white to-amber-50 text-red-950 shadow-sm"
        />
      ) : null}

      {purchaseOrderCount > 0 && !dismissPurchaseOrders ? (
        <NotificationAlert
          icon={<ShoppingCart className="h-4 w-4 text-sky-600" />}
          title="มีใบสั่งซื้อรอติดตาม"
          description={`มีใบสั่งซื้อรอติดตาม ${purchaseOrderCount} รายการที่ควรตรวจสอบสถานะการสั่งซื้อ`}
          buttonClassName="bg-sky-600 text-white hover:bg-sky-700"
          buttonLabel="ดูรายการ"
          onView={() => onOpenDashboardTab("orders", "purchase-orders")}
          onDismiss={() => dismiss(purchaseOrderStorageKey, setDismissPurchaseOrders)}
          dismissLabel="ปิดแจ้งเตือนใบสั่งซื้อ"
          className="dashboard-panel border-sky-200 bg-gradient-to-r from-sky-50 via-white to-cyan-50 text-sky-950 shadow-sm"
        />
      ) : null}

      {arrivedOrderCount > 0 && !dismissArrivedOrders ? (
        <NotificationAlert
          icon={<ShoppingCart className="h-4 w-4 text-emerald-600" />}
          title="มีของมาส่งแล้วรอรับเข้า"
          description={`มีรายการวัตถุดิบที่ supplier ส่งมาแล้ว ${arrivedOrderCount} รายการ รอผู้จัดการตรวจรับเข้า`}
          buttonClassName="bg-emerald-600 text-white hover:bg-emerald-700"
          buttonLabel="ดูรายการ"
          onView={() => onOpenDashboardTab("receipts", "import-materials")}
          onDismiss={() => dismiss(arrivedOrderStorageKey, setDismissArrivedOrders)}
          dismissLabel="ปิดแจ้งเตือนของมาส่งแล้ว"
          className="dashboard-panel border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-teal-50 text-emerald-950 shadow-sm"
        />
      ) : null}

      {lowThresholdCount > 0 && !dismissLowThreshold ? (
        <NotificationAlert
          icon={<Package className="h-4 w-4 text-amber-600" />}
          title="มีวัตถุดิบต่ำกว่าค่าแจ้งเตือน"
          description={`พบ ${lowThresholdCount} รายการที่ควรติดตามและอาจต้องวางแผนสั่งซื้อหรือเติมคลังเพิ่ม`}
          buttonClassName="bg-amber-600 text-white hover:bg-amber-700"
          buttonLabel="ดูรายการ"
          onView={() => onOpenDashboardTab("alerts", "notifications")}
          onDismiss={() => dismiss(lowThresholdStorageKey, setDismissLowThreshold)}
          dismissLabel="ปิดแจ้งเตือนวัตถุดิบต่ำกว่าค่ากำหนด"
          className="dashboard-panel border-amber-200 bg-gradient-to-r from-amber-50 via-white to-yellow-50 text-amber-950 shadow-sm"
        />
      ) : null}

      {expiryCount > 0 && !dismissExpiry ? (
        <NotificationAlert
          icon={<Package className="h-4 w-4 text-violet-600" />}
          title="มีวัตถุดิบใกล้หมดอายุหรือหมดอายุ"
          description={`พบวัตถุดิบใกล้หมดอายุ ${source.highlight.expiringIngredients} รายการ และหมดอายุแล้ว ${source.highlight.expiredIngredients} รายการ`}
          buttonClassName="bg-violet-600 text-white hover:bg-violet-700"
          buttonLabel="ดูรายการ"
          onView={() => onOpenDashboardTab("ingredients", "warehouse")}
          onDismiss={() => dismiss(expiryStorageKey, setDismissExpiry)}
          dismissLabel="ปิดแจ้งเตือนวันหมดอายุ"
          className="dashboard-panel border-violet-200 bg-gradient-to-r from-violet-50 via-white to-rose-50 text-violet-950 shadow-sm"
        />
      ) : null}
    </>
  );
}

export function ManagerNotifications({
  data,
  onOpenDashboardTab,
}: {
  data: GlobalDashboardData;
  onOpenDashboardTab: (tab: string, menuId?: string) => void;
}) {
  const { dashboardData } = useDashboardDataCache();
  const source = dashboardData ?? data;

  const badgeCount = useMemo(() => {
    return (
      source.highlight.lowStockAlerts +
      source.highlight.pendingDeductionApprovals +
      source.highlight.pendingPurchaseOrders +
      source.highlight.arrivedPurchaseOrders +
      source.highlight.expiringIngredients +
      source.highlight.expiredIngredients
    );
  }, [source.highlight]);

  const latestAlerts = source.lowStockAlerts;
  const latestExpiryAlerts = source.expiryAlerts;
  const latestApprovals = source.stockDeductions.filter((item) => item.status === "pending");
  const latestOrders = source.purchaseOrders.filter((item) => item.status === "pending");
  const latestArrivedOrders = source.purchaseOrders.filter(
    (item) => item.status === ("arrived" as PurchaseOrderStatus)
  );

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

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="max-h-[min(72vh,34rem)] w-[min(90vw,22rem)] max-w-[90vw] overflow-y-auto rounded-xl p-0 shadow-lg sm:w-[24rem]"
      >
        <DropdownMenuLabel className="flex flex-wrap items-center justify-between gap-2 px-3 py-3">
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
              onSelect={() => onOpenDashboardTab("alerts", "notifications")}
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
              onSelect={() => onOpenDashboardTab("ingredients", "warehouse")}
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
              onSelect={() => onOpenDashboardTab("deductions", "withdraw")}
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
          ใบสั่งซื้อที่รอติดตาม
        </DropdownMenuLabel>
        {latestOrders.length === 0 ? (
          <DropdownMenuItem disabled>ไม่มีใบสั่งซื้อล่าสุด</DropdownMenuItem>
        ) : (
          latestOrders.map((item, index) => (
            <DropdownMenuItem
              key={`${item.poId}-${item.itemId}-pending-${index}`}
              onSelect={() => onOpenDashboardTab("orders", "purchase-orders")}
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

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShoppingCart className="h-4 w-4" />
          ของมาส่งแล้วรอรับเข้า
        </DropdownMenuLabel>
        {latestArrivedOrders.length === 0 ? (
          <DropdownMenuItem disabled>ยังไม่มีรายการที่ส่งมาถึงแล้ว</DropdownMenuItem>
        ) : (
          latestArrivedOrders.map((item, index) => (
            <DropdownMenuItem
              key={`${item.poId}-${item.itemId}-arrived-${index}`}
              onSelect={() => onOpenDashboardTab("receipts", "import-materials")}
              className="flex flex-col items-start gap-0.5"
            >
              <div className="text-sm font-medium">
                {item.poId} x {item.itemName}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.supplierName} ส่งของแล้ว เมื่อ {formatDate(item.deliveryDate)}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
