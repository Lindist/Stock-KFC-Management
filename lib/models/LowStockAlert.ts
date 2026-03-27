import mongoose, { Schema, Document, Model } from "mongoose";

export interface ILowStockAlert extends Document {
  alert_id: string;
  item_id: string;     // FK → Ingredient.item_id
  alert_type: string;
  alert_qty: number;
  alert_time: Date;
  is_read: string;     // CHAR(1): 'Y' | 'N'
  createdAt?: Date;
  updatedAt?: Date;
}

const LowStockAlertSchema = new Schema<ILowStockAlert>(
  {
    alert_id: {
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
    alert_type: {
      type: String,
      required: true,
      maxlength: 30,
      enum: ["low_stock", "expiry", "out_of_stock"],
    },
    alert_qty: {
      type: Number,
      required: true,
      min: 0,
    },
    alert_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    is_read: {
      type: String,
      maxlength: 1,
      enum: ["Y", "N"],
      default: "N",
    },
  },
  {
    timestamps: true,
    collection: "low_stock_alerts",
  }
);

// Secondary indexes for alert queries and timeline sorting.
LowStockAlertSchema.index({ item_id: 1 });
LowStockAlertSchema.index({ is_read: 1 });
LowStockAlertSchema.index({ alert_time: -1 });

const LowStockAlert: Model<ILowStockAlert> =
  mongoose.models.LowStockAlert ||
  mongoose.model<ILowStockAlert>("LowStockAlert", LowStockAlertSchema);

export default LowStockAlert;
