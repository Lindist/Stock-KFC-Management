import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import LowStockAlert from "@/lib/models/LowStockAlert";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import StockDeduction from "@/lib/models/StockDeduction";
import User from "@/lib/models/User";
import type {
  IngredientStockStatus,
  LowStockAlertType,
  PurchaseOrderStatus,
} from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

const INGREDIENT_STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock"] as const;
const ALERT_TYPES = ["low_stock", "expiry", "out_of_stock"] as const;
const PURCHASE_ORDER_STATUSES = ["pending", "received", "arrived"] as const;
const IS_READ_VALUES = ["Y", "N"] as const;

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

function isObjectIdString(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

function coerceIngredientStockStatus(value: string): IngredientStockStatus {
  return (INGREDIENT_STOCK_STATUSES as readonly string[]).includes(value)
    ? (value as IngredientStockStatus)
    : "in_stock";
}

function coerceAlertType(value: string): LowStockAlertType {
  return (ALERT_TYPES as readonly string[]).includes(value) ? (value as LowStockAlertType) : "low_stock";
}

function coercePurchaseOrderStatus(value: string): PurchaseOrderStatus {
  return (PURCHASE_ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as PurchaseOrderStatus)
    : "pending";
}

function coerceIsRead(value: string): "Y" | "N" {
  return (IS_READ_VALUES as readonly string[]).includes(value) ? (value as "Y" | "N") : "N";
}

async function resolveUserNames(userIds: string[]) {
  const userMap = new Map<string, string>();

  if (userIds.length === 0) {
    return userMap;
  }

  const userRecords = await User.find({ user_id: { $in: userIds } });
  for (const user of userRecords) {
    userMap.set(user.user_id, user.full_name);
  }

  const missingUserIds = userIds.filter((id) => !userMap.has(id));
  if (missingUserIds.length > 0 && mongoose.connection?.db) {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const nameSet = new Set(collections.map((item) => item.name));
    const authUserCollectionName = ["user", "users"].find((name) => nameSet.has(name));

    if (authUserCollectionName) {
      const authUsersCollection = db.collection(authUserCollectionName);
      const objectIds = missingUserIds.filter(isObjectIdString).map((id) => new ObjectId(id));
      const [byIdField, byObjectId] = await Promise.all([
        authUsersCollection
          .find({ id: { $in: missingUserIds } }, { projection: { id: 1, name: 1, email: 1 } })
          .toArray(),
        objectIds.length > 0
          ? authUsersCollection
              .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1 } })
              .toArray()
          : [],
      ]);

      for (const item of byIdField) {
        if (typeof item.id === "string") {
          userMap.set(item.id, typeof item.name === "string" ? item.name : String(item.email ?? item.id));
        }
      }

      for (const item of byObjectId) {
        const key = typeof item._id?.toString === "function" ? item._id.toString() : "";
        if (key) {
          userMap.set(key, typeof item.name === "string" ? item.name : String(item.email ?? key));
        }
      }
    }
  }

  return userMap;
}

export async function getManagerPhaseData(): Promise<ManagerPhaseData> {
  await connectDB();

  const [ingredients, stockDeductions, alerts, purchaseOrders] = await Promise.all([
    Ingredient.find({}).sort({ item_id: 1 }),
    StockDeduction.find({}).sort({ deduct_time: -1 }),
    LowStockAlert.find({}).sort({ alert_time: -1 }),
    PurchaseOrder.find({}).sort({ createdAt: -1 }),
  ]);

  const ingredientMap = new Map(
    ingredients.map((item) => [
      item.item_id,
      {
        itemName: item.item_name,
        unit: item.unit,
        currentQty: item.current_qty,
      },
    ] as const)
  );

  const userIds = Array.from(
    new Set([
      ...stockDeductions.map((item) => item.user_id),
      ...purchaseOrders.map((item) => item.approver_id),
    ])
  );
  const userMap = await resolveUserNames(userIds);

  return {
    ingredients: ingredients.map((item) => ({
      itemId: item.item_id,
      itemName: item.item_name,
      unit: item.unit,
      cost: item.cost,
      expiryDate: toIsoString(item.expiry_date),
      currentQty: item.current_qty,
      stockStatus: coerceIngredientStockStatus(item.stock_status),
    })),
    stockDeductions: stockDeductions.map((item) => ({
      transactionId: item.transaction_id,
      itemId: item.item_id,
      itemName: ingredientMap.get(item.item_id)?.itemName ?? item.item_id,
      userId: item.user_id,
      requestedBy: userMap.get(item.user_id) ?? item.user_id,
      deductQty: item.deduct_qty,
      deductTime: toIsoString(item.deduct_time),
      status: item.status,
      note: item.note,
    })),
    alerts: alerts.map((item) => ({
      alertId: item.alert_id,
      itemId: item.item_id,
      itemName: ingredientMap.get(item.item_id)?.itemName ?? item.item_id,
      unit: ingredientMap.get(item.item_id)?.unit ?? "-",
      currentQty: ingredientMap.get(item.item_id)?.currentQty ?? item.alert_qty,
      alertType: coerceAlertType(item.alert_type),
      alertQty: item.alert_qty,
      alertTime: toIsoString(item.alert_time),
      isRead: coerceIsRead(item.is_read),
    })),
    purchaseOrders: purchaseOrders.map((item) => ({
      poId: item.po_id,
      itemId: item.item_id,
      itemName: ingredientMap.get(item.item_id)?.itemName ?? item.item_id,
      unit: ingredientMap.get(item.item_id)?.unit ?? "-",
      approverId: item.approver_id,
      approverName: userMap.get(item.approver_id) ?? item.approver_id,
      supplierName: item.supplier_name,
      orderQty: item.order_qty,
      receivedQty: item.received_qty,
      priceTotal: item.price_total,
      deliveryDate: toIsoString(item.delivery_date),
      status: coercePurchaseOrderStatus(item.po_status),
    })),
  };
}
