import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/admin/session";
import { hasPermission, permissionsFor } from "@/lib/admin/rbac";
import { LeadDetail } from "@/components/admin/leads/LeadDetail";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!hasPermission(user.role, "lead.view")) notFound();

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true } },
      activities: {
        orderBy: { createdAt: "desc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!lead) notFound();

  const users = await prisma.user.findMany({
    where: { banned: false },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <LeadDetail
      lead={{
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        message: lead.message,
        status: lead.status,
        source: lead.source,
        vehicleSlug: lead.vehicleSlug,
        vehicleLabel: lead.vehicleLabel,
        assigneeId: lead.assigneeId,
        createdAt: lead.createdAt.toISOString(),
        activities: lead.activities.map((a) => ({
          id: a.id,
          type: a.type,
          body: a.body,
          author: a.author?.name ?? null,
          createdAt: a.createdAt.toISOString(),
        })),
      }}
      users={users}
      permissions={permissionsFor(user.role)}
    />
  );
}
