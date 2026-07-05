"use server";

import crypto from "crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { provisionAuth } from "@/lib/auth-provision";
import { requirePermission } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";
import { ROLES, ROLE_LABELS, isRole } from "@/lib/admin/constants";

export type UserResult =
  | { ok: true; tempPassword?: string }
  | { ok: false; error: string };

const createSchema = z.object({
  name: z.string().trim().min(2, "Въведете име").max(80),
  email: z.string().trim().email("Невалиден имейл").max(160),
  role: z.enum(ROLES),
});

function tempPassword(): string {
  // ≥10 chars, includes letters/symbol/digits to satisfy any policy.
  return `Ah!${crypto.randomBytes(9).toString("base64url")}9`;
}

async function superAdminCount(): Promise<number> {
  return prisma.user.count({ where: { role: "super_admin" } });
}

export async function createUser(data: unknown): Promise<UserResult> {
  try {
    const actor = await requirePermission("user.manage");
    const parsed = createSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
    const { name, email, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return { ok: false, error: "Потребител с този имейл вече съществува." };

    const password = tempPassword();
    await provisionAuth.api.signUpEmail({ body: { email: email.toLowerCase(), password, name } });
    await prisma.user.update({
      where: { email: email.toLowerCase() },
      data: { role, emailVerified: true },
    });

    await writeAudit({
      actor,
      action: "user.create",
      entityType: "user",
      summary: `Създаде потребител ${email} (${ROLE_LABELS[role]})`,
    });
    revalidatePath("/admin/users");
    return { ok: true, tempPassword: password };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка при създаване." };
  }
}

export async function setUserRole(userId: string, role: string): Promise<UserResult> {
  try {
    const actor = await requirePermission("user.manage");
    if (!isRole(role)) return { ok: false, error: "Невалидна роля." };
    if (userId === actor.id) return { ok: false, error: "Не можете да промените собствената си роля." };

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
    if (!target) return { ok: false, error: "Потребителят не е намерен." };
    if (target.role === "super_admin" && role !== "super_admin" && (await superAdminCount()) <= 1) {
      return { ok: false, error: "Трябва да има поне един супер админ." };
    }

    await prisma.user.update({ where: { id: userId }, data: { role } });
    await writeAudit({
      actor,
      action: "user.role",
      entityType: "user",
      entityId: userId,
      summary: `Промени ролята на ${target.email} → ${ROLE_LABELS[role]}`,
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function setUserBanned(userId: string, banned: boolean): Promise<UserResult> {
  try {
    const actor = await requirePermission("user.manage");
    if (userId === actor.id) return { ok: false, error: "Не можете да блокирате себе си." };
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
    if (!target) return { ok: false, error: "Потребителят не е намерен." };
    if (banned && target.role === "super_admin" && (await superAdminCount()) <= 1) {
      return { ok: false, error: "Не можете да блокирате последния супер админ." };
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { banned } }),
      // Revoke active sessions when banning.
      ...(banned ? [prisma.session.deleteMany({ where: { userId } })] : []),
    ]);
    await writeAudit({
      actor,
      action: banned ? "user.ban" : "user.unban",
      entityType: "user",
      entityId: userId,
      summary: `${banned ? "Блокира" : "Отблокира"} ${target.email}`,
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function deleteUser(userId: string): Promise<UserResult> {
  try {
    const actor = await requirePermission("user.manage");
    if (userId === actor.id) return { ok: false, error: "Не можете да изтриете себе си." };
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, email: true } });
    if (!target) return { ok: false, error: "Потребителят не е намерен." };
    if (target.role === "super_admin" && (await superAdminCount()) <= 1) {
      return { ok: false, error: "Не можете да изтриете последния супер админ." };
    }

    await prisma.user.delete({ where: { id: userId } });
    await writeAudit({
      actor,
      action: "user.delete",
      entityType: "user",
      entityId: userId,
      summary: `Изтри потребител ${target.email}`,
    });
    revalidatePath("/admin/users");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}
