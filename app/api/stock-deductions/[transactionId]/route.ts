import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import StockDeduction from "@/lib/models/StockDeduction";
import { getSession } from "@/lib/auth/auth";
import { deriveIngredientStockStatus } from "@/lib/inventory-utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ transactionId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { transactionId } = await context.params;
    const body = await request.json();
    const status = body.status === "approved" ? "approved" : body.status === "rejected" ? "rejected" : "";

    if (!status) {
      return NextResponse.json({ error: "Invalid status update" }, { status: 400 });
    }

    await connectDB();
    const deductions = await StockDeduction.find({ transaction_id: transactionId });
    if (deductions.length === 0) {
      return NextResponse.json({ error: "Stock deduction request not found" }, { status: 404 });
    }

    if (status === "approved") {
      for (const record of deductions) {
        if (record.status !== "pending") continue;
        const ingredient = await Ingredient.findOne({ item_id: record.item_id });
        if (!ingredient) continue;

        const nextQty = Math.max(0, ingredient.current_qty - record.deduct_qty);
        ingredient.current_qty = nextQty;
        ingredient.stock_status = deriveIngredientStockStatus(nextQty, ingredient.max_qty ?? 0, ingredient.expiry_date);
        await ingredient.save();
      }
    }

    await StockDeduction.updateMany(
      { transaction_id: transactionId },
      { $set: { status } }
    );

    const updated = await StockDeduction.find({ transaction_id: transactionId });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating stock deduction:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
