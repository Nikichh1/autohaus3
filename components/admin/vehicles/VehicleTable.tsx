"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MoreHorizontal,
  Star,
  Pencil,
  Copy,
  Eye,
  EyeOff,
  Clock,
  BadgeCheck,
  Archive,
  Trash2,
  Car,
  Loader2,
} from "lucide-react";
import { cn, formatPriceEUR, formatNumber } from "@/lib/utils";
import type { Permission } from "@/lib/admin/rbac";
import { StatusBadge } from "./StatusBadge";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import {
  setVehicleStatus,
  toggleFeatured,
  duplicateVehicle,
  deleteVehicle,
  bulkSetStatus,
  bulkSetFeatured,
  bulkDelete,
  type ActionResult,
} from "@/lib/admin/vehicle-actions";

export type VehicleRow = {
  id: string;
  brand: string;
  model: string;
  variant: string | null;
  year: number;
  price: number;
  priceOnRequest: boolean;
  status: string;
  featured: boolean;
  mileage: number;
  collection: string;
  fuelType: string;
  imageCount: number;
  imageUrl: string | null;
  updatedAt: string;
};

function price(row: VehicleRow) {
  return row.priceOnRequest || row.price === 0 ? "При запитване" : formatPriceEUR(row.price);
}

export function VehicleTable({
  rows,
  permissions,
}: {
  rows: VehicleRow[];
  permissions: Permission[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();

  const can = (p: Permission) => permissions.includes(p);
  const allChecked = rows.length > 0 && selected.size === rows.length;

  function toggleAll() {
    setSelected(allChecked ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(promise: Promise<ActionResult>, success: string) {
    startTransition(async () => {
      const res = await promise;
      if (res.ok) {
        toast(success);
        setSelected(new Set());
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  const ids = [...selected];

  async function onBulkDelete() {
    const ok = await confirmDialog({
      title: `Изтриване на ${ids.length} автомобила?`,
      description: "Това действие е необратимо. Снимките също ще бъдат изтрити.",
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (ok) run(bulkDelete(ids), `${ids.length} изтрити`);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-surface px-6 py-16 text-center">
        <Car className="mx-auto size-9 text-fg-subtle" />
        <p className="mt-3 text-sm font-medium text-fg">Няма намерени автомобили</p>
        <p className="mt-1 text-sm text-fg-muted">Променете филтрите или добавете нов автомобил.</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface">
      {/* Bulk action bar */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-elevated px-4 py-2.5">
          <span className="text-sm font-medium text-fg">{selected.size} избрани</span>
          <div className="mx-1 h-5 w-px bg-line" />
          {pending ? <Loader2 className="size-4 animate-spin text-fg-muted" /> : null}
          {can("vehicle.publish") && (
            <BulkBtn onClick={() => run(bulkSetStatus(ids, "available"), "Публикувани")}>Публикувай</BulkBtn>
          )}
          {can("vehicle.publish") && (
            <BulkBtn onClick={() => run(bulkSetStatus(ids, "draft"), "Скрити")}>Скрий</BulkBtn>
          )}
          {can("vehicle.update") && (
            <BulkBtn onClick={() => run(bulkSetStatus(ids, "reserved"), "Резервирани")}>Резервирай</BulkBtn>
          )}
          {can("vehicle.update") && (
            <BulkBtn onClick={() => run(bulkSetStatus(ids, "sold"), "Маркирани продадени")}>Продаден</BulkBtn>
          )}
          {can("vehicle.feature") && (
            <BulkBtn onClick={() => run(bulkSetFeatured(ids, true), "Промотирани")}>Промотирай</BulkBtn>
          )}
          {can("vehicle.archive") && (
            <BulkBtn onClick={() => run(bulkSetStatus(ids, "archived"), "Архивирани")}>Архивирай</BulkBtn>
          )}
          {can("vehicle.delete") && (
            <BulkBtn danger onClick={onBulkDelete}>
              Изтрий
            </BulkBtn>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-sm text-fg-muted transition-colors hover:text-fg"
          >
            Отмени
          </button>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-fg-subtle">
              <th className="w-10 px-4 py-2.5">
                <input
                  type="checkbox"
                  checked={allChecked}
                  onChange={toggleAll}
                  className="size-4 rounded border-line-strong bg-base accent-accent"
                />
              </th>
              <th className="px-2 py-2.5 font-medium">Автомобил</th>
              <th className="px-3 py-2.5 font-medium">Година</th>
              <th className="px-3 py-2.5 font-medium">Цена</th>
              <th className="px-3 py-2.5 font-medium">Пробег</th>
              <th className="px-3 py-2.5 font-medium">Статус</th>
              <th className="w-10 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => {
              const checked = selected.has(row.id);
              return (
                <tr key={row.id} className={cn("group transition-colors hover:bg-white/[0.02]", checked && "bg-white/[0.03]")}>
                  <td className="px-4 py-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOne(row.id)}
                      className="size-4 rounded border-line-strong bg-base accent-accent"
                    />
                  </td>
                  <td className="px-2 py-2.5">
                    <Link href={`/admin/vehicles/${row.id}`} prefetch={false} className="flex items-center gap-3">
                      <span className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md bg-elevated">
                        {row.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <span className="flex h-full w-full items-center justify-center text-fg-subtle">
                            <Car className="size-4" />
                          </span>
                        )}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate font-medium text-fg group-hover:text-accent">
                            {row.brand} {row.model}
                          </span>
                          {row.featured ? <Star className="size-3.5 shrink-0 fill-amber-300 text-amber-300" /> : null}
                        </span>
                        <span className="block truncate text-xs text-fg-subtle">
                          {row.variant ? `${row.variant} · ` : ""}
                          {row.imageCount} снимки
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-fg-muted">{row.year}</td>
                  <td className="px-3 py-2.5 font-medium text-fg">{price(row)}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{formatNumber(row.mileage)} км</td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <RowActions row={row} permissions={permissions} onRun={run} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BulkBtn({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
        danger
          ? "text-red-300 hover:bg-red-500/15"
          : "text-fg-muted hover:bg-white/8 hover:text-fg"
      )}
    >
      {children}
    </button>
  );
}

function RowActions({
  row,
  permissions,
  onRun,
}: {
  row: VehicleRow;
  permissions: Permission[];
  onRun: (p: Promise<ActionResult>, msg: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const can = (p: Permission) => permissions.includes(p);
  const published = row.status === "available";

  // Open the menu, positioning it under the trigger and kept on-screen.
  function toggle() {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect();
      const width = 208;
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
      setCoords({ top: r.bottom + 6, left });
    }
    setOpen((o) => !o);
  }

  // Close on outside click, scroll, resize, or Escape.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  // Run a row action and close the menu.
  const act = (p: Promise<ActionResult>, msg: string) => {
    setOpen(false);
    onRun(p, msg);
  };

  async function onDelete() {
    setOpen(false);
    const ok = await confirmDialog({
      title: "Изтриване на автомобила?",
      description: `${row.brand} ${row.model} ще бъде изтрит безвъзвратно.`,
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (ok) onRun(deleteVehicle(row.id), "Изтрит");
  }

  const menu = open ? (
    <div
      ref={menuRef}
      style={{ position: "fixed", top: coords.top, left: coords.left, width: 208 }}
      className="z-50 overflow-hidden rounded-xl border border-line-strong bg-elevated py-1 shadow-cinema"
    >
      <MenuLink href={`/admin/vehicles/${row.id}`} icon={<Pencil className="size-4" />}>
        Редактирай
      </MenuLink>

          {can("vehicle.publish") &&
            (published ? (
              <MenuItem icon={<EyeOff className="size-4" />} onClick={() => act(setVehicleStatus(row.id, "draft"), "Скрит")}>
                Скрий (чернова)
              </MenuItem>
            ) : (
              <MenuItem icon={<Eye className="size-4" />} onClick={() => act(setVehicleStatus(row.id, "available"), "Публикуван")}>
                Публикувай
              </MenuItem>
            ))}

          {can("vehicle.update") && (
            <MenuItem icon={<Clock className="size-4" />} onClick={() => act(setVehicleStatus(row.id, "reserved"), "Резервиран")}>
              Маркирай резервиран
            </MenuItem>
          )}
          {can("vehicle.update") && (
            <MenuItem icon={<BadgeCheck className="size-4" />} onClick={() => act(setVehicleStatus(row.id, "sold"), "Продаден")}>
              Маркирай продаден
            </MenuItem>
          )}
          {can("vehicle.feature") && (
            <MenuItem icon={<Star className="size-4" />} onClick={() => act(toggleFeatured(row.id, !row.featured), row.featured ? "Премахнат от промо" : "Промотиран")}>
              {row.featured ? "Премахни промо" : "Промотирай"}
            </MenuItem>
          )}

          {can("vehicle.duplicate") && (
            <form action={duplicateVehicle.bind(null, row.id)}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
              >
                <Copy className="size-4" />
                Дублирай
              </button>
            </form>
          )}

          {(can("vehicle.archive") || can("vehicle.delete")) && <div className="my-1 h-px bg-line" />}

          {can("vehicle.archive") && row.status !== "archived" && (
            <MenuItem icon={<Archive className="size-4" />} onClick={() => act(setVehicleStatus(row.id, "archived"), "Архивиран")}>
              Архивирай
            </MenuItem>
          )}
      {can("vehicle.delete") && (
        <button
          onClick={onDelete}
          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-red-300 transition-colors hover:bg-red-500/12"
        >
          <Trash2 className="size-4" />
          Изтрий
        </button>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        onClick={toggle}
        className="flex size-8 items-center justify-center rounded-lg text-fg-subtle opacity-60 transition-all hover:bg-white/8 hover:text-fg group-hover:opacity-100"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Действия"
      >
        <MoreHorizontal className="size-4" />
      </button>
      {typeof document !== "undefined" ? createPortal(menu, document.body) : null}
    </>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
    >
      {icon}
      {children}
    </button>
  );
}

function MenuLink({
  children,
  icon,
  href,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
    >
      {icon}
      {children}
    </Link>
  );
}
