import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Ingredient from "@/lib/models/Ingredient";
import { getSession } from "@/lib/auth/auth";

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
