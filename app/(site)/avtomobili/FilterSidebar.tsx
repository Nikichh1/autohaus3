"use client";

import { useState, type ReactNode } from "react";
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

type FilterSidebarProps = {
  filters: Filters;
  counts: Counts;
  brands: string[];
  bodyTypes: string[];
  yearRange: [number, number];
  priceRange: [number, number];
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
  onClose?: () => void;
};

export function FilterSidebar({
  filters,
  counts,
  brands,
  bodyTypes,
  yearRange,
  priceRange,
  onChange,
  onClear,
  onClose,
}: FilterSidebarProps) {
  return (
    <div className="panel-metal edge-light flex h-full flex-col gap-1 rounded-[1.25rem] p-6">
      {/* Mobile-only header */}
      {onClose && (
        <div className="flex items-center justify-between border-b border-line pb-4 lg:hidden">
          <h2 className="font-display text-xl font-semibold">Филтри</h2>
          <button
            type="button"
            aria-label="Затвори филтрите"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-full border border-line text-fg"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      <FilterGroup title="Марка" defaultOpen>
        {brands.map((brand) => (
          <FilterCheckbox
            key={brand}
            label={brand}
            count={counts.brand[brand] ?? 0}
            checked={filters.brands.includes(brand)}
            onChange={(c) => {
              onChange({
                brands: c
                  ? [...filters.brands, brand]
                  : filters.brands.filter((b) => b !== brand),
              });
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Тип каросерия">
        {bodyTypes.map((body) => (
          <FilterCheckbox
            key={body}
            label={body}
            count={counts.body[body] ?? 0}
            checked={filters.bodyTypes.includes(body)}
            onChange={(c) => {
              onChange({
                bodyTypes: c
                  ? [...filters.bodyTypes, body]
                  : filters.bodyTypes.filter((b) => b !== body),
              });
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Гориво">
        {(["petrol", "diesel", "hybrid", "electric"] as FuelType[]).map(
          (fuel) => (
            <FilterCheckbox
              key={fuel}
              label={fuelLabels[fuel]}
              count={counts.fuel[fuel] ?? 0}
              checked={filters.fuels.includes(fuel)}
              onChange={(c) => {
                onChange({
                  fuels: c
                    ? [...filters.fuels, fuel]
                    : filters.fuels.filter((f) => f !== fuel),
                });
              }}
            />
          ),
        )}
      </FilterGroup>

      <FilterGroup title="Трансмисия">
        {(["automatic", "manual"] as Transmission[]).map((t) => (
          <FilterCheckbox
            key={t}
            label={transmissionLabels[t]}
            count={counts.trans[t] ?? 0}
            checked={filters.transmissions.includes(t)}
            onChange={(c) => {
              onChange({
                transmissions: c
                  ? [...filters.transmissions, t]
                  : filters.transmissions.filter((x) => x !== t),
              });
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Задвижване">
        {(["awd", "rwd", "fwd"] as Drivetrain[]).map((d) => (
          <FilterCheckbox
            key={d}
            label={drivetrainLabels[d]}
            count={counts.drive[d] ?? 0}
            checked={filters.drivetrains.includes(d)}
            onChange={(c) => {
              onChange({
                drivetrains: c
                  ? [...filters.drivetrains, d]
                  : filters.drivetrains.filter((x) => x !== d),
              });
            }}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Година">
        <RangeInputs
          min={yearRange[0]}
          max={yearRange[1]}
          valueMin={filters.yearMin}
          valueMax={filters.yearMax}
          minPlaceholder="от"
          maxPlaceholder="до"
          onChange={(min, max) =>
            onChange({ yearMin: min, yearMax: max })
          }
        />
      </FilterGroup>

      <FilterGroup title="Цена (€)">
        <RangeInputs
          min={priceRange[0]}
          max={priceRange[1]}
          step={5000}
          valueMin={filters.priceMin}
          valueMax={filters.priceMax}
          minPlaceholder="от"
          maxPlaceholder="до"
          onChange={(min, max) =>
            onChange({ priceMin: min, priceMax: max })
          }
        />
      </FilterGroup>

      <FilterGroup title="Макс. пробег (км)">
        <input
          type="number"
          min={0}
          step={5000}
          placeholder="без ограничение"
          value={filters.mileageMax ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ mileageMax: v ? Number(v) : undefined });
          }}
          className="h-10 w-full bg-transparent border-b border-line text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
        />
      </FilterGroup>

      <button
        type="button"
        onClick={onClear}
        className="mt-8 self-start text-xs uppercase tracking-wider text-fg-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
      >
        Изчисти всички филтри
      </button>
    </div>
  );
}

function FilterGroup({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="eyebrow text-fg">{title}</span>
        <ChevronDown
          className={cn(
            "size-4 text-fg-muted transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="mt-4 flex flex-col gap-1">{children}</div>}
    </div>
  );
}

function FilterCheckbox({
  label,
  count,
  checked,
  onChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 py-1.5">
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
      <span
        className={cn(
          "flex-1 text-sm transition-colors",
          checked ? "text-fg" : "text-fg-muted group-hover:text-fg",
        )}
      >
        {label}
      </span>
      {count !== undefined && (
        <span className="text-xs text-fg-subtle">{count}</span>
      )}
    </label>
  );
}

function RangeInputs({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  minPlaceholder,
  maxPlaceholder,
  onChange,
}: {
  min: number;
  max: number;
  step?: number;
  valueMin?: number;
  valueMax?: number;
  minPlaceholder: string;
  maxPlaceholder: string;
  onChange: (min: number | undefined, max: number | undefined) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={minPlaceholder}
        value={valueMin ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v ? Number(v) : undefined, valueMax);
        }}
        className="h-10 w-full bg-transparent border-b border-line text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
      />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        placeholder={maxPlaceholder}
        value={valueMax ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(valueMin, v ? Number(v) : undefined);
        }}
        className="h-10 w-full bg-transparent border-b border-line text-sm text-fg placeholder:text-fg-subtle focus:border-accent focus:outline-none"
      />
    </div>
  );
}
