import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import LowStockAlert from "@/lib/models/LowStockAlert";
import { buildLowStockAlertId, deriveLowStockAlertType } from "@/lib/low-stock-alert-utils";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const thresholds = Array.isArray(body.thresholds) ? body.thresholds : [];

    await connectDB();

    const updatedItems = [];
    const processedItemIds = new Set<string>();

    for (const item of thresholds) {
      const itemId = String(item.itemId ?? "").trim();
      const alertThreshold = Number(item.alertThreshold ?? 0);
      if (!itemId || Number.isNaN(alertThreshold) || alertThreshold < 0) {
        continue;
      }

      const ingredient = await Ingredient.findOneAndUpdate(
        { item_id: itemId },
        { $set: { alert_threshold: alertThreshold } },
        { returnDocument: "after" }
      );

      if (!ingredient) {
        continue;
      }

      const alertType = deriveLowStockAlertType(ingredient.current_qty, alertThreshold);

      await LowStockAlert.deleteMany({
        item_id: ingredient.item_id,
        alert_type: { $in: ["low_stock", "out_of_stock"] },
      });

      if (alertType) {
        await LowStockAlert.create({
          alert_id: buildLowStockAlertId(ingredient.item_id, alertType),
          item_id: ingredient.item_id,
          alert_type: alertType,
          alert_qty: ingredient.current_qty,
          alert_time: new Date(),
        });
      }

      updatedItems.push({
        itemId: ingredient.item_id,
        itemName: ingredient.item_name,
        alertThreshold: ingredient.alert_threshold ?? alertThreshold,
        currentQty: ingredient.current_qty,
      });
      processedItemIds.add(ingredient.item_id);
    }

    const syncedAlerts = processedItemIds.size
      ? await LowStockAlert.find({ item_id: { $in: Array.from(processedItemIds) } }).sort({ alert_time: -1 })
      : [];

    return NextResponse.json({
      success: true,
      items: updatedItems,
      alerts: syncedAlerts.map((item) => ({
        alertId: item.alert_id,
        itemId: item.item_id,
        alertType: item.alert_type,
        alertQty: item.alert_qty,
        alertTime: item.alert_time.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error updating ingredient thresholds:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
