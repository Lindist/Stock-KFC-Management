import mongoose, { Schema, Document, Model } from "mongoose";

export interface IIngredient extends Document {
  item_id: string;
  item_name: string;
  unit: string;
  cost: number;
  expiry_date: Date;
  current_qty: number;
  max_qty: number;
  stock_status: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    item_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 10,
    },
    item_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    unit: {
      type: String,
      required: true,
      maxlength: 20,
    },
    cost: {
      type: Number,
      required: true,
      min: 0,
    },
    expiry_date: {
      type: Date,
      required: true,
    },
    current_qty: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    max_qty: {
      type: Number,
      required: true,
      default: 100,
      min: 0,
    },
    stock_status: {
      type: String,
      required: true,
      maxlength: 20,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
  },
  {
    timestamps: true,
    collection: "ingredients",
  }
);

// Secondary index for filtering inventory by status.
IngredientSchema.index({ stock_status: 1 });

const Ingredient: Model<IIngredient> =
  mongoose.models.Ingredient ||
  mongoose.model<IIngredient>("Ingredient", IngredientSchema);

export default Ingredient;
