import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { CONTENT_FIELDS, CONTENT_FIELD_MAP } from "./registry";

/**
 * Merged content map: DB overrides over registry defaults. Cached per render.
 * Public components call getContent() once and read keys from the map.
 */
export const getContent = cache(async (): Promise<Record<string, string>> => {
  const rows = await prisma.contentBlock.findMany();
  const overrides = new Map(rows.map((r) => [r.key, r.value]));
  const map: Record<string, string> = {};
  for (const f of CONTENT_FIELDS) {
    map[f.key] = overrides.get(f.key) ?? f.default;
  }
  return map;
});

/** Single value with registry-default fallback (safe even before getContent runs). */
export async function content(key: string): Promise<string> {
  const map = await getContent();
  return map[key] ?? CONTENT_FIELD_MAP[key]?.default ?? "";
}
