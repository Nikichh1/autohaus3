// Seeds the first Super Admin. Run: node --env-file=.env scripts/seed-admin.mjs
// Credentials come from ADMIN_EMAIL / ADMIN_PASSWORD env vars (with safe defaults).
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// A standalone auth instance WITHOUT the Next.js cookie plugin so it runs in a
// plain Node script. We only use it for Better Auth's password hashing/signup.
const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, autoSignIn: false, minPasswordLength: 10 },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
});

const email = (process.env.ADMIN_EMAIL ?? "chavdarov08@gmail.com").toLowerCase();
const password = process.env.ADMIN_PASSWORD ?? "AutoHaus!Admin2026";
const name = process.env.ADMIN_NAME ?? "Super Admin";

const existing = await prisma.user.findUnique({ where: { email } });

if (existing) {
  await prisma.user.update({
    where: { email },
    data: { role: "super_admin", emailVerified: true, banned: false },
  });
  console.log(`✓ Existing user promoted to super_admin: ${email}`);
} else {
  await auth.api.signUpEmail({ body: { email, password, name } });
  await prisma.user.update({
    where: { email },
    data: { role: "super_admin", emailVerified: true },
  });
  console.log("✓ Super Admin created");
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}`);
  console.log("  → Change this password after first login.");
}

await prisma.$disconnect();
