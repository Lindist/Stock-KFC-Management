import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const thresholds = Array.isArray(body.thresholds) ? body.thresholds : [];

    await connectDB();

    for (const item of thresholds) {
      const itemId = String(item.itemId ?? "").trim();
      const alertThreshold = Number(item.alertThreshold ?? 0);
      if (!itemId || Number.isNaN(alertThreshold) || alertThreshold < 0) {
        continue;
      }

      await Ingredient.updateOne(
        { item_id: itemId },
        { $set: { alert_threshold: alertThreshold } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating ingredient thresholds:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
