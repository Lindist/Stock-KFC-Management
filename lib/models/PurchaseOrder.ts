import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchaseOrder extends Document {
  po_id: string;
  item_id: string;
  approver_id: string;
  supplier_name: string;
  order_qty: number;
  price_total: number;
  delivery_date: Date | null;
  po_status: string;
  received_qty: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    po_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 15,
    },
    item_id: {
      type: String,
      required: true,
      maxlength: 10,
      ref: "Ingredient",
    },
    approver_id: {
      type: String,
      required: true,
      maxlength: 30,
      ref: "User",
    },
    supplier_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    order_qty: {
      type: Number,
      required: true,
      min: 1,
    },
    price_total: {
      type: Number,
      required: true,
      min: 0,
    },
    delivery_date: {
      type: Date,
      default: null,
    },
    po_status: {
      type: String,
      required: true,
      maxlength: 20,
      enum: ["pending", "received", "arrived"],
      default: "pending",
    },
    received_qty: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "purchase_orders",
  }
);

PurchaseOrderSchema.index({ item_id: 1 });
PurchaseOrderSchema.index({ approver_id: 1 });
PurchaseOrderSchema.index({ po_status: 1 });

const existingPurchaseOrderModel = mongoose.models.PurchaseOrder as Model<IPurchaseOrder> | undefined;
const deliveryDatePath = existingPurchaseOrderModel?.schema.path("delivery_date");
const shouldRefreshModel =
  Boolean(deliveryDatePath) &&
  "isRequired" in deliveryDatePath &&
  typeof deliveryDatePath.isRequired === "boolean" &&
  deliveryDatePath.isRequired;

if (shouldRefreshModel) {
  mongoose.deleteModel("PurchaseOrder");
}

const PurchaseOrder: Model<IPurchaseOrder> =
  (shouldRefreshModel ? undefined : mongoose.models.PurchaseOrder) ||
  mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrder;
