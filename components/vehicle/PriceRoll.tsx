"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn, formatPriceEUR } from "@/lib/utils";

/**
 * Premium price reveal — the figure rolls into place once, on load: each digit
 * column spins up from zero and settles with a heavy, decelerating ease, a hair
 * later left-to-right so the number "locks in" like a machined mechanism. No
 * loop, no flash — refined, and crisp/readable the moment it lands.
 *
 * Reduced motion renders the final figure instantly.
 */

const EASE = [0.16, 1, 0.3, 1] as const;
const SPINS = 2; // full 0–9 cycles before a digit settles

export function PriceRoll({
  value,
  className,
  requestLabel = "При запитване",
}: {
  value: number;
  className?: string;
  requestLabel?: string;
}) {
  const reduce = useReducedMotion();
  const formatted = value > 0 ? formatPriceEUR(value) : requestLabel;

  if (value <= 0) {
    return <span className={className}>{requestLabel}</span>;
  }

  const chars = Array.from(formatted);
  const digitCount = chars.filter((c) => /\d/.test(c)).length;
  let order = -1;

  return (
    <span className={cn("inline-flex items-baseline tabular-nums", className)} aria-label={formatted}>
      {chars.map((ch, i) => {
        if (!/\d/.test(ch)) {
          return (
            <span key={i} aria-hidden className="whitespace-pre">
              {ch}
            </span>
          );
        }
        order += 1;
        return (
          <RollDigit key={i} target={Number(ch)} order={order} total={digitCount} reduce={!!reduce} />
        );
      })}
    </span>
  );
}

function RollDigit({
  target,
  order,
  total,
  reduce,
}: {
  target: number;
  order: number;
  total: number;
  reduce: boolean;
}) {
  if (reduce) {
    return <span aria-hidden>{target}</span>;
  }

  const travel = SPINS * 10 + target; // strip index that lands on the target
  const strip = Array.from({ length: travel + 1 }, (_, k) => k % 10);
  // Left digits carry a touch more travel + settle a beat later — the figure
  // resolves from the units up, reading as a mechanism locking into place.
  const duration = 1.35 + order * 0.11;
  const delay = 0.12 + (total - 1 - order) * 0.05;

  return (
    <span className="relative inline-block overflow-hidden" style={{ height: "1em" }}>
      {/* width + baseline sizer */}
      <span className="invisible">0</span>
      <motion.span
        aria-hidden
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        initial={{ y: "0em" }}
        animate={{ y: `-${travel}em` }}
        transition={{ duration, delay, ease: EASE }}
      >
        {strip.map((d, k) => (
          <span key={k} className="flex items-center justify-center" style={{ height: "1em", lineHeight: 1 }}>
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}
