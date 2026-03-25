"use client";

import { useMemo } from "react";
import { Bell, ClipboardList, Package, ShoppingCart } from "lucide-react";
import type { GlobalDashboardData } from "@/lib/types/dashboard";
import { Badge } from "@/components/ui/badge";
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

export function ManagerNotifications({
  data,
  onOpenDashboardTab,
}: {
  data: GlobalDashboardData;
  onOpenDashboardTab: (tab: string) => void;
}) {
  const badgeCount = useMemo(() => {
    return (
      data.highlight.unreadAlerts +
      data.highlight.pendingDeductionApprovals +
      data.highlight.pendingPurchaseOrders
    );
  }, [data.highlight]);

  const latestAlerts = data.lowStockAlerts.slice(0, 4);
  const latestApprovals = data.stockDeductions.filter((d) => d.status === "pending").slice(0, 4);
  const latestOrders = data.purchaseOrders.slice(0, 4);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative cursor-pointer rounded-full p-1.5 hover:bg-slate-100">
        <Bell className="h-5 w-5 text-slate-500" />
        {badgeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] rounded-xl shadow-lg">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>แจ้งเตือน</span>
          <Badge variant="outline">อัปเดต {formatDate(data.generatedAt)}</Badge>
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
                {item.alertType} • {formatDate(item.alertTime)}
              </div>
            </DropdownMenuItem>
          ))
        )}

        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          คำขอเบิก (รออนุมัติ)
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
                {item.itemName} • {item.deductQty}
              </div>
              <div className="text-xs text-muted-foreground">
                โดย {item.requestedBy} • {formatDate(item.deductTime)}
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
                {item.poId} • {item.itemName}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.supplierName} • {formatDate(item.deliveryDate)}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
