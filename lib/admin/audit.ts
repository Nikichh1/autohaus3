import "server-only";
import { prisma } from "@/lib/db";
import type { SessionUser } from "./session";

type AuditEntry = {
  actor?: Pick<SessionUser, "id" | "email"> | null;
  action: string;
  entityType?: string;
  entityId?: string;
  summary: string;
};

/**
 * Append-only audit trail. Fire-and-forget: a logging failure must never break
 * the underlying action, so errors are swallowed.
 */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actor?.id ?? null,
        actorEmail: entry.actor?.email ?? null,
        action: entry.action,
        entityType: entry.entityType ?? null,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
      },
    });
  } catch {
    // never throw from the audit path
  }
}
