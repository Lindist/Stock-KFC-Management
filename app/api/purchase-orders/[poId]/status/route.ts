import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import { getSession } from "@/lib/auth/auth";
import type { PurchaseOrderStatus } from "@/lib/types/dashboard";

const validStatuses: PurchaseOrderStatus[] = ["pending", "arrived"];

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
    const nextStatus = String(body.status ?? "").trim() as PurchaseOrderStatus;

    if (!validStatuses.includes(nextStatus)) {
      return NextResponse.json({ error: "Invalid purchase order status" }, { status: 400 });
    }

    await connectDB();
    const order = await PurchaseOrder.findOne({ po_id: poId });
    if (!order) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    if (session.user.role === "store" && order.approver_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ingredient = await Ingredient.findOne({ item_id: order.item_id });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    order.po_status = nextStatus;
    order.delivery_date = nextStatus === "arrived" ? new Date() : null;
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
    });
  } catch (error) {
    console.error("Error updating purchase order status:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
