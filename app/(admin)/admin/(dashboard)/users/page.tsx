import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { PageHeader, Card } from "@/components/admin/ui/card";
import { UsersManager, type AdminUser } from "@/components/admin/users/UsersManager";

export const metadata: Metadata = { title: "Потребители" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const me = await requireUser();
  if (!hasPermission(me.role, "user.manage")) {
    return (
      <div>
        <PageHeader title="Потребители" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до управление на потребители.</p>
        </Card>
      </div>
    );
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, banned: true, createdAt: true },
  });

  const list: AdminUser[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    banned: u.banned,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Потребители и роли" description="Управлявайте достъпа на екипа." />
      <UsersManager users={list} currentUserId={me.id} />
    </div>
  );
}
