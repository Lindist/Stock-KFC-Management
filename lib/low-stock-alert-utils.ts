import type { LowStockAlertType } from "@/lib/types/dashboard";

export function deriveLowStockAlertType(currentQty: number, alertThreshold: number): LowStockAlertType | null {
  if (currentQty <= 0) {
    return "out_of_stock";
  }

  if (currentQty <= alertThreshold) {
    return "low_stock";
  }

  return null;
}

export function buildLowStockAlertId(itemId: string, alertType: LowStockAlertType) {
  const prefix = alertType === "out_of_stock" ? "OUT" : alertType === "expiry" ? "EXP" : "LOW";
  return `ALT-${prefix}-${itemId}`.slice(0, 15);
}
