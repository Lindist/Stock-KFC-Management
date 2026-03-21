import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import StockDeduction from "@/lib/models/StockDeduction";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        
        await connectDB();

        const transaction_id = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
        const user_id = session.user.id;

        const deductions = body.items.map((item: any) => ({
            transaction_id,
            item_id: item.item_id,
            user_id,
            deduct_qty: Number(item.quantity),
            status: "pending",
        }));

        const result = await StockDeduction.insertMany(deductions);
        return NextResponse.json({ success: true, transaction_id, items: result });
    } catch (error) {
        console.error("Error saving request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        let filter: any = {};
        if (session.user.role === "staff") {
            // Staff sees only their requests
            filter = { user_id: session.user.id };
        }

        const deductions = await StockDeduction.find(filter).sort({ deduct_time: -1 }).lean();
        const ingredients = await Ingredient.find({}).lean();
        const ingredientMap = new Map(ingredients.map(i => [i.item_id, i]));

        // Group by transaction_id
        const grouped = deductions.reduce((acc: any, curr: any) => {
            if (!acc[curr.transaction_id]) {
                acc[curr.transaction_id] = {
                    requestId: curr.transaction_id,
                    userId: curr.user_id,
                    userName: session.user.name, // Displaying current user's name for their requests
                    status: curr.status === "pending" ? "รออนุมัติ" : curr.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ",
                    createdAt: curr.deduct_time,
                    items: []
                };
            }
            
            const ingItem: any = ingredientMap.get(curr.item_id);
            acc[curr.transaction_id].items.push({
                item_id: curr.item_id,
                name: ingItem ? ingItem.item_name : curr.item_id,
                unit: ingItem ? ingItem.unit : "",
                quantity: curr.deduct_qty
            });
            
            return acc;
        }, {});

        const requests = Object.values(grouped).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return NextResponse.json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
