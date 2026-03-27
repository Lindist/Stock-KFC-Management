import type {
  IngredientStockStatus,
  LowStockAlertType,
  PurchaseOrderStatus,
  StockDeductionStatus,
} from "@/lib/types/dashboard";

export interface ManagerIngredientRow {
  itemId: string;
  itemName: string;
  unit: string;
  cost: number;
  expiryDate: string;
  currentQty: number;
  maxQty: number;
  stockStatus: IngredientStockStatus;
}

export interface ManagerStockDeductionRow {
  transactionId: string;
  itemId: string;
  itemName: string;
  userId: string;
  requestedBy: string;
  deductQty: number;
  deductTime: string;
  status: StockDeductionStatus;
  note?: string;
}

export interface ManagerLowStockAlertRow {
  alertId: string;
  itemId: string;
  itemName: string;
  unit: string;
  currentQty: number;
  alertType: LowStockAlertType;
  alertQty: number;
  alertTime: string;
  isRead: "Y" | "N";
}

export interface ManagerPurchaseOrderRow {
  poId: string;
  itemId: string;
  itemName: string;
  unit: string;
  approverId: string;
  approverName: string;
  supplierName: string;
  orderQty: number;
  receivedQty: number;
  priceTotal: number;
  deliveryDate: string;
  status: PurchaseOrderStatus;
}

export interface ManagerPhaseData {
  ingredients: ManagerIngredientRow[];
  stockDeductions: ManagerStockDeductionRow[];
  alerts: ManagerLowStockAlertRow[];
  purchaseOrders: ManagerPurchaseOrderRow[];
}
