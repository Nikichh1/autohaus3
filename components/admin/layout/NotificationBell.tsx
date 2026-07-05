"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type Item = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "сега";
  if (mins < 60) return `${mins} мин`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.floor(h / 24)} дни`;
}

export function NotificationBell() {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch("/api/admin/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // Fetch on mount, then poll. State updates happen asynchronously inside
    // load(), not synchronously during the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function markAll() {
    await fetch("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    load();
  }

  async function openItem(it: Item) {
    if (!it.read) {
      await fetch("/api/admin/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: it.id }),
      });
    }
    setOpen(false);
    if (it.link) router.push(it.link);
    load();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
        aria-label="Известия"
      >
        <Bell className="size-[18px]" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-sky-500 px-1 text-[10px] font-semibold leading-4 text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-line-strong bg-elevated shadow-cinema">
          <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
            <span className="text-sm font-semibold text-fg">Известия</span>
            {unread > 0 && (
              <button onClick={markAll} className="flex items-center gap-1 text-xs text-fg-muted transition-colors hover:text-fg">
                <CheckCheck className="size-3.5" /> Маркирай всички
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
              <Inbox className="size-7 text-fg-subtle" />
              <p className="text-sm text-fg-muted">Няма известия</p>
            </div>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {items.map((it) => (
                <li key={it.id}>
                  <button
                    onClick={() => openItem(it)}
                    className={cn(
                      "flex w-full items-start gap-2.5 border-b border-line px-3.5 py-3 text-left transition-colors hover:bg-white/[0.03]",
                      !it.read && "bg-sky-500/[0.06]",
                    )}
                  >
                    {!it.read && <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-sky-400" />}
                    <span className={cn("min-w-0 flex-1", it.read && "pl-4")}>
                      <span className="block truncate text-sm font-medium text-fg">{it.title}</span>
                      {it.body && <span className="block truncate text-xs text-fg-subtle">{it.body}</span>}
                      <span className="mt-0.5 block text-[11px] text-fg-subtle">{timeAgo(it.createdAt)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
