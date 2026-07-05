"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";
import { SETTINGS_SCHEMAS, SETTINGS_LABELS, type SettingsGroup } from "./config";

export type SettingsResult = { ok: true } | { ok: false; error: string };

export async function updateSettings(group: SettingsGroup, data: unknown): Promise<SettingsResult> {
  try {
    const user = await requirePermission("settings.manage");

    const schema = SETTINGS_SCHEMAS[group];
    if (!schema) return { ok: false, error: "Невалидна група настройки." };

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
    }

    await prisma.setting.upsert({
      where: { group },
      create: { group, value: JSON.stringify(parsed.data), updatedById: user.id },
      update: { value: JSON.stringify(parsed.data), updatedById: user.id },
    });

    await writeAudit({
      actor: user,
      action: "settings.update",
      entityType: "settings",
      entityId: group,
      summary: `Обнови „${SETTINGS_LABELS[group]}"`,
    });

    // The footer renders in the public layout → revalidate the whole tree, plus
    // the contact page and the admin settings screen. Financing settings also feed
    // every product page's calculator + indicative monthly, so refresh that route
    // pattern explicitly (covers it even if those pages become statically rendered).
    revalidatePath("/", "layout");
    revalidatePath("/kontakti");
    revalidatePath("/avtomobili/[slug]", "page");
    revalidatePath("/admin/settings");

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка при запис." };
  }
}
