"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut, Loader2 } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { ROLE_LABELS, type Role } from "@/lib/admin/constants";

export function UserMenu({
  user,
}: {
  user: { name: string; email: string; role: Role; image: string | null };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg p-1.5 pr-2 text-left transition-colors hover:bg-white/5"
      >
        <span className="flex size-8 items-center justify-center rounded-full bg-elevated text-xs font-semibold text-fg ring-1 ring-line-strong">
          {initials || "·"}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-fg">{user.name}</span>
          <span className="block truncate text-[11px] text-fg-subtle">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </span>
        <ChevronsUpDown className="hidden size-4 text-fg-subtle sm:block" />
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-cinema">
          <div className="border-b border-line px-3.5 py-3">
            <p className="truncate text-sm font-medium text-fg">{user.name}</p>
            <p className="truncate text-xs text-fg-subtle">{user.email}</p>
            <span className="mt-2 inline-block rounded-md bg-white/5 px-2 py-0.5 text-[11px] text-fg-muted">
              {ROLE_LABELS[user.role] ?? user.role}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={busy}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
            Изход
          </button>
        </div>
      ) : null}
    </div>
  );
}
