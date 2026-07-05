import Link from "next/link";
import {
  Car,
  CheckCircle2,
  Clock,
  BadgeCheck,
  FileEdit,
  Star,
  Plus,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { Card, PageHeader, StatCard } from "@/components/admin/ui/card";
import { ButtonLink } from "@/components/admin/ui/button";
import { StatusBadge } from "@/components/admin/vehicles/StatusBadge";
import { LeadStatusBadge } from "@/components/admin/leads/LeadStatusBadge";
import { formatPriceEUR } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const canCreate = hasPermission(user?.role ?? "", "vehicle.create");
  const canLeads = hasPermission(user?.role ?? "", "lead.view");

  // Fire every dashboard read concurrently — the vehicle stats batch, plus the
  // (permission-gated) lead queries — so the page waits on ONE round-trip worth
  // of latency instead of three sequential ones.
  const [
    [total, available, reserved, sold, draft, featured, recent],
    newLeads,
    recentLeads,
  ] = await Promise.all([
    prisma.$transaction([
      prisma.vehicle.count({ where: { status: { not: "archived" } } }),
      prisma.vehicle.count({ where: { status: "available" } }),
      prisma.vehicle.count({ where: { status: "reserved" } }),
      prisma.vehicle.count({ where: { status: "sold" } }),
      prisma.vehicle.count({ where: { status: "draft" } }),
      prisma.vehicle.count({ where: { featured: true } }),
      prisma.vehicle.findMany({
        orderBy: { updatedAt: "desc" },
        take: 6,
        include: { images: { orderBy: { position: "asc" }, take: 1 } },
      }),
    ]),
    canLeads ? prisma.lead.count({ where: { status: "new" } }) : Promise.resolve(0),
    canLeads
      ? prisma.lead.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, name: true, status: true, vehicleLabel: true },
        })
      : Promise.resolve([] as { id: string; name: string; status: string; vehicleLabel: string | null }[]),
  ]);

  const greeting = new Date().getHours() < 12 ? "Добро утро" : new Date().getHours() < 18 ? "Добър ден" : "Добър вечер";

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Преглед на платформата и бързи действия."
        actions={
          canCreate ? (
            <ButtonLink href="/admin/vehicles/new" variant="primary" icon={<Plus className="size-4" />}>
              Нов автомобил
            </ButtonLink>
          ) : null
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Общо" value={total} icon={<Car className="size-5" />} />
        <StatCard label="Налични" value={available} icon={<CheckCircle2 className="size-5" />} accent="text-emerald-400" />
        <StatCard label="Резервирани" value={reserved} icon={<Clock className="size-5" />} accent="text-amber-400" />
        <StatCard label="Продадени" value={sold} icon={<BadgeCheck className="size-5" />} accent="text-sky-400" />
        <StatCard label="Чернови" value={draft} icon={<FileEdit className="size-5" />} />
        <StatCard label="Промотирани" value={featured} icon={<Star className="size-5" />} accent="text-amber-300" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">Последно обновени</h2>
            <Link href="/admin/vehicles" className="flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg">
              Всички <ArrowRight className="size-3.5" />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <Car className="mx-auto size-8 text-fg-subtle" />
              <p className="mt-3 text-sm text-fg-muted">Все още няма автомобили.</p>
              {canCreate ? (
                <ButtonLink href="/admin/vehicles/new" variant="secondary" size="sm" className="mt-4" icon={<Plus className="size-4" />}>
                  Добави първия
                </ButtonLink>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recent.map((v) => (
                <li key={v.id}>
                  <Link
                    href={`/admin/vehicles/${v.id}`}
                    className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <div className="h-12 w-16 shrink-0 overflow-hidden rounded-md bg-elevated">
                      {v.images[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={v.images[0].url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-fg-subtle">
                          <Car className="size-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {v.brand} {v.model} {v.variant ?? ""}
                      </p>
                      <p className="text-xs text-fg-subtle">
                        {v.year} · {v.priceOnRequest || v.price === 0 ? "При запитване" : formatPriceEUR(v.price)}
                      </p>
                    </div>
                    <StatusBadge status={v.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-fg">Бързи действия</h2>
          <div className="mt-4 flex flex-col gap-2">
            <QuickAction href="/admin/vehicles" label="Управление на автомобили" />
            {canCreate && <QuickAction href="/admin/vehicles/new" label="Добави нов автомобил" />}
            <QuickAction href="/admin/vehicles?status=draft" label="Прегледай чернови" />
            <QuickAction href="/admin/vehicles?status=reserved" label="Резервирани автомобили" />
            {canLeads && <QuickAction href="/admin/leads?status=new" label="Нови запитвания" />}
          </div>
        </Card>
      </div>

      {canLeads && (
        <Card className="mt-6">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">
              Последни запитвания{newLeads > 0 ? ` · ${newLeads} нови` : ""}
            </h2>
            <Link href="/admin/leads" className="flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg">
              Всички <ArrowRight className="size-3.5" />
            </Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-fg-muted">Все още няма запитвания.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentLeads.map((l) => (
                <li key={l.id}>
                  <Link href={`/admin/leads/${l.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.03]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">{l.name}</span>
                      <span className="block truncate text-xs text-fg-subtle">{l.vehicleLabel ?? "Общо запитване"}</span>
                    </span>
                    <LeadStatusBadge status={l.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}

function QuickAction({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-lg border border-line bg-base/40 px-3.5 py-2.5 text-sm text-fg-muted transition-colors hover:border-line-strong hover:text-fg"
    >
      {label}
      <ArrowRight className="size-4 text-fg-subtle" />
    </Link>
  );
}
