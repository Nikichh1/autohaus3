import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Search, ScrollText } from "lucide-react";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { PageHeader, Card } from "@/components/admin/ui/card";

export const metadata: Metadata = { title: "Одит лог" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

function actorInitials(email: string | null) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requireUser();
  if (!hasPermission(user.role, "audit.view")) {
    return (
      <div>
        <PageHeader title="Одит лог" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до одит лога.</p>
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.AuditLogWhereInput = q
    ? {
        OR: [
          { summary: { contains: q } },
          { action: { contains: q } },
          { actorEmail: { contains: q } },
        ],
      }
    : {};

  const [logs, total] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Одит лог"
        description="Хронология на всички промени в системата (само за четене)."
      />

      <form action="/admin/audit" className="relative mb-4 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Търси действие, потребител, описание…"
          className="h-9 w-full rounded-lg border border-line-strong bg-surface/60 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
        />
      </form>

      {logs.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <ScrollText className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Няма записи.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {logs.map((log) => (
              <li key={log.id} className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-semibold text-fg-muted ring-1 ring-line">
                  {actorInitials(log.actorEmail)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">{log.summary}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-fg-subtle">
                    <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">{log.action}</span>
                    <span>{log.actorEmail ?? "система"}</span>
                    <span>·</span>
                    <span>{new Date(log.createdAt).toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" })}</span>
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-xs text-fg-subtle">
            Страница {page} от {totalPages} · {total} записа
          </span>
          <div className="flex gap-1">
            <PageLink href={`/admin/audit?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page - 1) })}`} disabled={page <= 1}>
              Назад
            </PageLink>
            <PageLink href={`/admin/audit?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page + 1) })}`} disabled={page >= totalPages}>
              Напред
            </PageLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled?: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="rounded-lg px-3 py-1.5 text-sm text-fg-subtle/40">{children}</span>;
  return (
    <Link href={href} className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg">
      {children}
    </Link>
  );
}
