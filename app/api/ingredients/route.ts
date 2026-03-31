import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";
import { defaultAlertThreshold, deriveIngredientStockStatus } from "@/lib/inventory-utils";

async function getNextIngredientId() {
    const ingredients = await Ingredient.find(
        { item_id: /^ING\d+$/i },
        { item_id: 1, _id: 0 }
    ).lean();

    const maxId = ingredients.reduce((max, item) => {
        const value = String(item.item_id ?? "");
        const matched = value.match(/^ING(\d+)$/i);
        const numericValue = matched ? Number(matched[1]) : 0;
        return Number.isFinite(numericValue) ? Math.max(max, numericValue) : max;
    }, 0);

    return `ING${String(maxId + 1).padStart(3, "0")}`;
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        // Fetch all ingredients
        const ingredients = await Ingredient.find({}).sort({ item_id: 1 });
        
        return NextResponse.json(ingredients);
    } catch (error) {
        console.error("Error fetching ingredients:", error);
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
        const requestedItemId = String(body.itemId ?? "").trim();
        const itemName = String(body.itemName ?? "").trim();
        const unit = String(body.unit ?? "").trim();
        const expiryDate = String(body.expiryDate ?? "").trim();
        const cost = Number(body.cost ?? 0);
        const currentQty = Number(body.currentQty ?? 0);
        const maxQty = Number(body.maxQty ?? 0);
        const alertThreshold = Number(body.alertThreshold ?? defaultAlertThreshold(maxQty));

        if (!itemName || !unit || !expiryDate || Number.isNaN(cost) || Number.isNaN(currentQty) || Number.isNaN(maxQty) || Number.isNaN(alertThreshold) || maxQty <= 0) {
            return NextResponse.json({ error: "Invalid ingredient payload" }, { status: 400 });
        }

        if (currentQty > maxQty) {
            return NextResponse.json({ error: "Current quantity cannot exceed max quantity" }, { status: 400 });
        }

        await connectDB();

        let itemId = requestedItemId;
        const exists = itemId ? await Ingredient.findOne({ item_id: itemId }) : null;
        if (!itemId || exists) {
            itemId = await getNextIngredientId();
        }

        const ingredient = await Ingredient.create({
            item_id: itemId,
            item_name: itemName,
            unit,
            cost,
            expiry_date: new Date(expiryDate),
            current_qty: currentQty,
            max_qty: maxQty,
            alert_threshold: alertThreshold,
            stock_status: deriveIngredientStockStatus(currentQty, maxQty, expiryDate),
        });

        return NextResponse.json(ingredient, { status: 201 });
    } catch (error) {
        console.error("Error creating ingredient:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
