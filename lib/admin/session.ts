import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, canAccessAdmin, type Permission } from "./rbac";
import type { Role } from "./constants";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
};

/** Read the current session on the server. Cached per request. Returns null if none. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const u = session.user as typeof session.user & { role?: string };
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image ?? null,
    role: (u.role as Role) ?? "read_only",
  };
});

/** Require an authenticated admin user; redirect to login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (!canAccessAdmin(user.role)) redirect("/admin/login?error=forbidden");
  return user;
}

/** Require a specific permission; throws (→ 403) inside server actions. */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!hasPermission(user.role, permission)) {
    throw new Error(`Forbidden: missing permission "${permission}"`);
  }
  return user;
}

export { hasPermission, type Permission };
