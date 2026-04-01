import { buildLowStockAlertId, deriveLowStockAlertType } from "@/lib/low-stock-alert-utils";
import type {
  GlobalDashboardData,
  IngredientDashboardRow,
  LowStockAlertDashboardRow,
  PurchaseOrderDashboardRow,
  StockDeductionDashboardRow,
} from "@/lib/types/dashboard";
import type { ManagerPhaseData } from "@/lib/types/manager";

function toIngredientRows(data: ManagerPhaseData): IngredientDashboardRow[] {
  return data.ingredients.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    unit: item.unit,
    cost: item.cost,
    expiryDate: item.expiryDate,
    currentQty: item.currentQty,
    stockStatus: item.stockStatus,
  }));
}

function toStockDeductionRows(data: ManagerPhaseData): StockDeductionDashboardRow[] {
  return data.stockDeductions.map((item) => ({
    transactionId: item.transactionId,
    itemId: item.itemId,
    itemName: item.itemName,
    requestedBy: item.requestedBy,
    deductQty: item.deductQty,
    status: item.status,
    deductTime: item.deductTime,
    note: item.note,
  }));
}

function toPurchaseOrderRows(data: ManagerPhaseData): PurchaseOrderDashboardRow[] {
  return data.purchaseOrders.map((item) => ({
    poId: item.poId,
    itemId: item.itemId,
    itemName: item.itemName,
    supplierName: item.supplierName,
    orderQty: item.orderQty,
    receivedQty: item.receivedQty,
    priceTotal: item.priceTotal,
    deliveryDate: item.deliveryDate,
    status: item.status,
    approverName: item.approverName,
  }));
}

function buildLowStockAlerts(
  current: GlobalDashboardData,
  data: ManagerPhaseData,
  generatedAt: string
): LowStockAlertDashboardRow[] {
  const existingAlerts = new Map<string, LowStockAlertDashboardRow>();

  for (const item of current.lowStockAlerts) {
    existingAlerts.set(`${item.itemId}:${item.alertType}`, item);
  }

  for (const item of data.alerts) {
    existingAlerts.set(`${item.itemId}:${item.alertType}`, {
      alertId: item.alertId,
      itemId: item.itemId,
      itemName: item.itemName,
      alertType: item.alertType,
      alertQty: item.alertQty,
      alertTime: item.alertTime,
    });
  }

  return data.ingredients
    .map((item) => {
      const alertType = deriveLowStockAlertType(item.currentQty, item.alertThreshold);
      if (!alertType) {
        return null;
      }

      const existing = existingAlerts.get(`${item.itemId}:${alertType}`);
      return {
        alertId: existing?.alertId ?? buildLowStockAlertId(item.itemId, alertType),
        itemId: item.itemId,
        itemName: item.itemName,
        alertType,
        alertQty: item.currentQty,
        alertTime: existing?.alertTime ?? generatedAt,
      } satisfies LowStockAlertDashboardRow;
    })
    .filter((item): item is LowStockAlertDashboardRow => item !== null)
    .sort((left, right) => new Date(right.alertTime).getTime() - new Date(left.alertTime).getTime());
}

export function reconcileDashboardCache(
  current: GlobalDashboardData,
  managerData: ManagerPhaseData
): GlobalDashboardData {
  const generatedAt = new Date().toISOString();
  const ingredients = toIngredientRows(managerData);
  const stockDeductions = toStockDeductionRows(managerData);
  const purchaseOrders = toPurchaseOrderRows(managerData);
  const lowStockAlerts = buildLowStockAlerts(current, managerData, generatedAt);
  const expiryAlerts = ingredients
    .filter((item) => item.stockStatus === "expiring_soon" || item.stockStatus === "expired")
    .sort((left, right) => new Date(left.expiryDate).getTime() - new Date(right.expiryDate).getTime());
  const receipts = purchaseOrders.filter((item) => item.status === "arrived" || item.status === "received");
  const pendingDeductionApprovals = stockDeductions.filter((item) => item.status === "pending").length;
  const pendingPurchaseOrders = purchaseOrders.filter((item) => item.status === "pending").length;
  const arrivedPurchaseOrders = purchaseOrders.filter((item) => item.status === "arrived").length;
  const expiringIngredients = ingredients.filter((item) => item.stockStatus === "expiring_soon").length;
  const expiredIngredients = ingredients.filter((item) => item.stockStatus === "expired").length;

  return {
    ...current,
    metrics: current.metrics.map((metric) => {
      if (metric.key === "ingredients") {
        return { ...metric, value: ingredients.length, tone: "neutral" };
      }

      if (metric.key === "alerts") {
        return {
          ...metric,
          value: lowStockAlerts.length,
          tone: lowStockAlerts.length > 0 ? "danger" : "success",
        };
      }

      if (metric.key === "approvals") {
        return {
          ...metric,
          value: pendingDeductionApprovals,
          tone: pendingDeductionApprovals > 0 ? "warning" : "success",
        };
      }

      if (metric.key === "purchase-orders") {
        return {
          ...metric,
          value: pendingPurchaseOrders,
          tone: pendingPurchaseOrders > 0 ? "warning" : "success",
        };
      }

      return metric;
    }),
    ingredients,
    expiryAlerts,
    stockDeductions,
    lowStockAlerts,
    purchaseOrders,
    receipts,
    highlight: {
      lowStockAlerts: lowStockAlerts.length,
      pendingDeductionApprovals,
      pendingPurchaseOrders,
      arrivedPurchaseOrders,
      expiringIngredients,
      expiredIngredients,
    },
    generatedAt,
  };
}
