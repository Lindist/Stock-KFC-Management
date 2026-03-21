import mongoose, { Schema, Document, Model } from "mongoose";

export interface IStockDeduction extends Document {
  transaction_id: string;
  item_id: string;     // FK → Ingredient.item_id
  user_id: string;     // FK → User.user_id
  deduct_qty: number;
  deduct_time: Date;
  status: "pending" | "approved" | "rejected";
  note?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const StockDeductionSchema = new Schema<IStockDeduction>(
  {
    transaction_id: {
      type: String,
      required: true,
      maxlength: 15,
    },
    item_id: {
      type: String,
      required: true,
      maxlength: 10,
      ref: "Ingredient",
    },
    user_id: {
      type: String,
      required: true,
      maxlength: 10,
      ref: "User",
    },
    deduct_qty: {
      type: Number,
      required: true,
      min: 1,
    },
    deduct_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    note: {
      type: String,
      maxlength: 255,
    },
  },
  {
    timestamps: true,
    collection: "stock_deductions",
  }
);

// Indexes
StockDeductionSchema.index({ transaction_id: 1 });
StockDeductionSchema.index({ item_id: 1 });
StockDeductionSchema.index({ user_id: 1 });
StockDeductionSchema.index({ deduct_time: -1 });

const StockDeduction: Model<IStockDeduction> =
  mongoose.models.StockDeduction ||
  mongoose.model<IStockDeduction>("StockDeduction", StockDeductionSchema);

export default StockDeduction;
