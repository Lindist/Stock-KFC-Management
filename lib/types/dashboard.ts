export type IngredientStockStatus = "in_stock" | "low_stock" | "out_of_stock";
export type StockDeductionStatus = "pending" | "approved" | "rejected";
export type PurchaseOrderStatus = "pending" | "received" | "arrived";
export type LowStockAlertType = "low_stock" | "expiry" | "out_of_stock";
export type ReportType =
  | "stock_summary"
  | "purchase_order"
  | "stock_deduction"
  | "low_stock";

export interface DashboardMetric {
  key: string;
  label: string;
  value: number;
  description: string;
  tone: "neutral" | "warning" | "danger" | "success";
}

export interface IngredientDashboardRow {
  itemId: string;
  itemName: string;
  unit: string;
  cost: number;
  expiryDate: string;
  currentQty: number;
  stockStatus: IngredientStockStatus;
}

export interface StockDeductionDashboardRow {
  transactionId: string;
  itemId: string;
  itemName: string;
  requestedBy: string;
  deductQty: number;
  status: StockDeductionStatus;
  deductTime: string;
  note?: string;
}

export interface LowStockAlertDashboardRow {
  alertId: string;
  itemId: string;
  itemName: string;
  alertType: LowStockAlertType;
  alertQty: number;
  alertTime: string;
  isRead: "Y" | "N";
}

export interface PurchaseOrderDashboardRow {
  poId: string;
  itemId: string;
  itemName: string;
  supplierName: string;
  orderQty: number;
  receivedQty: number;
  priceTotal: number;
  deliveryDate: string;
  status: PurchaseOrderStatus;
  approverName: string;
}

export interface DashboardHighlight {
  unreadAlerts: number;
  pendingDeductionApprovals: number;
  pendingPurchaseOrders: number;
}

export interface GlobalDashboardData {
  metrics: DashboardMetric[];
  ingredients: IngredientDashboardRow[];
  stockDeductions: StockDeductionDashboardRow[];
  lowStockAlerts: LowStockAlertDashboardRow[];
  purchaseOrders: PurchaseOrderDashboardRow[];
  receipts: PurchaseOrderDashboardRow[];
  highlight: DashboardHighlight;
  generatedAt: string;
}
