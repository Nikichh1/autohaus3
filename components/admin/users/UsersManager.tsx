"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Ban, ShieldCheck, Trash2, X, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Field, Input, Select } from "@/components/admin/ui/input";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import { ROLES, ROLE_LABELS } from "@/lib/admin/constants";
import { createUser, setUserRole, setUserBanned, deleteUser } from "@/lib/admin/user-actions";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string;
};

export function UsersManager({ users, currentUserId }: { users: AdminUser[]; currentUserId: string }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);
  const [pending, start] = useTransition();

  function run(p: Promise<{ ok: boolean; error?: string }>, msg: string) {
    start(async () => {
      const res = await p;
      if (res.ok) {
        toast(msg);
        router.refresh();
      } else toast(res.error ?? "Грешка", "error");
    });
  }

  async function onDelete(u: AdminUser) {
    const ok = await confirmDialog({
      title: `Изтриване на ${u.email}?`,
      description: "Достъпът ще бъде премахнат незабавно.",
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (ok) run(deleteUser(u.id), "Изтрит");
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" icon={<UserPlus className="size-4" />} onClick={() => setAdding(true)}>
          Нов потребител
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-fg-subtle">
                <th className="px-4 py-2.5 font-medium">Потребител</th>
                <th className="px-3 py-2.5 font-medium">Роля</th>
                <th className="px-3 py-2.5 font-medium">Статус</th>
                <th className="px-3 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.map((u) => {
                const isSelf = u.id === currentUserId;
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-fg ring-1 ring-line">
                          {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-fg">
                            {u.name} {isSelf && <span className="text-xs text-fg-subtle">(вие)</span>}
                          </p>
                          <p className="truncate text-xs text-fg-subtle">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Select
                        defaultValue={u.role}
                        disabled={isSelf || pending}
                        onChange={(e) => run(setUserRole(u.id, e.target.value), "Ролята е обновена")}
                        className="w-auto min-w-[160px]"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-3 py-3">
                      {u.banned ? (
                        <span className="inline-flex items-center rounded-md border border-red-500/25 bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300">
                          Блокиран
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md border border-emerald-500/25 bg-emerald-500/12 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {!isSelf && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => run(setUserBanned(u.id, !u.banned), u.banned ? "Отблокиран" : "Блокиран")}
                            title={u.banned ? "Отблокирай" : "Блокирай"}
                            className="flex size-8 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-white/5 hover:text-fg"
                          >
                            {u.banned ? <ShieldCheck className="size-4" /> : <Ban className="size-4" />}
                          </button>
                          <button
                            onClick={() => onDelete(u)}
                            title="Изтрий"
                            className="flex size-8 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {adding && <AddUserModal onClose={() => setAdding(false)} onCreated={() => router.refresh()} />}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("sales_manager");
  const [saving, start] = useTransition();
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function submit() {
    start(async () => {
      const res = await createUser({ name, email, role });
      if (res.ok) {
        setTempPassword(res.tempPassword ?? "");
        toast("Потребителят е създаден");
        onCreated();
      } else toast(res.error, "error");
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-line-strong bg-elevated p-6 shadow-cinema">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-fg">Нов потребител</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-fg-muted hover:bg-white/5">
            <X className="size-5" />
          </button>
        </div>

        {tempPassword ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-fg-muted">
              Акаунтът е създаден. Споделете тази временна парола сигурно — показва се само сега:
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(tempPassword);
                setCopied(true);
                toast("Копирано");
              }}
              className="flex items-center justify-between gap-2 rounded-lg border border-line-strong bg-base/60 px-3 py-3 font-mono text-sm text-fg"
            >
              {tempPassword}
              {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-fg-subtle" />}
            </button>
            <Button variant="primary" onClick={onClose} className="w-full">
              Готово
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <Field label="Име">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Име Фамилия" />
            </Field>
            <Field label="Имейл">
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="вие@autohaus.bg" />
            </Field>
            <Field label="Роля">
              <Select value={role} onChange={(e) => setRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </Select>
            </Field>
            <Button variant="primary" loading={saving} onClick={submit} className={cn("mt-1 w-full")}>
              Създай потребител
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
