"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Select } from "@/components/admin/ui/input";
import {
  STATUS_LABELS,
  VEHICLE_STATUSES,
  COLLECTION_LABELS,
  COLLECTIONS,
  FUEL_TYPES,
  fuelLabels,
} from "@/lib/admin/constants";

export function VehicleFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const first = useRef(true);

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(sp.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`);
  }

  // Debounce search.
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(() => setParam("q", q.trim()), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const status = sp.get("status") ?? "";
  const collection = sp.get("collection") ?? "";
  const fuel = sp.get("fuelType") ?? "";
  const sort = sp.get("sort") ?? "updated";
  const hasFilters = Boolean(q || status || collection || fuel || sp.get("featured"));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[220px] flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Търси марка, модел, VIN…"
          className="h-9 w-full rounded-lg border border-line-strong bg-surface/60 pl-9 pr-3 text-sm text-fg placeholder:text-fg-subtle outline-none focus:border-accent"
        />
      </div>

      <Select value={status} onChange={(e) => setParam("status", e.target.value)} className="w-auto min-w-[130px]">
        <option value="">Всички статуси</option>
        {VEHICLE_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select value={collection} onChange={(e) => setParam("collection", e.target.value)} className="w-auto min-w-[130px]">
        <option value="">Всички колекции</option>
        {COLLECTIONS.map((c) => (
          <option key={c} value={c}>
            {COLLECTION_LABELS[c]}
          </option>
        ))}
      </Select>

      <Select value={fuel} onChange={(e) => setParam("fuelType", e.target.value)} className="w-auto min-w-[120px]">
        <option value="">Всяко гориво</option>
        {FUEL_TYPES.map((f) => (
          <option key={f} value={f}>
            {fuelLabels[f]}
          </option>
        ))}
      </Select>

      <Select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="w-auto min-w-[150px]">
        <option value="updated">Последно обновени</option>
        <option value="newest">Най-нови</option>
        <option value="oldest">Най-стари</option>
        <option value="price_desc">Цена ↓</option>
        <option value="price_asc">Цена ↑</option>
        <option value="year_desc">Година ↓</option>
        <option value="year_asc">Година ↑</option>
      </Select>

      {hasFilters ? (
        <button
          onClick={() => {
            setQ("");
            router.replace(pathname);
          }}
          className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
        >
          <X className="size-4" />
          Изчисти
        </button>
      ) : null}
    </div>
  );
}
