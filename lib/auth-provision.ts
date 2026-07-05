import "server-only";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db";

const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const secret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_SECRET ??
  "autohaus-development-secret";

if (!process.env.BETTER_AUTH_SECRET) {
  console.warn(
    "BETTER_AUTH_SECRET is not set for provisionAuth. Using a fallback secret for build/deploy only. Set BETTER_AUTH_SECRET in production.",
  );
}

/**
 * A cookie-free Better Auth instance used ONLY to provision new users from the
 * admin (it has no nextCookies plugin and autoSignIn is off, so creating a user
 * never touches the acting admin's session). Password hashing matches the main
 * auth instance, so provisioned users can sign in normally.
 */
export const provisionAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "sqlite" }),
  emailAndPassword: { enabled: true, autoSignIn: false, minPasswordLength: 10 },
  secret,
  baseURL,
});
