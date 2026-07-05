import { readFile } from "fs/promises";
import path from "path";
import { requirePermission } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";

export const runtime = "nodejs";

/**
 * Downloads a snapshot of the SQLite database. For local/dev and small
 * deployments this file copy is a valid backup. In production on PostgreSQL,
 * rely on managed point-in-time recovery + scheduled pg_dump instead.
 */
export async function GET() {
  let user;
  try {
    user = await requirePermission("backup.manage");
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  let buf: Buffer;
  try {
    buf = await readFile(dbPath);
  } catch {
    return new Response("Базата данни не е намерена.", { status: 404 });
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  await writeAudit({ actor: user, action: "backup.download", entityType: "backup", summary: "Свали архив на базата данни" });

  return new Response(new Uint8Array(buf), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="autohaus-backup-${stamp}.db"`,
      "Cache-Control": "no-store",
    },
  });
}
