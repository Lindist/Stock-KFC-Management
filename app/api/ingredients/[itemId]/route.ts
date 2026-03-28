import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";
import { defaultAlertThreshold, deriveIngredientStockStatus } from "@/lib/inventory-utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await context.params;
    const body = await request.json();
    const nextItemId = String(body.itemId ?? "").trim();
    const itemName = String(body.itemName ?? "").trim();
    const unit = String(body.unit ?? "").trim();
    const expiryDate = String(body.expiryDate ?? "").trim();
    const cost = Number(body.cost ?? 0);
    const currentQty = Number(body.currentQty ?? 0);
    const maxQty = Number(body.maxQty ?? 0);
    const alertThreshold = Number(body.alertThreshold ?? defaultAlertThreshold(maxQty));

    if (!nextItemId || !itemName || !unit || !expiryDate || Number.isNaN(cost) || Number.isNaN(currentQty) || Number.isNaN(maxQty) || Number.isNaN(alertThreshold) || maxQty <= 0) {
      return NextResponse.json({ error: "Invalid ingredient payload" }, { status: 400 });
    }

    if (currentQty > maxQty) {
      return NextResponse.json({ error: "Current quantity cannot exceed max quantity" }, { status: 400 });
    }

    await connectDB();

    if (nextItemId !== itemId) {
      const duplicate = await Ingredient.findOne({ item_id: nextItemId });
      if (duplicate) {
        return NextResponse.json({ error: "Ingredient ID already exists" }, { status: 409 });
      }
    }

    const ingredient = await Ingredient.findOneAndUpdate(
      { item_id: itemId },
      {
        item_id: nextItemId,
        item_name: itemName,
        unit,
        cost,
        expiry_date: new Date(expiryDate),
        current_qty: currentQty,
        max_qty: maxQty,
        alert_threshold: alertThreshold,
        stock_status: deriveIngredientStockStatus(currentQty, maxQty),
      },
      { returnDocument: "after" }
    );

    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    return NextResponse.json(ingredient);
  } catch (error) {
    console.error("Error updating ingredient:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ itemId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await context.params;

    await connectDB();
    const ingredient = await Ingredient.findOneAndDelete({ item_id: itemId });

    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ingredient:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
