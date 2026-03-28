import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";

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
    const nextPoId = String(body.poId ?? "").trim();
    const itemId = String(body.itemId ?? "").trim();
    const supplierName = String(body.supplierName ?? "").trim();
    const orderQty = Number(body.orderQty ?? 0);
    const priceTotal = Number(body.priceTotal ?? 0);
    const deliveryDate = String(body.deliveryDate ?? "").trim();
    const receivedQty = Number(body.receivedQty ?? 0);
    const status = String(body.status ?? "pending");

    if (!nextPoId || !itemId || !supplierName || !deliveryDate || Number.isNaN(orderQty) || Number.isNaN(priceTotal) || Number.isNaN(receivedQty)) {
      return NextResponse.json({ error: "Invalid purchase order payload" }, { status: 400 });
    }

    await connectDB();
    const ingredient = await Ingredient.findOne({ item_id: itemId });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    if (nextPoId !== poId) {
      const duplicate = await PurchaseOrder.findOne({ po_id: nextPoId });
      if (duplicate) {
        return NextResponse.json({ error: "PO ID already exists" }, { status: 409 });
      }
    }

    const order = await PurchaseOrder.findOneAndUpdate(
      { po_id: poId },
      {
        po_id: nextPoId,
        item_id: itemId,
        approver_id: session.user.id,
        supplier_name: supplierName,
        order_qty: orderQty,
        price_total: priceTotal,
        delivery_date: new Date(deliveryDate),
        received_qty: receivedQty,
        po_status: status,
      },
      { returnDocument: "after" }
    );

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({
      poId: order.po_id,
      itemId: ingredient.item_id,
      itemName: ingredient.item_name,
      unit: ingredient.unit,
      approverId: order.approver_id,
      approverName: session.user.name ?? session.user.email ?? session.user.id,
      supplierName: order.supplier_name,
      orderQty: order.order_qty,
      receivedQty: order.received_qty,
      priceTotal: order.price_total,
      deliveryDate: order.delivery_date.toISOString(),
      status: order.po_status,
    });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ poId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { poId } = await context.params;
    await connectDB();
    const order = await PurchaseOrder.findOneAndDelete({ po_id: poId });

    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
