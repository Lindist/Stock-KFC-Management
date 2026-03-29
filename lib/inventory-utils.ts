import type { IngredientStockStatus } from "@/lib/types/dashboard";

function isExpired(expiryDate?: Date | string | null) {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() < Date.now();
}

function isExpiringSoon(expiryDate?: Date | string | null) {
  if (!expiryDate) return false;
  const expiryTime = new Date(expiryDate).getTime();
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;
  return expiryTime >= now && expiryTime - now <= threeDays;
}

export function deriveIngredientStockStatus(
  currentQty: number,
  maxQty: number,
  expiryDate?: Date | string | null
): IngredientStockStatus {
  if (isExpired(expiryDate)) return "expired";
  if (isExpiringSoon(expiryDate)) return "expiring_soon";
  if (currentQty <= 0) return "out_of_stock";
  if (maxQty > 0 && currentQty / maxQty <= 0.2) return "low_stock";
  return "in_stock";
}

export function defaultAlertThreshold(maxQty: number) {
  return Math.max(10, Math.floor(maxQty * 0.2));
}
