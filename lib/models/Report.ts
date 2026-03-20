import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReport extends Document {
  report_id: string;
  generated_by: string;   // FK → User.user_id
  report_type: string;
  generate_time: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    report_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 15,
    },
    generated_by: {
      type: String,
      required: true,
      maxlength: 10,
      ref: "User",
    },
    report_type: {
      type: String,
      required: true,
      maxlength: 30,
      enum: ["stock_summary", "purchase_order", "stock_deduction", "low_stock"],
    },
    generate_time: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

// Indexes
ReportSchema.index({ report_id: 1 });
ReportSchema.index({ generated_by: 1 });
ReportSchema.index({ report_type: 1 });
ReportSchema.index({ generate_time: -1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
