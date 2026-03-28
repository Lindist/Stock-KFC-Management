import type { IngredientStockStatus } from "@/lib/types/dashboard";

export function deriveIngredientStockStatus(currentQty: number, maxQty: number): IngredientStockStatus {
  if (currentQty <= 0) return "out_of_stock";
  if (maxQty > 0 && currentQty / maxQty <= 0.2) return "low_stock";
  return "in_stock";
}

export function defaultAlertThreshold(maxQty: number) {
  return Math.max(10, Math.floor(maxQty * 0.2));
}
