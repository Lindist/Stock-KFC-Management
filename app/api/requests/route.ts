import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { getSession } from "@/lib/auth/auth";

const uri = process.env.MONGODB_URI!;

let mongoClient: MongoClient;
function getMongoClient() {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri, {
            tls: true,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
        });
    }
    return mongoClient;
}

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const client = getMongoClient();
        const db = client.db();
        const collection = db.collection("material_requests");

        const newRequest = {
            requestId: `REQ-${Math.floor(100 + Math.random() * 900)}`,
            items: body.items, // Ensure it's an array of items
            userId: session.user.id,
            userName: session.user.name,
            status: "รออนุมัติ", // pending
            createdAt: new Date(),
        };

        const result = await collection.insertOne(newRequest);
        return NextResponse.json({ success: true, request: newRequest });
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

        const client = getMongoClient();
        const db = client.db();
        const collection = db.collection("material_requests");

        let filter = {};
        if (session.user.role === "staff") {
            // Staff sees only their requests
            filter = { userId: session.user.id };
        }

        const requests = await collection.find(filter).sort({ createdAt: -1 }).toArray();
        return NextResponse.json(requests);
    } catch (error) {
        console.error("Error fetching requests:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
