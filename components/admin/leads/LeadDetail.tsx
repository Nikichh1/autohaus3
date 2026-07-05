"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Phone,
  Mail,
  Car,
  Trash2,
  Send,
  MessageSquare,
  UserCircle2,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Card } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Select, Textarea, Field } from "@/components/admin/ui/input";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS, type LeadSource } from "@/lib/admin/leads";
import type { Permission } from "@/lib/admin/rbac";
import { setLeadStatus, assignLead, addLeadNote, deleteLead } from "@/lib/admin/lead-actions";

type Activity = { id: string; type: string; body: string | null; author: string | null; createdAt: string };
type Lead = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  status: string;
  source: string;
  vehicleSlug: string | null;
  vehicleLabel: string | null;
  assigneeId: string | null;
  createdAt: string;
  activities: Activity[];
};

function fmt(iso: string) {
  return new Date(iso).toLocaleString("bg-BG", { dateStyle: "medium", timeStyle: "short" });
}

const ACTIVITY_ICON: Record<string, React.ReactNode> = {
  created: <CheckCircle2 className="size-3.5" />,
  status: <Clock className="size-3.5" />,
  assignment: <UserCircle2 className="size-3.5" />,
  note: <MessageSquare className="size-3.5" />,
};

export function LeadDetail({
  lead,
  users,
  permissions,
}: {
  lead: Lead;
  users: { id: string; name: string }[];
  permissions: Permission[];
}) {
  const router = useRouter();
  const can = (p: Permission) => permissions.includes(p);
  const canUpdate = can("lead.update");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();
  const [deleting, startDelete] = useTransition();

  function act(p: Promise<{ ok: boolean; error?: string }>, msg: string) {
    start(async () => {
      const res = await p;
      if (res.ok) {
        toast(msg);
        router.refresh();
      } else toast(res.error ?? "Грешка", "error");
    });
  }

  function onAddNote() {
    if (!note.trim()) return;
    start(async () => {
      const res = await addLeadNote(lead.id, note);
      if (res.ok) {
        setNote("");
        toast("Бележката е добавена");
        router.refresh();
      } else toast(res.error, "error");
    });
  }

  async function onDelete() {
    const ok = await confirmDialog({
      title: "Изтриване на запитването?",
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (!ok) return;
    startDelete(async () => {
      const res = await deleteLead(lead.id);
      if (res.ok) {
        toast("Изтрито");
        router.push("/admin/leads");
      } else toast(res.error, "error");
    });
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href="/admin/leads" className="flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-xl font-bold text-fg">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
          </div>
          <p className="text-xs text-fg-subtle">
            {LEAD_SOURCE_LABELS[lead.source as LeadSource] ?? lead.source} · {fmt(lead.createdAt)}
          </p>
        </div>
        {can("lead.delete") && (
          <Button variant="danger" className="ml-auto" icon={<Trash2 className="size-4" />} onClick={onDelete} loading={deleting}>
            Изтрий
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Contact + message */}
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-fg">Запитване</h2>
            <div className="flex flex-wrap gap-2">
              {lead.phone && (
                <a href={`tel:${lead.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-base/40 px-3 py-2 text-sm text-fg transition-colors hover:border-accent">
                  <Phone className="size-4 text-accent" /> {lead.phone}
                </a>
              )}
              {lead.email && (
                <a href={`mailto:${lead.email}`} className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-base/40 px-3 py-2 text-sm text-fg transition-colors hover:border-accent">
                  <Mail className="size-4 text-accent" /> {lead.email}
                </a>
              )}
              {lead.vehicleLabel && (
                <Link
                  href={lead.vehicleSlug ? `/avtomobili/${lead.vehicleSlug}/` : "#"}
                  target="_blank"
                  className="inline-flex items-center gap-2 rounded-lg border border-line-strong bg-base/40 px-3 py-2 text-sm text-fg transition-colors hover:border-accent"
                >
                  <Car className="size-4 text-accent" /> {lead.vehicleLabel}
                </Link>
              )}
            </div>
            {lead.message && (
              <p className="mt-4 whitespace-pre-wrap rounded-lg border border-line bg-base/40 p-4 text-sm leading-relaxed text-fg-muted">
                {lead.message}
              </p>
            )}
          </Card>

          {/* Activity timeline */}
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-fg">История</h2>
            {canUpdate && (
              <div className="mb-5">
                <Field label="Добави бележка">
                  <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Разговор, договорка, следваща стъпка…" />
                </Field>
                <div className="mt-2 flex justify-end">
                  <Button size="sm" variant="primary" icon={<Send className="size-4" />} loading={pending} onClick={onAddNote}>
                    Запиши
                  </Button>
                </div>
              </div>
            )}
            <ol className="relative space-y-4 border-l border-line pl-5">
              {lead.activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[26px] flex size-5 items-center justify-center rounded-full border border-line-strong bg-elevated text-fg-subtle">
                    {ACTIVITY_ICON[a.type] ?? <MessageSquare className="size-3.5" />}
                  </span>
                  {a.body && <p className="text-sm text-fg">{a.body}</p>}
                  <p className="mt-0.5 text-xs text-fg-subtle">
                    {a.author ? `${a.author} · ` : ""}
                    {fmt(a.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-6">
          <Card className="p-5">
            <h2 className="mb-4 text-sm font-semibold text-fg">Управление</h2>
            <div className="flex flex-col gap-4">
              <Field label="Статус">
                <Select
                  defaultValue={lead.status}
                  disabled={!canUpdate}
                  onChange={(e) => act(setLeadStatus(lead.id, e.target.value), "Статусът е обновен")}
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {LEAD_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Отговорник">
                <Select
                  defaultValue={lead.assigneeId ?? ""}
                  disabled={!canUpdate}
                  onChange={(e) => act(assignLead(lead.id, e.target.value || null), "Възлагането е обновено")}
                >
                  <option value="">— Невъзложено —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
