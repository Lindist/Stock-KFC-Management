import mongoose, { Document, Model, Schema } from "mongoose";

export interface ILowStockAlert extends Document {
  alert_id: string;
  item_id: string;
  alert_type: "low_stock" | "out_of_stock";
  alert_qty: number;
  alert_time: Date;
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
      enum: ["low_stock", "out_of_stock"],
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
  },
  {
    timestamps: true,
    collection: "low_stock_alerts",
  }
);

LowStockAlertSchema.index({ item_id: 1 });
LowStockAlertSchema.index({ alert_type: 1 });
LowStockAlertSchema.index({ alert_time: -1 });

const LowStockAlert: Model<ILowStockAlert> =
  mongoose.models.LowStockAlert ||
  mongoose.model<ILowStockAlert>("LowStockAlert", LowStockAlertSchema);

export default LowStockAlert;
