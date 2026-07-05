import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "@/lib/db";

// On Vercel, VERCEL_PROJECT_PRODUCTION_URL is the STABLE production domain
// (e.g. autohaus.vercel.app); VERCEL_URL is the unique per-deployment URL.
// Prefer an explicit override, then the stable production domain.
const vercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL;
const vercelUrl = process.env.VERCEL_URL;
const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (vercelProd ? `https://${vercelProd}` : undefined) ??
  (vercelUrl ? `https://${vercelUrl}` : undefined);

// Trust the production domain AND the current deployment/preview URL, so sign-in
// works whether the site is opened via the clean domain or a *.vercel.app URL —
// without anyone having to set BETTER_AUTH_URL by hand. On Vercel we also trust
// any *.vercel.app subdomain (better-auth supports wildcard origin patterns), so
// preview/alias URLs like autohaus-copy.vercel.app work out of the box too.
const trustedOrigins = [
  process.env.BETTER_AUTH_URL,
  process.env.NEXT_PUBLIC_APP_URL,
  vercelProd ? `https://${vercelProd}` : undefined,
  vercelUrl ? `https://${vercelUrl}` : undefined,
  process.env.VERCEL ? "https://*.vercel.app" : undefined,
].filter((v): v is string => Boolean(v));
const secret =
  process.env.BETTER_AUTH_SECRET ??
  process.env.NEXT_PUBLIC_BETTER_AUTH_SECRET ??
  "autohaus-development-secret";

if (!process.env.BETTER_AUTH_SECRET) {
  console.warn(
    "BETTER_AUTH_SECRET is not set. Using a fallback secret for build/deploy only. Set BETTER_AUTH_SECRET in production.",
  );
}

/**
 * Better Auth — server instance.
 * Email/password auth backed by Prisma (PostgreSQL / Neon).
 * `role` is an additional user field (not client-settable) used by the RBAC layer.
 */
export const auth = betterAuth({
  appName: "AutoHaus Admin",
  secret,
  baseURL,
  ...(trustedOrigins.length ? { trustedOrigins } : {}),
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
    cookieCache: { enabled: true, maxAge: 5 * 60 }, // 5-min signed cache to cut DB reads
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "read_only",
        input: false, // never set by the client; only by admins server-side
      },
    },
  },

  advanced: {
    cookiePrefix: "autohaus",
  },

  // nextCookies() must be the LAST plugin — it flushes Set-Cookie from server actions.
  plugins: [nextCookies()],
});

export type AuthSession = typeof auth.$Infer.Session;
