import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import StockDeduction from "@/lib/models/StockDeduction";
import { getSession } from "@/lib/auth/auth";
import { deriveIngredientStockStatus } from "@/lib/inventory-utils";

function createTransactionId() {
  const timePart = Date.now().toString().slice(-8);
  const randomPart = Math.floor(100 + Math.random() * 900).toString();
  return `REQ-${timePart}${randomPart}`.slice(0, 15);
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const items = Array.isArray(body.items) ? body.items : [];
    const status = body.status === "approved" ? "approved" : "pending";

    if (items.length === 0) {
      return NextResponse.json({ error: "No deduction items submitted" }, { status: 400 });
    }

    await connectDB();
    const transactionId = createTransactionId();
    const timestamp = new Date();
    const createdRows = [];

    for (const item of items) {
      const itemId = String(item.itemId ?? "").trim();
      const deductQty = Number(item.deductQty ?? 0);
      const note = typeof item.note === "string" ? item.note : undefined;

      if (!itemId || Number.isNaN(deductQty) || deductQty <= 0) {
        continue;
      }

      const ingredient = await Ingredient.findOne({ item_id: itemId });
      if (!ingredient) {
        continue;
      }

      if (status === "approved") {
        const nextQty = Math.max(0, ingredient.current_qty - deductQty);
        ingredient.current_qty = nextQty;
        ingredient.stock_status = deriveIngredientStockStatus(nextQty, ingredient.max_qty ?? 0);
        await ingredient.save();
      }

      const record = await StockDeduction.create({
        transaction_id: transactionId,
        item_id: itemId,
        user_id: session.user.id,
        deduct_qty: deductQty,
        deduct_time: timestamp,
        status,
        note,
      });

      createdRows.push({
        transactionId: record.transaction_id,
        itemId: ingredient.item_id,
        itemName: ingredient.item_name,
        userId: record.user_id,
        requestedBy: session.user.name ?? session.user.email ?? session.user.id,
        deductQty: record.deduct_qty,
        deductTime: record.deduct_time.toISOString(),
        status: record.status,
        note: record.note,
      });
    }

    return NextResponse.json({ transactionId, items: createdRows }, { status: 201 });
  } catch (error) {
    console.error("Error creating stock deductions:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
