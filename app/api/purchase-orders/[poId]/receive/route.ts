import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import { getSession } from "@/lib/auth/auth";
import { deriveIngredientStockStatus } from "@/lib/inventory-utils";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ poId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { poId } = await context.params;
    const body = await request.json();
    const receivedQty = Number(body.receivedQty ?? 0);

    if (Number.isNaN(receivedQty) || receivedQty < 0) {
      return NextResponse.json({ error: "Invalid received quantity" }, { status: 400 });
    }

    await connectDB();
    const order = await PurchaseOrder.findOne({ po_id: poId });
    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const ingredient = await Ingredient.findOne({ item_id: order.item_id });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    const quantityDiff = receivedQty - (order.received_qty ?? 0);
    const nextQty = ingredient.current_qty + quantityDiff;
    const nextMaxQty = Math.max(ingredient.max_qty ?? 0, nextQty);

    ingredient.current_qty = nextQty;
    ingredient.max_qty = nextMaxQty;
    ingredient.stock_status = deriveIngredientStockStatus(nextQty, nextMaxQty, ingredient.expiry_date);
    await ingredient.save();

    order.received_qty = receivedQty;
    order.po_status = "received";
    await order.save();

    return NextResponse.json({
      poId: order.po_id,
      itemId: ingredient.item_id,
      itemName: ingredient.item_name,
      unit: ingredient.unit,
      approverId: order.approver_id,
      approverName: order.supplier_name,
      supplierName: order.supplier_name,
      orderQty: order.order_qty,
      receivedQty: order.received_qty,
      priceTotal: order.price_total,
      createdAt: order.createdAt?.toISOString() ?? new Date().toISOString(),
      deliveryDate: order.delivery_date ? order.delivery_date.toISOString() : "",
      status: order.po_status,
      ingredient: {
        itemId: ingredient.item_id,
        currentQty: ingredient.current_qty,
        maxQty: ingredient.max_qty,
        stockStatus: ingredient.stock_status,
      },
    });
  } catch (error) {
    console.error("Error receiving purchase order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
