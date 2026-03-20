/**
 * Central export for all Mongoose models
 * ใช้ import จากไฟล์นี้เพื่อเข้าถึง model ทั้งหมด
 *
 * Example:
 *   import { User, Ingredient, PurchaseOrder } from "@/lib/models";
 */

export { default as User } from "./User";
export { default as Ingredient } from "./Ingredient";
export { default as PurchaseOrder } from "./PurchaseOrder";
export { default as StockDeduction } from "./StockDeduction";
export { default as LowStockAlert } from "./LowStockAlert";
export { default as Report } from "./Report";

// Type exports
export type { IUser } from "./User";
export type { IIngredient } from "./Ingredient";
export type { IPurchaseOrder } from "./PurchaseOrder";
export type { IStockDeduction } from "./StockDeduction";
export type { ILowStockAlert } from "./LowStockAlert";
export type { IReport } from "./Report";
