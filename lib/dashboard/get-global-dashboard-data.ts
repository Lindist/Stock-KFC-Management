import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import LowStockAlert from "@/lib/models/LowStockAlert";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import StockDeduction from "@/lib/models/StockDeduction";
import User from "@/lib/models/User";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import type {
  DashboardMetric,
  GlobalDashboardData,
  IngredientDashboardRow,
  IngredientStockStatus,
  LowStockAlertDashboardRow,
  LowStockAlertType,
  PurchaseOrderDashboardRow,
  PurchaseOrderStatus,
  StockDeductionDashboardRow,
} from "@/lib/types/dashboard";

const INGREDIENT_STOCK_STATUSES = ["in_stock", "low_stock", "out_of_stock", "expiring_soon", "expired"] as const;
const ALERT_TYPES = ["low_stock", "out_of_stock"] as const;
const PURCHASE_ORDER_STATUSES = ["pending", "received", "arrived"] as const;

function deriveIngredientStockStatus(
  currentQty: number,
  maxQty: number,
  expiryDate?: Date | string | null
): IngredientStockStatus {
  if (expiryDate && new Date(expiryDate).getTime() < Date.now()) {
    return "expired";
  }

  if (expiryDate) {
    const expiryTime = new Date(expiryDate).getTime();
    const diff = expiryTime - Date.now();
    if (diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000) {
      return "expiring_soon";
    }
  }

  if (currentQty <= 0) {
    return "out_of_stock";
  }

  if (maxQty > 0 && currentQty / maxQty <= 0.2) {
    return "low_stock";
  }

  return "in_stock";
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

function toIsoString(value: Date | string | null | undefined) {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

function isObjectIdString(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}

export async function getGlobalDashboardData(): Promise<GlobalDashboardData> {
  await connectDB();
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const [
    totalIngredients,
    totalLowStockAlerts,
    pendingDeductionApprovals,
    pendingPurchaseOrders,
    arrivedPurchaseOrders,
    expiringIngredients,
    expiredIngredients,
    ingredients,
    expiryAlerts,
    stockDeductions,
    lowStockAlerts,
    purchaseOrders,
    receipts,
  ] = await Promise.all([
    Ingredient.countDocuments(),
    LowStockAlert.countDocuments(),
    StockDeduction.countDocuments({ status: "pending" }),
    PurchaseOrder.countDocuments({ po_status: "pending" }),
    PurchaseOrder.countDocuments({ po_status: "arrived" }),
    Ingredient.countDocuments({ expiry_date: { $gte: now, $lte: threeDaysFromNow } }),
    Ingredient.countDocuments({ expiry_date: { $lt: now } }),
    Ingredient.find({}).sort({ updatedAt: -1 }),
    Ingredient.find({ expiry_date: { $lte: threeDaysFromNow } }).sort({ expiry_date: 1 }),
    StockDeduction.find({}).sort({ deduct_time: -1 }),
    LowStockAlert.find({}).sort({ alert_time: -1 }),
    PurchaseOrder.find({}).sort({ createdAt: -1 }),
    PurchaseOrder.find({ po_status: { $in: ["arrived", "received"] } }).sort({ delivery_date: -1 }),
  ]);

  const ingredientIds = new Set<string>();
  const userIds = new Set<string>();

  for (const item of ingredients) {
    ingredientIds.add(item.item_id);
  }

  for (const item of expiryAlerts) {
    ingredientIds.add(item.item_id);
  }

  for (const item of stockDeductions) {
    ingredientIds.add(item.item_id);
    userIds.add(item.user_id);
  }

  for (const item of lowStockAlerts) {
    ingredientIds.add(item.item_id);
  }

  for (const item of purchaseOrders) {
    ingredientIds.add(item.item_id);
    userIds.add(item.approver_id);
  }

  for (const item of receipts) {
    ingredientIds.add(item.item_id);
    userIds.add(item.approver_id);
  }

  const [ingredientRecords, userRecords] = await Promise.all([
    ingredientIds.size > 0 ? Ingredient.find({ item_id: { $in: Array.from(ingredientIds) } }) : [],
    userIds.size > 0 ? User.find({ user_id: { $in: Array.from(userIds) } }) : [],
  ]);

  const ingredientMap = new Map(
    ingredientRecords.map((item) => [item.item_id, item.item_name] as const)
  );
  const userMap = new Map<string, string>(
    userRecords.map((user) => [user.user_id, user.full_name] as const)
  );

  // Fallback: better-auth stores users in its own collection(s). We try to resolve missing ids from there.
  const missingUserIds = Array.from(userIds).filter((id) => !userMap.has(id));
  if (missingUserIds.length > 0 && mongoose.connection?.db) {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const nameSet = new Set(collections.map((c) => c.name));
    const candidateCollections = ["user", "users"];
    const authUserCollectionName = candidateCollections.find((name) => nameSet.has(name));

    if (authUserCollectionName) {
      const authUsersCol = db.collection(authUserCollectionName);
      const objectIds = missingUserIds.filter(isObjectIdString).map((id) => new ObjectId(id));

      const [byIdField, byObjectId] = await Promise.all([
        authUsersCol
          .find({ id: { $in: missingUserIds } }, { projection: { id: 1, name: 1, email: 1 } })
          .toArray(),
        objectIds.length > 0
          ? authUsersCol
              .find({ _id: { $in: objectIds } }, { projection: { name: 1, email: 1 } })
              .toArray()
          : [],
      ]);

      for (const doc of byIdField) {
        const key = typeof doc.id === "string" ? doc.id : undefined;
        const name = typeof doc.name === "string" ? doc.name : typeof doc.email === "string" ? doc.email : undefined;
        if (key && name && !userMap.has(key)) {
          userMap.set(key, name);
        }
      }

      for (const doc of byObjectId) {
        const key = typeof doc._id?.toString === "function" ? doc._id.toString() : undefined;
        const name = typeof doc.name === "string" ? doc.name : typeof doc.email === "string" ? doc.email : undefined;
        if (key && name && !userMap.has(key)) {
          userMap.set(key, name);
        }
      }
    }
  }

  const metrics: DashboardMetric[] = [
    {
      key: "ingredients",
      label: "วัตถุดิบทั้งหมด",
      value: totalIngredients,
      description: "จำนวนรายการวัตถุดิบในคลังทั้งหมด",
      tone: "neutral",
    },
    {
      key: "alerts",
      label: "วัตถุดิบใกล้หมด",
      value: totalLowStockAlerts,
      description: "คำนวณจากรายการแจ้งเตือนที่ยังไม่อ่าน",
      tone: totalLowStockAlerts > 0 ? "danger" : "success",
    },
    {
      key: "approvals",
      label: "รออนุมัติเบิก",
      value: pendingDeductionApprovals,
      description: "คำขอตัดสต๊อกที่ยังรอการอนุมัติ",
      tone: pendingDeductionApprovals > 0 ? "warning" : "success",
    },
    {
      key: "purchase-orders",
      label: "ใบสั่งซื้อรอรับ",
      value: pendingPurchaseOrders,
      description: "ใบสั่งซื้อที่ยังอยู่ระหว่างติดตามรับเข้า",
      tone: pendingPurchaseOrders > 0 ? "warning" : "success",
    },
  ];

  const ingredientRows: IngredientDashboardRow[] = ingredients.map((item) => ({
    itemId: item.item_id,
    itemName: item.item_name,
    unit: item.unit,
    cost: item.cost,
    expiryDate: toIsoString(item.expiry_date),
    currentQty: item.current_qty,
    stockStatus: deriveIngredientStockStatus(item.current_qty, item.max_qty ?? 0, item.expiry_date),
  }));

  const expiryAlertRows: IngredientDashboardRow[] = expiryAlerts.map((item) => ({
    itemId: item.item_id,
    itemName: item.item_name,
    unit: item.unit,
    cost: item.cost,
    expiryDate: toIsoString(item.expiry_date),
    currentQty: item.current_qty,
    stockStatus: deriveIngredientStockStatus(item.current_qty, item.max_qty ?? 0, item.expiry_date),
  }));

  const stockDeductionRows: StockDeductionDashboardRow[] = stockDeductions.map((item) => ({
    transactionId: item.transaction_id,
    itemId: item.item_id,
    itemName: ingredientMap.get(item.item_id) ?? item.item_id,
    requestedBy: userMap.get(item.user_id) ?? item.user_id,
    deductQty: item.deduct_qty,
    status: item.status,
    deductTime: toIsoString(item.deduct_time),
    note: item.note,
  }));

  const lowStockAlertRows: LowStockAlertDashboardRow[] = lowStockAlerts.map((item) => ({
    alertId: item.alert_id,
    itemId: item.item_id,
    itemName: ingredientMap.get(item.item_id) ?? item.item_id,
    alertType: coerceAlertType(item.alert_type),
    alertQty: item.alert_qty,
    alertTime: toIsoString(item.alert_time),
  }));

  const purchaseOrderRows: PurchaseOrderDashboardRow[] = purchaseOrders.map((item) => ({
    poId: item.po_id,
    itemId: item.item_id,
    itemName: ingredientMap.get(item.item_id) ?? item.item_id,
    supplierName: item.supplier_name,
    orderQty: item.order_qty,
    receivedQty: item.received_qty,
    priceTotal: item.price_total,
    deliveryDate: toIsoString(item.delivery_date),
    status: coercePurchaseOrderStatus(item.po_status),
    approverName: userMap.get(item.approver_id) ?? item.approver_id,
  }));

  const receiptRows: PurchaseOrderDashboardRow[] = receipts.map((item) => ({
    poId: item.po_id,
    itemId: item.item_id,
    itemName: ingredientMap.get(item.item_id) ?? item.item_id,
    supplierName: item.supplier_name,
    orderQty: item.order_qty,
    receivedQty: item.received_qty,
    priceTotal: item.price_total,
    deliveryDate: toIsoString(item.delivery_date),
    status: coercePurchaseOrderStatus(item.po_status),
    approverName: userMap.get(item.approver_id) ?? item.approver_id,
  }));

  return {
    metrics,
    ingredients: ingredientRows,
    expiryAlerts: expiryAlertRows,
    stockDeductions: stockDeductionRows,
    lowStockAlerts: lowStockAlertRows,
    purchaseOrders: purchaseOrderRows,
    receipts: receiptRows,
    highlight: {
      lowStockAlerts: totalLowStockAlerts,
      pendingDeductionApprovals,
      pendingPurchaseOrders,
      arrivedPurchaseOrders,
      expiringIngredients,
      expiredIngredients,
    },
    generatedAt: new Date().toISOString(),
  };
}
