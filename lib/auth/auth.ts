import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { MongoClient } from "mongodb";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

const getBaseURL = () => {
    if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
    }
    return process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const auth = betterAuth({
    baseURL: getBaseURL(),
    database: mongodbAdapter(db, {
        client,
    }),
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 60 * 60,
        }
    },
    emailAndPassword: {
        enabled: true,
    }
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