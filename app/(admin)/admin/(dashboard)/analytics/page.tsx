import type { Metadata } from "next";
import { Lock, Eye, Users, Inbox, Percent, Trophy, Car, Smartphone, Monitor } from "lucide-react";
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

/** Friendly labels for the most-visited-pages list. */
function pageLabel(path: string): string {
  if (path === "/") return "Начало";
  const map: Record<string, string> = {
    "/avtomobili": "Всички автомобили",
    "/pod-naem": "Автомобили под наем",
    "/kontakti": "Контакти",
    "/za-nas": "За нас",
    "/serviz": "Сервиз",
    "/auto-spa": "Auto Spa",
    "/kafe-bar": "Кафе бар",
    "/lizing": "Лизинг",
    "/zastrahovki": "Застраховки",
    "/kariera": "Кариера",
    "/novini": "Новини",
  };
  if (map[path]) return map[path];
  const m = path.match(/^\/avtomobili\/(.+)$/);
  if (m) return `Автомобил · ${m[1]}`;
  return path;
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

  const [
    pageViews30,
    visitorRows,
    carViews30,
    leads30,
    won30,
    vehiclesByStatus,
    leadsByStatusRaw,
    topViewedRaw,
    topPagesRaw,
    deviceRaw,
    referrerRaw,
    leads14,
    pv14,
  ] = await Promise.all([
    prisma.pageView.count({ where: { createdAt: { gte: d30 } } }),
    prisma.pageView.groupBy({ by: ["sessionId"], where: { createdAt: { gte: d30 } }, _count: { sessionId: true } }),
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
    prisma.pageView.groupBy({
      by: ["path"],
      where: { createdAt: { gte: d30 } },
      _count: { path: true },
      orderBy: { _count: { path: "desc" } },
      take: 8,
    }),
    prisma.pageView.groupBy({ by: ["device"], where: { createdAt: { gte: d30 } }, _count: { device: true } }),
    prisma.pageView.groupBy({
      by: ["referrer"],
      where: { createdAt: { gte: d30 }, referrer: { not: null } },
      _count: { referrer: true },
      orderBy: { _count: { referrer: "desc" } },
      take: 6,
    }),
    prisma.lead.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }),
    prisma.pageView.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }),
  ]);

  const visitors30 = visitorRows.length;
  const conversion = visitors30 > 0 ? (leads30 / visitors30) * 100 : 0;

  // 14-day series
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) days.push(dayKey(new Date(now.getTime() - i * 864e5)));
  const leadSeries = Object.fromEntries(days.map((k) => [k, 0]));
  const pvSeries = Object.fromEntries(days.map((k) => [k, 0]));
  for (const l of leads14) leadSeries[dayKey(l.createdAt)] = (leadSeries[dayKey(l.createdAt)] ?? 0) + 1;
  for (const v of pv14) pvSeries[dayKey(v.createdAt)] = (pvSeries[dayKey(v.createdAt)] ?? 0) + 1;

  // Top viewed cars → labels
  const slugs = topViewedRaw.map((t) => t.vehicleSlug);
  const vehicles = await prisma.vehicle.findMany({ where: { slug: { in: slugs } }, select: { slug: true, brand: true, model: true } });
  const labelBySlug = new Map(vehicles.map((v) => [v.slug, `${v.brand} ${v.model}`]));
  const topViewed = topViewedRaw.map((t) => ({ slug: t.vehicleSlug, label: labelBySlug.get(t.vehicleSlug) ?? t.vehicleSlug, count: t._count.vehicleSlug }));

  const topPages = topPagesRaw.map((t) => ({ path: t.path, label: pageLabel(t.path), count: t._count.path }));
  const referrers = referrerRaw.map((r) => ({ label: r.referrer ?? "директно", count: r._count.referrer }));

  let mobile = 0;
  let desktop = 0;
  for (const d of deviceRaw) {
    if (d.device === "mobile") mobile = d._count.device;
    else if (d.device === "desktop") desktop = d._count.device;
  }
  const deviceTotal = mobile + desktop;

  const statusCounts = new Map(vehiclesByStatus.map((s) => [s.status, s._count.status]));
  const leadStatusCounts = new Map(leadsByStatusRaw.map((s) => [s.status, s._count.status]));

  const noTraffic = pageViews30 === 0;

  return (
    <div>
      <PageHeader title="Анализи" description="Последни 30 дни · трафик и запитвания." />

      {noTraffic && (
        <Card className="mb-6 flex items-center gap-3 px-5 py-4">
          <Eye className="size-5 shrink-0 text-fg-subtle" />
          <p className="text-sm text-fg-muted">
            Все още няма записан трафик. Данните за посещения се събират от момента на публикуване — върнете се тук, след като сайтът получи първите си посетители.
          </p>
        </Card>
      )}

      {/* Traffic overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Посещения" value={pageViews30.toLocaleString("bg-BG")} icon={<Eye className="size-5" />} />
        <StatCard label="Посетители" value={visitors30.toLocaleString("bg-BG")} icon={<Users className="size-5" />} accent="text-sky-400" />
        <StatCard label="Запитвания" value={leads30} icon={<Inbox className="size-5" />} accent="text-emerald-400" />
        <StatCard label="Конверсия" value={`${conversion.toFixed(1)}%`} icon={<Percent className="size-5" />} accent="text-amber-400" />
      </div>

      {/* Secondary metrics */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Прегледи на коли" value={carViews30.toLocaleString("bg-BG")} icon={<Car className="size-5" />} />
        <StatCard label="Спечелени сделки" value={won30} icon={<Trophy className="size-5" />} accent="text-emerald-400" />
        <StatCard
          label="Стр. / посетител"
          value={visitors30 > 0 ? (pageViews30 / visitors30).toFixed(1) : "—"}
          icon={<Eye className="size-5" />}
        />
        <StatCard
          label="Мобилни"
          value={deviceTotal > 0 ? `${Math.round((mobile / deviceTotal) * 100)}%` : "—"}
          icon={<Smartphone className="size-5" />}
          accent="text-sky-400"
        />
      </div>

      {/* Trend charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Посещения · 14 дни</h2>
          <BarSeries days={days} series={pvSeries} accent="bg-accent" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Запитвания · 14 дни</h2>
          <BarSeries days={days} series={leadSeries} accent="bg-sky-400/80" />
        </Card>
      </div>

      {/* Most visited pages · Most viewed cars */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Най-посещавани страници</h2>
          <RankedBars items={topPages.map((p) => ({ key: p.path, label: p.label, count: p.count }))} accent="bg-accent" empty="Все още няма посещения." labelWidth="w-44" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Най-разглеждани автомобили</h2>
          <RankedBars items={topViewed.map((t) => ({ key: t.slug, label: t.label, count: t.count }))} accent="bg-accent" empty="Все още няма прегледи." labelWidth="w-40" />
        </Card>
      </div>

      {/* Devices + sources · Lead funnel + inventory */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 text-sm font-semibold text-fg">Устройства</h2>
          {deviceTotal === 0 ? (
            <p className="py-4 text-center text-sm text-fg-subtle">Все още няма данни.</p>
          ) : (
            <>
              <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
                <span className="block bg-accent" style={{ width: `${(desktop / deviceTotal) * 100}%` }} />
                <span className="block bg-sky-400/70" style={{ width: `${(mobile / deviceTotal) * 100}%` }} />
              </div>
              <div className="mt-3 flex items-center gap-5 text-xs text-fg-muted">
                <span className="flex items-center gap-2"><Monitor className="size-3.5 text-accent" /> Десктоп <b className="text-fg">{desktop}</b></span>
                <span className="flex items-center gap-2"><Smartphone className="size-3.5 text-sky-400" /> Мобилни <b className="text-fg">{mobile}</b></span>
              </div>
            </>
          )}

          <h2 className="mb-3 mt-6 text-sm font-semibold text-fg">Източници на трафик</h2>
          {referrers.length === 0 ? (
            <p className="py-2 text-sm text-fg-subtle">Предимно директен трафик.</p>
          ) : (
            <RankedBars items={referrers.map((r, i) => ({ key: String(i), label: r.label, count: r.count }))} accent="bg-emerald-400/70" empty="" labelWidth="w-36" />
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

function RankedBars({
  items,
  accent,
  empty,
  labelWidth,
}: {
  items: { key: string; label: string; count: number }[];
  accent: string;
  empty: string;
  labelWidth: string;
}) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-fg-subtle">{empty}</p>;
  const max = items[0]?.count || 1;
  return (
    <ul className="flex flex-col gap-3">
      {items.map((t) => (
        <li key={t.key} className="flex items-center gap-3">
          <span className={`${labelWidth} shrink-0 truncate text-sm text-fg`} title={t.label}>{t.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
            <span className={`block h-full rounded-full ${accent}`} style={{ width: `${(t.count / max) * 100}%` }} />
          </span>
          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-fg-muted">{t.count}</span>
        </li>
      ))}
    </ul>
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
            <span className={`w-full rounded-t ${accent} transition-all`} style={{ height: `${Math.max(2, (v / max) * 100)}%` }} title={`${d}: ${v}`} />
          </div>
        );
      })}
    </div>
  );
}
