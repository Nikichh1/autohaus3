"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, Search, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/admin/nav";
import type { Permission } from "@/lib/admin/rbac";
import type { Role } from "@/lib/admin/constants";
import { ThemeToggle } from "./ThemeControls";
import { UserMenu } from "./UserMenu";
import { NotificationBell } from "./NotificationBell";
import { Toaster } from "@/components/admin/ui/toast";
import { ConfirmHost } from "@/components/admin/ui/confirm";

type ShellUser = { name: string; email: string; role: Role; image: string | null };

export function AdminShell({
  user,
  permissions,
  children,
}: {
  user: ShellUser;
  permissions: Permission[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const items = NAV.filter((i) => !i.permission || permissions.includes(i.permission));

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q")?.toString().trim();
    router.push(q ? `/admin/vehicles?q=${encodeURIComponent(q)}` : "/admin/vehicles");
    setMobileOpen(false);
  }

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3">
      {items.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        const content = (
          <>
            <Icon className={cn("size-[18px] shrink-0", active ? "text-fg" : "text-fg-subtle group-hover:text-fg-muted")} />
            {!collapsed && (
              <span className="flex-1 truncate">{item.label}</span>
            )}
            {!collapsed && item.soon && (
              <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-fg-subtle">
                скоро
              </span>
            )}
          </>
        );
        const cls = cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          collapsed && "justify-center px-0",
          active
            ? "bg-white/8 font-medium text-fg"
            : item.soon
              ? "cursor-not-allowed text-fg-subtle/70"
              : "text-fg-muted hover:bg-white/5 hover:text-fg"
        );
        return item.soon ? (
          <div key={item.href} className={cls} title={`${item.label} · скоро`} aria-disabled>
            {content}
          </div>
        ) : (
          <Link key={item.href} href={item.href} className={cls} onClick={() => setMobileOpen(false)} title={item.label}>
            {content}
          </Link>
        );
      })}
    </nav>
  );

  const brand = (
    <Link
      href="/admin"
      className={cn("flex items-center gap-2.5", collapsed && "justify-center")}
      onClick={() => setMobileOpen(false)}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-fg text-ink">
        <span className="font-display text-base font-extrabold">A</span>
      </span>
      {!collapsed && (
        <span className="font-display text-base font-bold tracking-tight text-fg">AutoHaus</span>
      )}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-base text-fg">
      {/* ── Desktop sidebar ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-surface transition-[width] duration-200 lg:flex",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        <div className={cn("flex h-16 items-center border-b border-line px-4", collapsed && "justify-center px-0")}>
          {brand}
        </div>
        <div className="flex-1 overflow-y-auto py-4 no-scrollbar">{nav}</div>
        <div className="border-t border-line p-3">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg-subtle transition-colors hover:bg-white/5 hover:text-fg",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
            {!collapsed && <span>Свий</span>}
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-line bg-surface">
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              {brand}
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-fg-muted hover:bg-white/5">
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">{nav}</div>
          </aside>
        </div>
      )}

      {/* ── Main column ── */}
      <div className={cn("flex min-w-0 flex-1 flex-col transition-[padding] duration-200", collapsed ? "lg:pl-[68px]" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-base/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-1.5 text-fg-muted hover:bg-white/5 lg:hidden"
            aria-label="Меню"
          >
            <Menu className="size-5" />
          </button>

          <form onSubmit={onSearch} className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
            <input
              name="q"
              placeholder="Търси автомобили…"
              className="h-9 w-full rounded-lg border border-line-strong bg-surface/60 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
            />
          </form>

          <div className="ml-auto flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <div className="mx-1.5 h-6 w-px bg-line" />
            <UserMenu user={user} />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      <Toaster />
      <ConfirmHost />
    </div>
  );
}
