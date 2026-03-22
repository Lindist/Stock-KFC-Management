import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/auth";
import path from "path";
import fs from "fs/promises";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: "Invalid file type. Only JPG, PNG, WEBP allowed" },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File too large. Max 2MB" },
                { status: 400 }
            );
        }

        // Generate unique filename
        const ext = file.name.split(".").pop() || "png";
        const filename = `${session.user.id}-${Date.now()}.${ext}`;

        // Write file to public/uploads/avatars/
        const uploadsDir = path.join(process.cwd(), "public", "uploads", "avatars");
        await fs.mkdir(uploadsDir, { recursive: true });

        const buffer = Buffer.from(await file.arrayBuffer());
        const filePath = path.join(uploadsDir, filename);
        await fs.writeFile(filePath, buffer);

        const url = `/uploads/avatars/${filename}`;

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }
}
