import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPurchaseOrder extends Document {
  po_id: string;
  item_id: string;        // FK → Ingredient.item_id
  approver_id: string;    // FK → User.user_id
  supplier_name: string;
  order_qty: number;
  price_total: number;
  delivery_date: Date;
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
      maxlength: 10,
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
      required: true,
    },
    po_status: {
      type: String,
      required: true,
      maxlength: 20,
      enum: ["pending", "approved", "received", "cancelled"],
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

// Indexes
PurchaseOrderSchema.index({ po_id: 1 });
PurchaseOrderSchema.index({ item_id: 1 });
PurchaseOrderSchema.index({ approver_id: 1 });
PurchaseOrderSchema.index({ po_status: 1 });

const PurchaseOrder: Model<IPurchaseOrder> =
  mongoose.models.PurchaseOrder ||
  mongoose.model<IPurchaseOrder>("PurchaseOrder", PurchaseOrderSchema);

export default PurchaseOrder;
