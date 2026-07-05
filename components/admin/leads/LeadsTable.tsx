"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, Loader2, Mail, Phone, Car } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/admin/rbac";
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS, type LeadSource, type LeadStatus } from "@/lib/admin/leads";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import { bulkSetLeadStatus, deleteLead, type ActionResult } from "@/lib/admin/lead-actions";

export type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  source: string;
  vehicleLabel: string | null;
  assigneeName: string | null;
  message: string | null;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "сега";
  if (mins < 60) return `преди ${mins} мин`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `преди ${hrs} ч`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `преди ${days} дни`;
  return d.toLocaleDateString("bg-BG");
}

export function LeadsTable({ rows, permissions }: { rows: LeadRow[]; permissions: Permission[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();
  const can = (p: Permission) => permissions.includes(p);
  const ids = [...selected];
  const allChecked = rows.length > 0 && selected.size === rows.length;

  function run(p: Promise<ActionResult>, msg: string) {
    start(async () => {
      const res = await p;
      if (res.ok) {
        toast(msg);
        setSelected(new Set());
        router.refresh();
      } else toast(res.error, "error");
    });
  }

  async function onBulkDelete() {
    const ok = await confirmDialog({
      title: `Изтриване на ${ids.length} запитвания?`,
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (ok) {
      // delete one-by-one (action takes a single id)
      start(async () => {
        for (const id of ids) await deleteLead(id);
        toast(`${ids.length} изтрити`);
        setSelected(new Set());
        router.refresh();
      });
    }
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center">
        <Inbox className="mx-auto size-9 text-fg-subtle" />
        <p className="mt-3 text-sm font-medium text-fg">Няма запитвания</p>
        <p className="mt-1 text-sm text-fg-muted">Новите запитвания от сайта ще се появят тук.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-elevated px-4 py-2.5">
          <span className="text-sm font-medium text-fg">{selected.size} избрани</span>
          <div className="mx-1 h-5 w-px bg-line" />
          {pending ? <Loader2 className="size-4 animate-spin text-fg-muted" /> : null}
          {can("lead.update") &&
            (["contacted", "qualified", "won", "lost", "spam"] as LeadStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => run(bulkSetLeadStatus(ids, s), "Обновени")}
                className="rounded-md px-2.5 py-1 text-xs font-medium text-fg-muted transition-colors hover:bg-white/8 hover:text-fg"
              >
                {LEAD_STATUS_LABELS[s]}
              </button>
            ))}
          {can("lead.delete") && (
            <button onClick={onBulkDelete} className="rounded-md px-2.5 py-1 text-xs font-medium text-red-300 transition-colors hover:bg-red-500/15">
              Изтрий
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-sm text-fg-muted hover:text-fg">
            Отмени
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-subtle">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={() => setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)))}
                  className="size-4 rounded border-line-strong bg-base accent-accent"
                />
              </th>
              <th className="px-2 py-2.5 font-medium">Контакт</th>
              <th className="px-3 py-2.5 font-medium">Интерес</th>
              <th className="px-3 py-2.5 font-medium">Статус</th>
              <th className="px-3 py-2.5 font-medium">Отговорник</th>
              <th className="px-3 py-2.5 font-medium">Кога</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.id} className={cn("group transition-colors hover:bg-white/[0.02]", selected.has(row.id) && "bg-white/[0.03]")}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.id)}
                    onChange={() =>
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(row.id)) next.delete(row.id);
                        else next.add(row.id);
                        return next;
                      })
                    }
                    className="size-4 rounded border-line-strong bg-base accent-accent"
                  />
                </td>
                <td className="px-2 py-3">
                  <Link href={`/admin/leads/${row.id}`} className="block">
                    <span className="flex items-center gap-2">
                      {row.status === "new" && <span className="size-1.5 rounded-full bg-sky-400" />}
                      <span className="font-medium text-fg group-hover:text-accent">{row.name}</span>
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-fg-subtle">
                      {row.phone ? (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="size-3" /> {row.phone}
                        </span>
                      ) : null}
                      {row.email ? (
                        <span className="inline-flex items-center gap-1">
                          <Mail className="size-3" /> {row.email}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </td>
                <td className="px-3 py-3">
                  {row.vehicleLabel ? (
                    <span className="inline-flex items-center gap-1.5 text-fg-muted">
                      <Car className="size-3.5 text-fg-subtle" />
                      <span className="line-clamp-1 max-w-[180px]">{row.vehicleLabel}</span>
                    </span>
                  ) : (
                    <span className="text-fg-subtle">{LEAD_SOURCE_LABELS[row.source as LeadSource] ?? row.source}</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <LeadStatusBadge status={row.status} />
                </td>
                <td className="px-3 py-3 text-fg-muted">{row.assigneeName ?? "—"}</td>
                <td className="px-3 py-3 whitespace-nowrap text-xs text-fg-subtle">{timeAgo(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
