import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;
const staticBaseURL = process.env.BETTER_AUTH_URL?.trim();

function toOrigin(url: string) {
    try {
        return new URL(url).origin;
    } catch {
        return null;
    }
}

// Singleton MongoClient — ป้องกัน connection ซ้ำใน Next.js dev hot-reload
let mongoClient: MongoClient;

function getMongoClient(): MongoClient {
    if (!mongoClient) {
        mongoClient = new MongoClient(uri, {
            tls: true,
            tlsAllowInvalidCertificates: true,
            tlsAllowInvalidHostnames: true,
            serverSelectionTimeoutMS: 10000,
            connectTimeoutMS: 10000,
        });
    }
    return mongoClient;
}

const client = getMongoClient();

// better-auth จะ connect เองผ่าน mongodbAdapter
// ไม่ต้อง await client.connect() เพราะ mongodbAdapter จัดการให้
const db = client.db();

const allowedHosts = Array.from(
    new Set(
        [
            "localhost:3000",
            "localhost:3001",
            process.env.VERCEL_URL,
            process.env.VERCEL_PROJECT_PRODUCTION_URL,
            "*.vercel.app",
        ].filter((value): value is string => Boolean(value))
    )
);

const trustedOrigins = Array.from(
    new Set(
        [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://*.vercel.app",
            staticBaseURL ? toOrigin(staticBaseURL) : null,
            process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
            process.env.VERCEL_PROJECT_PRODUCTION_URL
                ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
                : null,
        ].filter((value): value is string => Boolean(value))
    )
);

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: staticBaseURL || {
        allowedHosts,
        protocol: process.env.NODE_ENV === "development" ? "http" : "https",
    },
    trustedOrigins,
    database: mongodbAdapter(db),
    session: {
        cookieCache: {
            enabled: false,
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
    },
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: false,
                defaultValue: "",
            },
            role: {
                type: "string",
                required: false,
                defaultValue: "staff",
            },
            image: {
                type: "string",
                required: false,
                defaultValue: "",
            },
        },
    },
});

export async function getSession() {
    const result = await auth.api.getSession({
        headers: await headers(),
    });
    return result;
}

export async function signOut() {
    const result = await auth.api.signOut({
        headers: await headers(),
    });
    if (result.success) {
        redirect("/sign-in");
    }
}
