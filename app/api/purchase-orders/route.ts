import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import PurchaseOrder from "@/lib/models/PurchaseOrder";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const orders = await PurchaseOrder.find({}).sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const poId = String(body.poId ?? "").trim();
    const itemId = String(body.itemId ?? "").trim();
    const supplierName = String(body.supplierName ?? "").trim();
    const approverId = String(body.approverId ?? "").trim();
    const orderQty = Number(body.orderQty ?? 0);
    const deliveryDate = new Date();

    if (!poId || !itemId || !supplierName || !approverId || Number.isNaN(orderQty) || orderQty <= 0) {
      return NextResponse.json({ error: "Invalid purchase order payload" }, { status: 400 });
    }

    await connectDB();
    const ingredient = await Ingredient.findOne({ item_id: itemId });
    if (!ingredient) {
      return NextResponse.json({ error: "Ingredient not found" }, { status: 404 });
    }

    const exists = await PurchaseOrder.findOne({ po_id: poId });
    if (exists) {
      return NextResponse.json({ error: "PO ID already exists" }, { status: 409 });
    }

    const order = await PurchaseOrder.create({
      po_id: poId,
      item_id: itemId,
      approver_id: approverId,
      supplier_name: supplierName,
      order_qty: orderQty,
      price_total: ingredient.cost * orderQty,
      delivery_date: deliveryDate,
      received_qty: 0,
      po_status: "pending",
    });

    return NextResponse.json({
      poId: order.po_id,
      itemId: ingredient.item_id,
      itemName: ingredient.item_name,
      unit: ingredient.unit,
      approverId: order.approver_id,
      approverName: supplierName,
      supplierName,
      orderQty: order.order_qty,
      receivedQty: order.received_qty,
      priceTotal: order.price_total,
      deliveryDate: order.delivery_date.toISOString(),
      status: order.po_status,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
