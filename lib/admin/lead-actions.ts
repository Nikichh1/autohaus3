"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin/session";
import { writeAudit } from "@/lib/admin/audit";
import { isLeadStatus, LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/admin/leads";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidate(id?: string) {
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/leads/${id}`);
}

export async function setLeadStatus(id: string, status: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("lead.update");
    if (!isLeadStatus(status)) return { ok: false, error: "Невалиден статус." };
    await prisma.$transaction([
      prisma.lead.update({
        where: { id },
        data: {
          status,
          lastContactAt: status === "contacted" ? new Date() : undefined,
        },
      }),
      prisma.leadActivity.create({
        data: { leadId: id, authorId: user.id, type: "status", body: `Статус → ${LEAD_STATUS_LABELS[status as LeadStatus] ?? status}` },
      }),
    ]);
    await writeAudit({
      actor: user,
      action: "lead.status",
      entityType: "lead",
      entityId: id,
      summary: `Запитване → ${LEAD_STATUS_LABELS[status as LeadStatus] ?? status}`,
    });
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function assignLead(id: string, assigneeId: string | null): Promise<ActionResult> {
  try {
    const user = await requirePermission("lead.update");
    const assignee = assigneeId
      ? await prisma.user.findUnique({ where: { id: assigneeId }, select: { name: true } })
      : null;
    await prisma.$transaction([
      prisma.lead.update({ where: { id }, data: { assigneeId: assigneeId || null } }),
      prisma.leadActivity.create({
        data: {
          leadId: id,
          authorId: user.id,
          type: "assignment",
          body: assignee ? `Възложено на ${assignee.name}` : "Премахнато възлагане",
        },
      }),
    ]);
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function addLeadNote(id: string, body: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("lead.update");
    const text = body.trim();
    if (!text) return { ok: false, error: "Празна бележка." };
    await prisma.leadActivity.create({
      data: { leadId: id, authorId: user.id, type: "note", body: text.slice(0, 4000) },
    });
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function deleteLead(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("lead.delete");
    const lead = await prisma.lead.findUnique({ where: { id }, select: { name: true } });
    await prisma.lead.delete({ where: { id } });
    await writeAudit({
      actor: user,
      action: "lead.delete",
      entityType: "lead",
      entityId: id,
      summary: `Изтри запитване от ${lead?.name ?? "—"}`,
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function bulkSetLeadStatus(ids: string[], status: LeadStatus): Promise<ActionResult> {
  try {
    await requirePermission("lead.update");
    if (!ids.length) return { ok: false, error: "Няма избрани." };
    await prisma.lead.updateMany({ where: { id: { in: ids } }, data: { status } });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}
