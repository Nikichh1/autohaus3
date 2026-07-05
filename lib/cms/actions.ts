"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";
import { CONTENT_FIELD_MAP, GROUP_ROUTES, type ContentGroupId } from "./registry";

export type CmsResult = { ok: true } | { ok: false; error: string };

const updateSchema = z.array(
  z.object({ key: z.string(), value: z.string().max(4000) }),
);

export async function updateContent(updates: unknown): Promise<CmsResult> {
  try {
    const user = await requirePermission("cms.update");

    const parsed = updateSchema.safeParse(updates);
    if (!parsed.success) return { ok: false, error: "Невалидни данни." };

    // Only registry keys may be written.
    const valid = parsed.data.filter((u) => CONTENT_FIELD_MAP[u.key]);
    if (valid.length === 0) return { ok: false, error: "Няма валидни полета." };

    await prisma.$transaction(
      valid.map((u) =>
        prisma.contentBlock.upsert({
          where: { key: u.key },
          create: { key: u.key, value: u.value, updatedById: user.id },
          update: { value: u.value, updatedById: user.id },
        }),
      ),
    );

    // Revalidate every public route touched by the edited groups.
    const groups = new Set<ContentGroupId>(valid.map((u) => CONTENT_FIELD_MAP[u.key].group));
    const routes = new Set<string>();
    for (const g of groups) for (const r of GROUP_ROUTES[g]) routes.add(r);
    for (const r of routes) revalidatePath(r);
    revalidatePath("/admin/content");

    await writeAudit({
      actor: user,
      action: "cms.update",
      entityType: "content",
      summary: `Обнови съдържание (${valid.length} ${valid.length === 1 ? "поле" : "полета"})`,
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка при запис." };
  }
}
