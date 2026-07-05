import "server-only";
import { prisma } from "@/lib/db";
import { permissionsFor, type Permission } from "./rbac";
import { ROLES } from "./constants";

type NotifyPayload = { type: string; title: string; body?: string; link?: string };

/** Create an in-app notification for every (non-banned) user whose role grants `permission`. */
export async function notifyByPermission(permission: Permission, payload: NotifyPayload): Promise<void> {
  try {
    const roles = ROLES.filter((r) => permissionsFor(r).includes(permission));
    if (roles.length === 0) return;
    const users = await prisma.user.findMany({
      where: { role: { in: roles }, banned: false },
      select: { id: true },
    });
    if (users.length === 0) return;
    await prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        type: payload.type,
        title: payload.title,
        body: payload.body ?? null,
        link: payload.link ?? null,
      })),
    });
  } catch {
    // notifications must never break the triggering action
  }
}
