import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  user_id: string;
  username: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
  fail_count: number;
  lock_time: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    user_id: {
      type: String,
      required: true,
      unique: true,
      maxlength: 10,
    },
    username: {
      type: String,
      required: true,
      unique: true,
      maxlength: 50,
    },
    password: {
      type: String,
      required: true,
      maxlength: 255,
    },
    full_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      maxlength: 10,
    },
    role: {
      type: String,
      required: true,
      maxlength: 20,
      enum: ["admin", "manager", "staff", "store"],
      default: "staff",
    },
    fail_count: {
      type: Number,
      default: 0,
    },
    lock_time: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "users",
  }
);

// Additional indexes for frequent lookups can be added here if needed.

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
