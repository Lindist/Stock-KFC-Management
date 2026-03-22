import { NextResponse } from "next/server";
import { auth, getSession } from "@/lib/auth/auth";
import { headers } from "next/headers";

export async function GET() {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        return NextResponse.json({ user: session.user });
    } catch (error) {
        console.error("Profile GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { name, phone, image } = body;

        const updateFields: Record<string, string | null> = {};
        if (name !== undefined) updateFields.name = String(name).trim();
        if (phone !== undefined) updateFields.phone = String(phone).trim();
        if (image !== undefined) updateFields.image = image ? String(image) : null;

        if (Object.keys(updateFields).length === 0) {
            return NextResponse.json({ error: "No fields to update" }, { status: 400 });
        }

        const result = await auth.api.updateUser({
            headers: await headers(),
            body: updateFields,
        });

        return NextResponse.json({ success: true, user: result });
    } catch (error) {
        console.error("Profile PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
