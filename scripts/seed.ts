import mongoose from "mongoose";
import * as dotenv from "dotenv";
import connectDB from "../lib/db";
import Ingredient from "../lib/models/Ingredient";

// Load environment variables from .env or .env.local
dotenv.config({ path: ".env.local" });
dotenv.config();

const mockIngredients = [
  {
    item_id: "ING001",
    item_name: "Original Recipe Chicken Pieces",
    unit: "pieces",
    cost: 15.50,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)), // 1 month from now
    current_qty: 500,
    stock_status: "in_stock",
  },
  {
    item_id: "ING002",
    item_name: "Zinger Fillet",
    unit: "pieces",
    cost: 20.00,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    current_qty: 300,
    stock_status: "in_stock",
  },
  {
    item_id: "ING003",
    item_name: "French Fries",
    unit: "kg",
    cost: 50.00,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 3)),
    current_qty: 150,
    stock_status: "in_stock",
  },
  {
    item_id: "ING004",
    item_name: "Breading Flour",
    unit: "kg",
    cost: 35.00,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    current_qty: 200,
    stock_status: "in_stock",
  },
  {
    item_id: "ING005",
    item_name: "Cooking Oil",
    unit: "liters",
    cost: 80.00,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 4)),
    current_qty: 400,
    stock_status: "in_stock",
  },
  {
    item_id: "ING006",
    item_name: "Lettuce",
    unit: "kg",
    cost: 40.00,
    expiry_date: new Date(new Date().setDate(new Date().getDate() + 5)), // 5 days from now
    current_qty: 20,
    stock_status: "low_stock",
  },
  {
    item_id: "ING007",
    item_name: "Mayonnaise",
    unit: "kg",
    cost: 45.00,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 2)),
    current_qty: 50,
    stock_status: "in_stock",
  },
  {
    item_id: "ING008",
    item_name: "Burger Buns",
    unit: "pieces",
    cost: 5.00,
    expiry_date: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    current_qty: 600,
    stock_status: "in_stock",
  },
  {
    item_id: "ING009",
    item_name: "Pepsi Syrup",
    unit: "liters",
    cost: 120.00,
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 6)),
    current_qty: 0,
    stock_status: "out_of_stock",
  },
  {
    item_id: "ING010",
    item_name: "Paper Cups (L)",
    unit: "pieces",
    cost: 1.50,
    expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 2)), // 2 years expiry date for packaging
    current_qty: 1000,
    stock_status: "in_stock",
  }
];

async function seed() {
  try {
    // Connect to database
    await connectDB();
    console.log("Connected to MongoDB successfully");

    // Clear existing data (optional, but good for resetting state)
    await Ingredient.deleteMany({});
    console.log("Cleared existing ingredients data");

    // Insert new mock data
    await Ingredient.insertMany(mockIngredients);
    console.log("Successfully seeded mock ingredients data!");

  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
      console.log("Disconnected from MongoDB");
    }
  }
}

// Run the seed function
seed();
