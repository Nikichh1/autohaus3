"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";
import type { Filters } from "@/lib/vehicle-filter";
import type { FuelType, Transmission, Drivetrain } from "@/types";

type Counts = {
  brand: Record<string, number>;
  body: Record<string, number>;
  fuel: Record<FuelType, number>;
  trans: Record<Transmission, number>;
  drive: Record<Drivetrain, number>;
};

type FilterBarProps = {
  filters: Filters;
  counts: Counts;
  brands: string[];
  bodyTypes: string[];
  yearRange: [number, number];
  priceRange: [number, number];
  activeCount: number;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
};

/**
 * Desktop filtering as a toolbar of compact popovers — the workshop's tool
 * wall, not a wall of accordions. Each chip opens a bounded panel (max-height,
 * internal scroll, multi-column brands so every manufacturer is visible at a
 * glance); the page layout never stretches. One panel at a time; Esc or an
 * outside click closes; active chips carry their selection count.
 */
export function FilterBar({
  filters,
  counts,
  brands,
  bodyTypes,
  yearRange,
  priceRange,
  activeCount,
  onChange,
  onClear,
}: FilterBarProps) {
  const [open, setOpen] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (barRef.current && e.target instanceof Node && !barRef.current.contains(e.target))
        setOpen(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleIn = <T,>(list: T[], v: T, add: boolean) =>
    add ? [...list, v] : list.filter((x) => x !== v);

  return (
    <div ref={barRef} className="relative z-20 flex flex-wrap items-center gap-2">
      <Chip
        label="Марка"
        active={filters.brands.length}
        open={open === "brand"}
        onToggle={() => setOpen(open === "brand" ? null : "brand")}
      >
        <div className="grid w-[30rem] max-w-[70vw] grid-cols-3 gap-x-5">
          {brands.map((b) => (
            <Check
              key={b}
              label={b}
              count={counts.brand[b] ?? 0}
              checked={filters.brands.includes(b)}
              onChange={(c) => onChange({ brands: toggleIn(filters.brands, b, c) })}
            />
          ))}
        </div>
      </Chip>

      <Chip
        label="Каросерия"
        active={filters.bodyTypes.length}
        open={open === "body"}
        onToggle={() => setOpen(open === "body" ? null : "body")}
      >
        <div className="grid w-[22rem] max-w-[60vw] grid-cols-2 gap-x-5">
          {bodyTypes.map((b) => (
            <Check
              key={b}
              label={b}
              count={counts.body[b] ?? 0}
              checked={filters.bodyTypes.includes(b)}
              onChange={(c) => onChange({ bodyTypes: toggleIn(filters.bodyTypes, b, c) })}
            />
          ))}
        </div>
      </Chip>

      <Chip
        label="Гориво"
        active={filters.fuels.length}
        open={open === "fuel"}
        onToggle={() => setOpen(open === "fuel" ? null : "fuel")}
      >
        <div className="w-52">
          {(["petrol", "diesel", "hybrid", "electric"] as FuelType[]).map((f) => (
            <Check
              key={f}
              label={fuelLabels[f]}
              count={counts.fuel[f] ?? 0}
              checked={filters.fuels.includes(f)}
              onChange={(c) => onChange({ fuels: toggleIn(filters.fuels, f, c) })}
            />
          ))}
        </div>
      </Chip>

      <Chip
        label="Скорости"
        active={filters.transmissions.length}
        open={open === "trans"}
        onToggle={() => setOpen(open === "trans" ? null : "trans")}
      >
        <div className="w-48">
          {(["automatic", "manual"] as Transmission[]).map((t) => (
            <Check
              key={t}
              label={transmissionLabels[t]}
              count={counts.trans[t] ?? 0}
              checked={filters.transmissions.includes(t)}
              onChange={(c) => onChange({ transmissions: toggleIn(filters.transmissions, t, c) })}
            />
          ))}
        </div>
      </Chip>

      <Chip
        label="Задвижване"
        active={filters.drivetrains.length}
        open={open === "drive"}
        onToggle={() => setOpen(open === "drive" ? null : "drive")}
      >
        <div className="w-48">
          {(["awd", "rwd", "fwd"] as Drivetrain[]).map((d) => (
            <Check
              key={d}
              label={drivetrainLabels[d]}
              count={counts.drive[d] ?? 0}
              checked={filters.drivetrains.includes(d)}
              onChange={(c) => onChange({ drivetrains: toggleIn(filters.drivetrains, d, c) })}
            />
          ))}
        </div>
      </Chip>

      <Chip
        label="Година"
        active={filters.yearMin !== undefined || filters.yearMax !== undefined ? 1 : 0}
        open={open === "year"}
        onToggle={() => setOpen(open === "year" ? null : "year")}
      >
        <Range
          min={yearRange[0]}
          max={yearRange[1]}
          valueMin={filters.yearMin}
          valueMax={filters.yearMax}
          onChange={(min, max) => onChange({ yearMin: min, yearMax: max })}
        />
      </Chip>

      <Chip
        label="Цена (€)"
        active={filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0}
        open={open === "price"}
        onToggle={() => setOpen(open === "price" ? null : "price")}
      >
        <Range
          min={priceRange[0]}
          max={priceRange[1]}
          step={5000}
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          onChange={(min, max) => onChange({ priceMin: min, priceMax: max })}
        />
      </Chip>

      <Chip
        label="Пробег"
        active={filters.mileageMax !== undefined ? 1 : 0}
        open={open === "km"}
        onToggle={() => setOpen(open === "km" ? null : "km")}
      >
        <div className="w-56">
          <label className="label-fine text-fg-subtle">Максимален пробег (км)</label>
          <input
            type="number"
            min={0}
            step={5000}
            placeholder="без ограничение"
            value={filters.mileageMax ?? ""}
            onChange={(e) => onChange({ mileageMax: e.target.value ? Number(e.target.value) : undefined })}
            className="mt-2 h-10 w-full border-b border-line bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
          />
        </div>
      </Chip>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            onClear();
            setOpen(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs uppercase tracking-wider text-fg-muted transition-colors hover:text-accent"
        >
          <X className="size-3.5" />
          Изчисти ({activeCount})
        </button>
      )}
    </div>
  );
}

function Chip({
  label,
  active,
  open,
  onToggle,
  children,
}: {
  label: string;
  active: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
          open || active
            ? "border-accent/70 bg-white/[0.06] text-fg"
            : "border-line-strong bg-white/[0.03] text-fg-muted hover:border-accent/50 hover:text-fg",
        )}
      >
        {label}
        {active > 0 && (
          <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">
            {active}
          </span>
        )}
        <ChevronDown className={cn("size-3.5 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="panel-metal edge-light absolute left-0 top-full z-30 mt-2 max-h-[22rem] overflow-y-auto overscroll-contain rounded-xl p-4 shadow-cinema" data-lenis-prevent>
          {children}
        </div>
      )}
    </div>
  );
}

function Check({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onChange: (c: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-2.5 py-1.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span className="grid size-4 shrink-0 place-items-center border border-line-strong transition-colors group-hover:border-accent peer-checked:border-accent peer-checked:bg-accent">
        {checked && (
          <svg viewBox="0 0 16 16" fill="none" className="size-3 text-ink">
            <path d="M3 8.5L6.5 12 13 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span className={cn("flex-1 truncate text-sm transition-colors", checked ? "text-fg" : "text-fg-muted group-hover:text-fg")}>
        {label}
      </span>
      <span className="text-xs tabular-nums text-fg-subtle">{count}</span>
    </label>
  );
}

function Range({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  valueMin?: number;
  valueMax?: number;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  return (
    <div className="grid w-64 grid-cols-2 gap-3">
      <div>
        <label className="label-fine text-fg-subtle">от</label>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={String(min)}
          value={valueMin ?? ""}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined, valueMax)}
          className="mt-1.5 h-10 w-full border-b border-line bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label className="label-fine text-fg-subtle">до</label>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          placeholder={String(max)}
          value={valueMax ?? ""}
          onChange={(e) => onChange(valueMin, e.target.value ? Number(e.target.value) : undefined)}
          className="mt-1.5 h-10 w-full border-b border-line bg-transparent text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </div>
    </div>
  );
}
