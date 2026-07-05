import type { Metadata } from "next";
import { Lock, Eye, Inbox, Trophy, Percent } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { PageHeader, Card, StatCard } from "@/components/admin/ui/card";
import { STATUS_LABELS, type VehicleStatus } from "@/lib/admin/constants";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/admin/leads";

export const metadata: Metadata = { title: "Анализи" };
export const dynamic = "force-dynamic";

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function AnalyticsPage() {
  const user = await requireUser();
  if (!hasPermission(user.role, "analytics.view")) {
    return (
      <div>
        <PageHeader title="Анализи" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до анализите.</p>
        </Card>
      </div>
    );
  }

  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 864e5);
  const d14 = new Date(now.getTime() - 13 * 864e5);
  d14.setHours(0, 0, 0, 0);

  const [views30, leads30, won30, vehiclesByStatus, leadsByStatusRaw, topViewedRaw, leads14, views14] =
    await Promise.all([
      prisma.vehicleView.count({ where: { createdAt: { gte: d30 } } }),
      prisma.lead.count({ where: { createdAt: { gte: d30 } } }),
      prisma.lead.count({ where: { status: "won", createdAt: { gte: d30 } } }),
      prisma.vehicle.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.lead.groupBy({ by: ["status"], _count: { status: true } }),
      prisma.vehicleView.groupBy({
        by: ["vehicleSlug"],
        where: { createdAt: { gte: d30 } },
        _count: { vehicleSlug: true },
        orderBy: { _count: { vehicleSlug: "desc" } },
        take: 8,
      }),
      prisma.lead.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }),
      prisma.vehicleView.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }),
    ]);

  const conversion = views30 > 0 ? (leads30 / views30) * 100 : 0;

  // 14-day series
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(dayKey(new Date(now.getTime() - i * 864e5)));
  const leadSeries = Object.fromEntries(days.map((k) => [k, 0]));
  const viewSeries = Object.fromEntries(days.map((k) => [k, 0]));
  for (const l of leads14) leadSeries[dayKey(l.createdAt)] = (leadSeries[dayKey(l.createdAt)] ?? 0) + 1;
  for (const v of views14) viewSeries[dayKey(v.createdAt)] = (viewSeries[dayKey(v.createdAt)] ?? 0) + 1;

  // Top viewed → labels
  const slugs = topViewedRaw.map((t) => t.vehicleSlug);
  const vehicles = await prisma.vehicle.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, brand: true, model: true },
  });
  const labelBySlug = new Map(vehicles.map((v) => [v.slug, `${v.brand} ${v.model}`]));
  const topViewed = topViewedRaw.map((t) => ({
    slug: t.vehicleSlug,
    label: labelBySlug.get(t.vehicleSlug) ?? t.vehicleSlug,
    count: t._count.vehicleSlug,
  }));

  const statusCounts = new Map(vehiclesByStatus.map((s) => [s.status, s._count.status]));
  const leadStatusCounts = new Map(leadsByStatusRaw.map((s) => [s.status, s._count.status]));

  return (
    <div>
      <PageHeader title="Анализи" description="Последни 30 дни." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Прегледи" value={views30} icon={<Eye className="size-5" />} />
        <StatCard label="Запитвания" value={leads30} icon={<Inbox className="size-5" />} accent="text-sky-400" />
        <StatCard label="Спечелени" value={won30} icon={<Trophy className="size-5" />} accent="text-emerald-400" />
        <StatCard label="Конверсия" value={`${conversion.toFixed(1)}%`} icon={<Percent className="size-5" />} accent="text-amber-400" />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Прегледи · 14 дни</h2>
          <BarSeries days={days} series={viewSeries} accent="bg-accent" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Запитвания · 14 дни</h2>
          <BarSeries days={days} series={leadSeries} accent="bg-sky-400/80" />
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Най-разглеждани автомобили</h2>
          {topViewed.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-subtle">Все още няма прегледи.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {topViewed.map((t) => {
                const max = topViewed[0].count || 1;
                return (
                  <li key={t.slug} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-sm text-fg">{t.label}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${(t.count / max) * 100}%` }} />
                    </span>
                    <span className="w-10 shrink-0 text-right text-xs tabular-nums text-fg-muted">{t.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Фуния на запитванията</h2>
          <ul className="flex flex-col gap-2.5">
            {LEAD_STATUSES.map((s) => {
              const count = leadStatusCounts.get(s) ?? 0;
              const total = Math.max(1, ...LEAD_STATUSES.map((x) => leadStatusCounts.get(x) ?? 0));
              return (
                <li key={s} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 text-sm text-fg-muted">{LEAD_STATUS_LABELS[s]}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                    <span className="block h-full rounded-full bg-sky-400/70" style={{ width: `${(count / total) * 100}%` }} />
                  </span>
                  <span className="w-8 shrink-0 text-right text-xs tabular-nums text-fg-muted">{count}</span>
                </li>
              );
            })}
          </ul>

          <h2 className="mb-3 mt-6 text-sm font-semibold text-fg">Инвентар по статус</h2>
          <div className="flex flex-wrap gap-2">
            {(["available", "reserved", "sold", "draft", "archived"] as VehicleStatus[]).map((s) => (
              <span key={s} className="rounded-lg border border-line bg-base/40 px-3 py-1.5 text-xs text-fg-muted">
                {STATUS_LABELS[s]}: <span className="font-semibold text-fg">{statusCounts.get(s) ?? 0}</span>
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function BarSeries({ days, series, accent }: { days: string[]; series: Record<string, number>; accent: string }) {
  const max = Math.max(1, ...days.map((d) => series[d] ?? 0));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {days.map((d) => {
        const v = series[d] ?? 0;
        return (
          <div key={d} className="group relative flex flex-1 flex-col items-center justify-end">
            <span
              className={`w-full rounded-t ${accent} transition-all`}
              style={{ height: `${Math.max(2, (v / max) * 100)}%` }}
              title={`${d}: ${v}`}
            />
          </div>
        );
      })}
    </div>
  );
}
