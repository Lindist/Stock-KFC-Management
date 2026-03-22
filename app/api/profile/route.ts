import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import { MongoClient } from "mongodb";

function getMongoClient(): MongoClient {
    const uri = process.env.MONGODB_URI!;
    return new MongoClient(uri, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
    });
}

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

        // Update user in better-auth's user collection directly
        const client = getMongoClient();
        try {
            await client.connect();
            const db = client.db();

            const updateFields: Record<string, string> = {};
            if (name !== undefined) updateFields.name = name;
            if (phone !== undefined) updateFields.phone = phone;
            if (image !== undefined) updateFields.image = image;

            if (Object.keys(updateFields).length === 0) {
                return NextResponse.json({ error: "No fields to update" }, { status: 400 });
            }

            await db.collection("user").updateOne(
                { _id: session.user.id as any },
                { $set: { ...updateFields, updatedAt: new Date() } }
            );

            return NextResponse.json({ success: true, updated: updateFields });
        } finally {
            await client.close();
        }
    } catch (error) {
        console.error("Profile PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
