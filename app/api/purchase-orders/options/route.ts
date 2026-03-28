import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import User from "@/lib/models/User";
import { getSession } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session: any = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const ingredients = await Ingredient.find({}).sort({ item_id: 1 });
    const users = await User.find({ role: "store" }).sort({ full_name: 1 });
    const storeUsers = users.map((user) => ({
      id: user.user_id,
      name: user.full_name,
      role: user.role,
    }));

    if (storeUsers.length === 0 && mongoose.connection?.db) {
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      const nameSet = new Set(collections.map((item) => item.name));
      const authUserCollectionName = ["user", "users"].find((name) => nameSet.has(name));

      if (authUserCollectionName) {
        const authUsersCollection = db.collection(authUserCollectionName);
        const authUsers = await authUsersCollection
          .find({ role: "store" }, { projection: { id: 1, name: 1, email: 1, role: 1, _id: 1 } })
          .toArray();

        for (const user of authUsers) {
          const id =
            typeof user.id === "string"
              ? user.id
              : typeof user._id?.toString === "function"
                ? user._id.toString()
                : "";
          if (!id) continue;

          storeUsers.push({
            id,
            name: typeof user.name === "string" ? user.name : String(user.email ?? id),
            role: "store",
          });
        }
      }
    }

    return NextResponse.json({
      ingredients: ingredients.map((item) => ({
        itemId: item.item_id,
        itemName: item.item_name,
        unit: item.unit,
        cost: item.cost,
      })),
      suppliers: Array.from(
        new Map(storeUsers.map((user) => [user.id, user])).values()
      ),
    });
  } catch (error) {
    console.error("Error fetching purchase order options:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
