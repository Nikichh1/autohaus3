import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import {
  DEFAULT_SETTINGS,
  SETTINGS_SCHEMAS,
  SETTINGS_GROUPS,
  type SiteSettings,
  type SettingsGroup,
} from "./config";

/** Public route tags revalidated when settings change (footer is on every page). */
export const SETTINGS_TAG = "site-settings";

/**
 * Merged settings: stored values over defaults, validated per group (a corrupt
 * row falls back to defaults). React cache() dedupes within one render.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await prisma.setting.findMany();
  const stored = new Map(rows.map((r) => [r.group, r.value]));

  const result = structuredClone(DEFAULT_SETTINGS);
  for (const group of SETTINGS_GROUPS) {
    const raw = stored.get(group);
    if (!raw) continue;
    try {
      const parsed = SETTINGS_SCHEMAS[group].safeParse({
        ...result[group],
        ...JSON.parse(raw),
      });
      if (parsed.success) {
        (result as Record<SettingsGroup, unknown>)[group] = parsed.data;
      }
    } catch {
      // keep default
    }
  }
  return result;
});

export async function getSettingsGroup<G extends SettingsGroup>(
  group: G,
): Promise<SiteSettings[G]> {
  return (await getSettings())[group];
}
