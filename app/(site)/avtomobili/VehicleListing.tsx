"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import type { Vehicle, FuelType, Transmission, Drivetrain } from "@/types";
import {
  parseFiltersFromParams,
  serializeFilters,
  applyFilters,
  sortVehicles,
  activeFilterCount,
  emptyFilters,
  sortOptions,
  type Filters,
  type SortKey,
} from "@/lib/vehicle-filter";
import { cn } from "@/lib/utils";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { FilterSidebar } from "./FilterSidebar";
import { CollectionTabs } from "./CollectionTabs";

type VehicleListingProps = {
  vehicles: Vehicle[];
};

export function VehicleListing({ vehicles }: VehicleListingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Filter state is LOCAL → UI updates are instant (no router round-trip).
  // The URL is synced in a debounced background effect for shareability.
  const [filters, setFilters] = useState<Filters>(() =>
    parseFiltersFromParams(new URLSearchParams(searchParams.toString())),
  );
  const [sort, setSort] = useState<SortKey>(
    () => (searchParams.get("sort") as SortKey) || "newest",
  );

  const yearRange: [number, number] = useMemo(() => {
    if (!vehicles.length) return [2000, new Date().getFullYear()];
    const years = vehicles.map((v) => v.year);
    return [Math.min(...years), Math.max(...years)];
  }, [vehicles]);
  const priceRange: [number, number] = useMemo(() => {
    if (!vehicles.length) return [0, 100000];
    const prices = vehicles.map((v) => v.price);
    return [Math.min(...prices), Math.max(...prices)];
  }, [vehicles]);

  // Filter facets are derived from the current inventory (was a static import).
  const uniqueBrands = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.brand))).sort(),
    [vehicles],
  );
  const uniqueBodyTypes = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.bodyType))).sort(),
    [vehicles],
  );

  // Counts respect ALL filters except the one being toggled — too costly here, use full counts
  const counts = useMemo(() => {
    const c = {
      brand: {} as Record<string, number>,
      body: {} as Record<string, number>,
      fuel: {} as Record<FuelType, number>,
      trans: {} as Record<Transmission, number>,
      drive: {} as Record<Drivetrain, number>,
    };
    for (const v of vehicles) {
      c.brand[v.brand] = (c.brand[v.brand] ?? 0) + 1;
      c.body[v.bodyType] = (c.body[v.bodyType] ?? 0) + 1;
      c.fuel[v.fuelType] = (c.fuel[v.fuelType] ?? 0) + 1;
      c.trans[v.transmission] = (c.trans[v.transmission] ?? 0) + 1;
      c.drive[v.drivetrain] = (c.drive[v.drivetrain] ?? 0) + 1;
    }
    return c;
  }, [vehicles]);

  const results = useMemo(
    () => sortVehicles(applyFilters(vehicles, filters), sort),
    [vehicles, filters, sort],
  );

  const updateFilters = useCallback((partial: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const updateSort = useCallback((s: SortKey) => setSort(s), []);

  const clearAll = useCallback(() => {
    setFilters(emptyFilters);
    setSort("newest");
  }, []);

  // Debounced URL sync — keeps the address bar shareable without blocking UI.
  const firstSync = useRef(true);
  useEffect(() => {
    if (firstSync.current) {
      firstSync.current = false;
      return;
    }
    const id = setTimeout(() => {
      const params = serializeFilters(filters, sort);
      const qs = params.toString();
      router.replace(`${pathname}${qs ? "?" + qs : ""}`, { scroll: false });
    }, 250);
    return () => clearTimeout(id);
  }, [filters, sort, router, pathname]);

  // Lock background scroll while the mobile filter drawer is open.
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFiltersOpen]);

  const activeCount = activeFilterCount(filters);

  const collectionCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const v of vehicles) c[v.collection] = (c[v.collection] ?? 0) + 1;
    return c;
  }, [vehicles]);
  const rentalCount = useMemo(
    () => vehicles.filter((v) => v.rentalPerDay !== undefined).length,
    [vehicles],
  );

  return (
    <div>
      <CollectionTabs
        active={filters.collection}
        counts={collectionCounts}
        total={vehicles.length}
        onSelect={(c) => updateFilters({ collection: c })}
      />

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr] lg:gap-16">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <div className="sticky top-28">
          <FilterSidebar
            filters={filters}
            counts={counts}
            brands={uniqueBrands}
            bodyTypes={uniqueBodyTypes}
            yearRange={yearRange}
            priceRange={priceRange}
            onChange={updateFilters}
            onClear={clearAll}
          />
        </div>
      </aside>

      {/* Mobile filter drawer */}
      <AnimatePresence>
        {mobileFiltersOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="field-graphite fixed inset-0 z-[60] flex flex-col lg:hidden"
            data-lenis-prevent
          >
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <FilterSidebar
                filters={filters}
                counts={counts}
                brands={uniqueBrands}
                bodyTypes={uniqueBodyTypes}
                yearRange={yearRange}
                priceRange={priceRange}
                onChange={updateFilters}
                onClear={clearAll}
                onClose={() => setMobileFiltersOpen(false)}
              />
            </div>
            {/* Sticky apply bar — always reachable, no scroll-to-bottom hunt */}
            <div className="border-t border-line-strong bg-base/85 p-4 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-14 w-full items-center justify-center rounded-full bg-fg text-sm font-medium text-ink transition-colors hover:bg-accent"
              >
                Покажи {results.length}{" "}
                {results.length === 1 ? "автомобил" : "автомобила"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div>
        <h2 className="sr-only">Резултати</h2>
        {/* Mobile filter button + sort */}
        <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-4 py-2 text-sm text-fg transition-colors hover:border-accent lg:hidden"
            >
              <SlidersHorizontal className="size-4" />
              Филтри
              {activeCount > 0 && (
                <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-accent text-[10px] text-ink">
                  {activeCount}
                </span>
              )}
            </button>
            <p className="hidden text-sm text-fg-muted lg:block">
              {results.length === 0
                ? "Няма резултати"
                : `${results.length} ${
                    results.length === 1 ? "автомобил" : "автомобила"
                  }`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <RentalToggle
              active={!!filters.rentalOnly}
              count={rentalCount}
              onToggle={() =>
                updateFilters({ rentalOnly: filters.rentalOnly ? undefined : true })
              }
            />
            <SortDropdown value={sort} onChange={updateSort} />
          </div>
        </div>

        {/* Active filter pills */}
        {activeCount > 0 && (
          <ActiveFilterPills
            filters={filters}
            onChange={updateFilters}
            onClear={clearAll}
          />
        )}

        {/* Grid */}
        {results.length === 0 ? (
          <EmptyState onClear={clearAll} />
        ) : (
          <motion.div
            key={filters.collection ?? "all"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-1 gap-x-10 gap-y-14 sm:mt-12 md:grid-cols-2 md:gap-y-20 xl:grid-cols-3"
          >
            {results.map((v, i) => (
              <FadeIn key={v.id} delay={(i % 6) * 0.06} y={24}>
                {/* First card is the catalog's LCP — load it eagerly. */}
                <VehicleCard vehicle={v} priority={i === 0} />
              </FadeIn>
            ))}
          </motion.div>
        )}
      </div>
      </div>
    </div>
  );
}

function RentalToggle({
  active,
  count,
  onToggle,
}: {
  active: boolean;
  count: number;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors",
        active
          ? "border-accent bg-accent text-ink"
          : "border-line-strong bg-white/[0.03] text-fg-muted hover:border-accent hover:text-fg",
      )}
    >
      <span className={cn("size-1.5 rounded-full", active ? "bg-ink" : "bg-accent")} />
      За наем
      <span
        className={cn(
          "text-xs tabular-nums",
          active ? "text-ink/60" : "text-fg-subtle",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function SortDropdown({
  value,
  onChange,
}: {
  value: SortKey;
  onChange: (s: SortKey) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortKey)}
        aria-label="Сортиране на резултатите"
        className="appearance-none rounded-full border border-line-strong bg-white/[0.03] py-2 pl-4 pr-10 text-sm text-fg transition-colors hover:border-accent focus:border-accent focus:outline-none [&>option]:bg-surface [&>option]:text-fg"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
    </div>
  );
}

function ActiveFilterPills({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (next: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const pills: Array<{ label: string; onRemove: () => void }> = [];
  filters.brands.forEach((b) =>
    pills.push({
      label: b,
      onRemove: () =>
        onChange({ brands: filters.brands.filter((x) => x !== b) }),
    }),
  );
  filters.bodyTypes.forEach((b) =>
    pills.push({
      label: b,
      onRemove: () =>
        onChange({ bodyTypes: filters.bodyTypes.filter((x) => x !== b) }),
    }),
  );
  filters.fuels.forEach((f) =>
    pills.push({
      label: f,
      onRemove: () => onChange({ fuels: filters.fuels.filter((x) => x !== f) }),
    }),
  );
  if (filters.yearMin !== undefined || filters.yearMax !== undefined) {
    pills.push({
      label: `Година: ${filters.yearMin ?? "−"}–${filters.yearMax ?? "−"}`,
      onRemove: () => onChange({ yearMin: undefined, yearMax: undefined }),
    });
  }
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    pills.push({
      label: `Цена: ${filters.priceMin ?? "−"}–${filters.priceMax ?? "−"} €`,
      onRemove: () => onChange({ priceMin: undefined, priceMax: undefined }),
    });
  }
  if (filters.mileageMax !== undefined) {
    pills.push({
      label: `≤ ${filters.mileageMax.toLocaleString("bg-BG")} км`,
      onRemove: () => onChange({ mileageMax: undefined }),
    });
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-2">
      {pills.map((p, i) => (
        <button
          key={i}
          type="button"
          onClick={p.onRemove}
          className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-3 py-1.5 text-xs text-fg-muted transition-colors hover:border-accent hover:text-accent"
        >
          {p.label}
          <span className="text-base leading-none">×</span>
        </button>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-2 text-xs uppercase tracking-wider text-fg-subtle underline-offset-4 hover:text-fg-muted hover:underline"
      >
        Изчисти всички
      </button>
    </div>
  );
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-16 flex flex-col items-start gap-6 border-t border-line pt-16">
      <p className="eyebrow text-fg-muted">Без резултати</p>
      <h3 className="font-display text-display-xs font-bold text-fg">
        Няма автомобили, отговарящи на филтрите.
      </h3>
      <p className="max-w-md text-fg-muted">
        Опитайте с по-широки критерии или ни оставете запитване — често имаме автомобили в подготовка, преди да достигнат сайта.
      </p>
      <button
        type="button"
        onClick={onClear}
        className={cn(
          "inline-flex h-12 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink transition-colors hover:bg-accent",
        )}
      >
        Изчисти филтрите
      </button>
    </div>
  );
}
