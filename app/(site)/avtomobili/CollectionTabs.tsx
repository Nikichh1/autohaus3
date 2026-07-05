"use client";

import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { collections } from "@/lib/collections";
import type { Collection } from "@/types";

type Props = {
  active?: Collection;
  counts: Record<string, number>;
  total: number;
  onSelect: (c?: Collection) => void;
};

/**
 * Collection switcher — luxury sub-brand navigation. A sliding active pill
 * (shared layout) and a fading collection statement make switching feel like
 * turning the pages of a catalogue, not toggling a filter.
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
  const activeMeta = active
    ? collections.find((c) => c.slug === active)
    : null;

  return (
    <div className="border-b border-line pb-7">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
        {tabs.map((t) => {
          const isActive = t.slug === active;
          return (
            <button
              key={t.label}
              type="button"
              onClick={() => onSelect(t.slug)}
              className={cn(
                "relative shrink-0 rounded-full px-5 py-2.5 text-sm transition-colors duration-300",
                isActive ? "text-ink" : "text-fg-muted hover:text-fg",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="collectionPill"
                  className="absolute inset-0 rounded-full bg-fg shadow-[0_8px_30px_-12px_rgba(245,247,249,0.5)]"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2 font-medium tracking-tight">
                {t.label}
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    isActive ? "text-ink/55" : "text-fg-subtle",
                  )}
                >
                  {t.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {activeMeta && (
          <motion.p
            key={activeMeta.slug}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-2xl text-sm leading-relaxed text-fg-muted md:text-base"
          >
            <span className="font-display font-semibold text-fg">
              {activeMeta.tagline}{" "}
            </span>
            {activeMeta.description}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
