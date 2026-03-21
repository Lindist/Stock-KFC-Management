import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI!;

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

const getBaseURL = () => {
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET!,
    baseURL: getBaseURL(),
    database: mongodbAdapter(db),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60,
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