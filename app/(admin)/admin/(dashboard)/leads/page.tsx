import type { Metadata } from "next";
import Link from "next/link";
import { Lock, Search } from "lucide-react";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/admin/session";
import { hasPermission, permissionsFor } from "@/lib/admin/rbac";
import { LEAD_STATUSES, LEAD_STATUS_LABELS } from "@/lib/admin/leads";
import { PageHeader, Card } from "@/components/admin/ui/card";
import { LeadsTable, type LeadRow } from "@/components/admin/leads/LeadsTable";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Запитвания" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 15;

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const user = await requireUser();
  if (!hasPermission(user.role, "lead.view")) {
    return (
      <div>
        <PageHeader title="Запитвания" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до запитванията.</p>
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const perms = permissionsFor(user.role);
  const status = sp.status && (LEAD_STATUSES as readonly string[]).includes(sp.status) ? sp.status : "";
  const q = sp.q?.trim() ?? "";
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.LeadWhereInput = {};
  const and: Prisma.LeadWhereInput[] = [];
  if (status) and.push({ status });
  if (q)
    and.push({
      OR: [
        { name: { contains: q } },
        { email: { contains: q } },
        { phone: { contains: q } },
        { message: { contains: q } },
        { vehicleLabel: { contains: q } },
      ],
    });
  if (and.length) where.AND = and;

  const [leads, total, newCount] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { assignee: { select: { name: true } } },
    }),
    prisma.lead.count({ where }),
    prisma.lead.count({ where: { status: "new" } }),
  ]);

  const rows: LeadRow[] = leads.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    status: l.status,
    source: l.source,
    vehicleLabel: l.vehicleLabel,
    assigneeName: l.assignee?.name ?? null,
    message: l.message,
    createdAt: l.createdAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function tabHref(s: string) {
    const params = new URLSearchParams();
    if (s) params.set("status", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/admin/leads${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <PageHeader
        title="Запитвания"
        description={`${total} запитвания${newCount > 0 ? ` · ${newCount} нови` : ""}`}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Tab href={tabHref("")} active={!status}>
          Всички
        </Tab>
        {LEAD_STATUSES.map((s) => (
          <Tab key={s} href={tabHref(s)} active={status === s}>
            {LEAD_STATUS_LABELS[s]}
          </Tab>
        ))}
        <form className="relative ml-auto min-w-[200px]" action="/admin/leads">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Търси име, имейл, телефон…"
            className="h-9 w-full rounded-lg border border-line-strong bg-surface/60 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
          />
        </form>
      </div>

      <LeadsTable rows={rows} permissions={perms} />

      {totalPages > 1 ? (
        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-xs text-fg-subtle">
            Страница {page} от {totalPages}
          </span>
          <div className="flex gap-1">
            <PageLink href={`${tabHref(status)}${tabHref(status).includes("?") ? "&" : "?"}page=${page - 1}`} disabled={page <= 1}>
              Назад
            </PageLink>
            <PageLink href={`${tabHref(status)}${tabHref(status).includes("?") ? "&" : "?"}page=${page + 1}`} disabled={page >= totalPages}>
              Напред
            </PageLink>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Tab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm transition-colors",
        active ? "bg-white/8 font-medium text-fg" : "text-fg-muted hover:bg-white/5 hover:text-fg",
      )}
    >
      {children}
    </Link>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled?: boolean; children: React.ReactNode }) {
  if (disabled)
    return <span className="rounded-lg px-3 py-1.5 text-sm text-fg-subtle/40">{children}</span>;
  return (
    <Link href={href} className="rounded-lg px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg">
      {children}
    </Link>
  );
}
