import mongoose from "mongoose";
import * as dotenv from "dotenv";
import connectDB from "../lib/db";
import Ingredient from "../lib/models/Ingredient";
import User from "../lib/models/User";
import LowStockAlert from "../lib/models/LowStockAlert";
import PurchaseOrder from "../lib/models/PurchaseOrder";
import Report from "../lib/models/Report";

dotenv.config({ path: ".env.local" });
dotenv.config();

const now = new Date();

const mockUsers = [
  {
    user_id: "USR001",
    username: "admin.kfc",
    password: "admin123",
    full_name: "KFC Admin",
    phone: "0812345678",
    role: "admin",
    fail_count: 0,
    lock_time: null,
  },
  {
    user_id: "USR002",
    username: "manager.kfc",
    password: "manager123",
    full_name: "Branch Manager",
    phone: "0898765432",
    role: "manager",
    fail_count: 0,
    lock_time: null,
  },
  {
    user_id: "USR003",
    username: "staff.kfc",
    password: "staff123",
    full_name: "Inventory Staff",
    phone: "0823456789",
    role: "staff",
    fail_count: 0,
    lock_time: null,
  },
];

const mockIngredients = [
  {
    item_id: "ING001",
    item_name: "Original Recipe Chicken Pieces",
    unit: "pieces",
    cost: 15.5,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    current_qty: 500,
    max_qty: 700,
    alert_threshold: 140,
    stock_status: "in_stock",
  },
  {
    item_id: "ING002",
    item_name: "Zinger Fillet",
    unit: "pieces",
    cost: 20.0,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    current_qty: 300,
    max_qty: 450,
    alert_threshold: 90,
    stock_status: "in_stock",
  },
  {
    item_id: "ING003",
    item_name: "French Fries",
    unit: "kg",
    cost: 50.0,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    current_qty: 150,
    max_qty: 220,
    alert_threshold: 44,
    stock_status: "in_stock",
  },
  {
    item_id: "ING004",
    item_name: "Breading Flour",
    unit: "kg",
    cost: 35.0,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    current_qty: 200,
    max_qty: 260,
    alert_threshold: 52,
    stock_status: "in_stock",
  },
  {
    item_id: "ING005",
    item_name: "Cooking Oil",
    unit: "liters",
    cost: 80.0,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 4)),
    current_qty: 400,
    max_qty: 520,
    alert_threshold: 104,
    stock_status: "in_stock",
  },
  {
    item_id: "ING006",
    item_name: "Lettuce",
    unit: "kg",
    cost: 40.0,
    expiry_date: new Date(new Date().setDate(new Date().getDate() + 5)),
    current_qty: 20,
    max_qty: 90,
    alert_threshold: 18,
    stock_status: "low_stock",
  },
  {
    item_id: "ING007",
    item_name: "Mayonnaise",
    unit: "kg",
    cost: 45.0,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    current_qty: 50,
    max_qty: 120,
    alert_threshold: 24,
    stock_status: "in_stock",
  },
  {
    item_id: "ING008",
    item_name: "Burger Buns",
    unit: "pieces",
    cost: 5.0,
    expiry_date: new Date(new Date().setDate(new Date().getDate() + 7)),
    current_qty: 600,
    max_qty: 900,
    alert_threshold: 180,
    stock_status: "in_stock",
  },
  {
    item_id: "ING009",
    item_name: "Pepsi Syrup",
    unit: "liters",
    cost: 120.0,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    current_qty: 0,
    max_qty: 180,
    alert_threshold: 36,
    stock_status: "out_of_stock",
  },
  {
    item_id: "ING010",
    item_name: "Paper Cups (L)",
    unit: "pieces",
    cost: 1.5,
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    current_qty: 1000,
    max_qty: 1400,
    alert_threshold: 280,
    stock_status: "in_stock",
  },
];

const mockLowStockAlerts = [
  {
    alert_id: "ALT001",
    item_id: "ING006",
    alert_type: "low_stock",
    alert_qty: 20,
    alert_time: new Date(now.getTime() - 1000 * 60 * 60 * 2),
  },
  {
    alert_id: "ALT002",
    item_id: "ING009",
    alert_type: "out_of_stock",
    alert_qty: 0,
    alert_time: new Date(now.getTime() - 1000 * 60 * 60 * 6),
  },
];

const mockPurchaseOrders = [
  {
    po_id: "PO001",
    item_id: "ING006",
    approver_id: "USR002",
    supplier_name: "Fresh Farm Supplier",
    order_qty: 40,
    price_total: 1600,
    delivery_date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
    po_status: "pending",
    received_qty: 0,
  },
  {
    po_id: "PO002",
    item_id: "ING009",
    approver_id: "USR002",
    supplier_name: "Pepsi Beverage Thailand",
    order_qty: 25,
    price_total: 3000,
    delivery_date: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
    po_status: "arrived",
    received_qty: 25,
  },
  {
    po_id: "PO003",
    item_id: "ING003",
    approver_id: "USR001",
    supplier_name: "Frozen Foods Partner",
    order_qty: 80,
    price_total: 4000,
    delivery_date: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 1),
    po_status: "received",
    received_qty: 80,
  },
];

const mockReports = [
  {
    report_id: "RPT001",
    generated_by: "USR002",
    report_type: "stock_summary",
    generate_time: new Date(now.getTime() - 1000 * 60 * 30),
  },
  {
    report_id: "RPT002",
    generated_by: "USR001",
    report_type: "purchase_order",
    generate_time: new Date(now.getTime() - 1000 * 60 * 60 * 5),
  },
  {
    report_id: "RPT003",
    generated_by: "USR002",
    report_type: "low_stock",
    generate_time: new Date(now.getTime() - 1000 * 60 * 60 * 24),
  },
  {
    report_id: "RPT004",
    generated_by: "USR003",
    report_type: "stock_deduction",
    generate_time: new Date(now.getTime() - 1000 * 60 * 60 * 36),
  },
];

async function seed() {
  try {
    await connectDB();
    console.log("Connected to MongoDB successfully");

    await Promise.all([
      Report.deleteMany({}),
      PurchaseOrder.deleteMany({}),
      LowStockAlert.deleteMany({}),
      Ingredient.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log("Cleared existing seed data");

    await User.insertMany(mockUsers);
    console.log(`Seeded ${mockUsers.length} users`);

    await Ingredient.insertMany(mockIngredients);
    console.log(`Seeded ${mockIngredients.length} ingredients`);

    await LowStockAlert.insertMany(mockLowStockAlerts);
    console.log(`Seeded ${mockLowStockAlerts.length} low stock alerts`);

    await PurchaseOrder.insertMany(mockPurchaseOrders);
    console.log(`Seeded ${mockPurchaseOrders.length} purchase orders`);

    await Report.insertMany(mockReports);
    console.log(`Seeded ${mockReports.length} reports`);

    console.log("Database seeding completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("Disconnected from MongoDB");
    }
  }
}

seed();
