"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Gauge, Crown, Sparkles, LayoutGrid, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { collections } from "@/lib/collections";
import type { Collection } from "@/types";

type Props = {
  active?: Collection;
  counts: Record<string, number>;
  total: number;
  onSelect: (c?: Collection) => void;
};

/** One glyph per collection — the instrument-cluster read of the reference. */
const ICONS: Record<Collection, LucideIcon> = {
  performance: Gauge,
  executive: Crown,
  signature: Sparkles,
};

/**
 * The Cockpit — collection selector as a premium motorsport instrument pod.
 *
 * An aerodynamic, chamfered glass housing carries a sliding illuminated indicator
 * that glides between segments (shared layout). The whole pod stays calm titanium
 * for Executive / Signature — and IGNITES racing-red the instant "Performance" is
 * active (indicator, R insignia, edge filament, underglow and telemetry bar all
 * turn hot). That contrast is the point: luxury by default, motorsport on demand.
 *
 * Preserves the original props, behaviour and the `collectionPill` layoutId so the
 * listing keeps working untouched. GPU-only transitions; reduced-motion aware.
 */
export function CollectionTabs({ active, counts, total, onSelect }: Props) {
  const tabs: { slug?: Collection; label: string; count: number }[] = [
    { slug: undefined, label: "Всички", count: total },
    ...collections.map((c) => ({
      slug: c.slug,
      label: c.label,
      count: counts[c.slug] ?? 0,
    })),
  ];
  const activeMeta = active ? collections.find((c) => c.slug === active) : null;
  // The ignition switch: red fires only when Performance is the active collection.
  const hot = active === "performance";
  const activeCount = active ? counts[active] ?? 0 : total;

  return (
    <div className="border-b border-line pb-7">
      <div className="relative" style={{ ["--ch" as string]: "12px" }}>
        {/* ── Pod housing (decorative, layered, chamfered) ── */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ filter: "drop-shadow(0 14px 28px rgb(0 0 0 / 0.38))" }}
        >
          {/* body + outline (clip-path chamfers the border into an octagon) */}
          <div
            className={cn(
              "absolute inset-0 clip-chamfer border transition-colors duration-500",
              hot ? "border-racing/35" : "border-white/10",
            )}
            style={{ background: "linear-gradient(180deg, #15181e 0%, #0b0d11 100%)" }}
          />
          <div className="absolute inset-0 clip-chamfer carbon-fine opacity-25" />
          {/* top glass sheen */}
          <div
            className="absolute inset-0 clip-chamfer"
            style={{ background: "linear-gradient(180deg, rgb(245 247 249 / 0.07), transparent 44%)" }}
          />
          {/* titanium top hairline (fades out when hot) */}
          <div
            className={cn(
              "edge-light absolute inset-0 clip-chamfer transition-opacity duration-500",
              hot ? "opacity-0" : "opacity-100",
            )}
          />
          {/* racing edge filament + red wash + slow scan (fade in when hot) */}
          <div
            className={cn(
              "edge-race absolute inset-0 clip-chamfer transition-opacity duration-500",
              hot ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            className={cn("absolute inset-0 clip-chamfer transition-opacity duration-700", hot ? "opacity-100" : "opacity-0")}
            style={{ background: "radial-gradient(130% 170% at 50% -35%, rgb(var(--racing-glow) / 0.16), transparent 60%)" }}
          />
          <div className={cn("absolute inset-0 clip-chamfer overflow-hidden transition-opacity duration-700", hot ? "opacity-100" : "opacity-0")}>
            <div
              className="race-scan absolute inset-y-0 -left-1/3 w-1/3"
              style={{ background: "linear-gradient(90deg, transparent, rgb(var(--racing-glow) / 0.13), transparent)" }}
            />
          </div>
        </div>

        {/* ── Content row ── */}
        <div className="relative z-10 flex items-stretch gap-1 p-1.5 md:gap-2">
          {/* status filament — a slim racing bar that breathes when hot */}
          <div className="hidden items-center pl-1.5 pr-2.5 md:flex" aria-hidden>
            <span
              className={cn(
                "h-7 w-[3px] rounded-full transition-all duration-500",
                hot ? "race-underglow bg-racing" : "bg-racing/55",
              )}
            />
          </div>

          {/* Segments track — scrolls horizontally on phones */}
          <div className="no-scrollbar flex flex-1 items-center gap-1 overflow-x-auto overscroll-x-contain md:gap-1">
            {tabs.map((t) => {
              const isActive = t.slug === active;
              const Icon: LucideIcon = t.slug ? ICONS[t.slug] : LayoutGrid;
              return (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => onSelect(t.slug)}
                  aria-pressed={isActive}
                  className={cn(
                    "relative shrink-0 rounded-[10px] px-3.5 py-2.5 text-sm transition-colors duration-300 max-md:min-h-11 md:px-4",
                    isActive
                      ? hot
                        ? "text-white"
                        : "text-ink"
                      : "text-fg-muted hover:text-fg",
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="collectionPill"
                      className={cn(
                        "absolute inset-0 rounded-[10px]",
                        hot
                          ? "race-underglow bg-racing"
                          : "bg-fg shadow-[0_8px_30px_-12px_rgba(245,247,249,0.5)]",
                      )}
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2 font-medium tracking-tight">
                    <Icon
                      className={cn("size-3.5 transition-opacity duration-300", isActive ? "opacity-100" : "opacity-55")}
                      strokeWidth={1.9}
                      aria-hidden
                    />
                    {t.label}
                    <span
                      className={cn(
                        "text-xs tabular-nums transition-colors",
                        isActive ? (hot ? "text-white/60" : "text-ink/55") : "text-fg-subtle",
                      )}
                    >
                      {t.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Grid readout — a live instrument count of the active set */}
          <div className="hidden items-center gap-3 border-l border-white/10 pl-4 pr-2.5 md:flex">
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full transition-colors duration-500",
                hot ? "race-led bg-racing" : "bg-accent",
              )}
            />
            <div className="text-right leading-none">
              <div className="label-fine text-[9px] text-fg-subtle">В колекцията</div>
              <motion.div
                key={activeCount}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="mt-1 font-display text-base font-bold tabular-nums text-fg"
              >
                {activeCount}
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry scale — a thin instrument tick strip beneath the pod */}
      <div className="mt-3 flex items-center gap-3 px-0.5">
        <div className={cn("hud-ticks h-2 flex-1 transition-colors duration-500", hot ? "text-racing/25" : "text-white/[0.1]")} />
        <span className="label-fine shrink-0 text-[9px] text-fg-subtle">
          {tabs.length.toString().padStart(2, "0")} режима
        </span>
      </div>

      {/* Collection statement — a leading bar that runs hot for Performance */}
      <AnimatePresence mode="wait">
        {activeMeta && (
          <motion.div
            key={activeMeta.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 flex items-start gap-4"
          >
            <span
              className={cn(
                "mt-1 h-9 w-[3px] shrink-0 rounded-full transition-colors duration-500",
                hot ? "race-underglow bg-racing" : "bg-accent",
              )}
            />
            <p className="max-w-2xl text-sm leading-relaxed text-fg-muted md:text-[16px]">
              <span className="font-display font-semibold text-fg">{activeMeta.tagline} </span>
              {activeMeta.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
