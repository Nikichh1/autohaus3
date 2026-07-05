"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";
import { deleteUpload } from "@/lib/admin/storage";

export type ActionResult = { ok: true } | { ok: false; error: string };

const updateSchema = z.object({
  alt: z.string().trim().max(300).optional(),
  folder: z
    .string()
    .trim()
    .max(60)
    .transform((v) => v.toLowerCase().replace(/[^a-z0-9Ѐ-ӿ -]/g, "") || "general")
    .optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(40).optional(),
});

export async function updateMediaAsset(id: string, data: unknown): Promise<ActionResult> {
  try {
    await requirePermission("media.upload");
    const parsed = updateSchema.safeParse(data);
    if (!parsed.success) return { ok: false, error: "Невалидни данни." };
    const { alt, folder, tags } = parsed.data;
    await prisma.mediaAsset.update({
      where: { id },
      data: {
        ...(alt !== undefined ? { alt: alt || null } : {}),
        ...(folder !== undefined ? { folder } : {}),
        ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      },
    });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function deleteMediaAsset(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("media.upload");
    const asset = await prisma.mediaAsset.findUnique({ where: { id }, select: { url: true, originalName: true } });
    if (asset) await deleteUpload(asset.url);
    await prisma.mediaAsset.delete({ where: { id } });
    await writeAudit({
      actor: user,
      action: "media.delete",
      entityType: "media",
      entityId: id,
      summary: `Изтри файл ${asset?.originalName ?? ""}`.trim(),
    });
    revalidatePath("/admin/media");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}
