"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * `SigLine` — the DRL light signature: a titanium light-bar that ignites across
 * the frame, the way a car greets you at dusk. The one abstract brand motif on
 * the site; the wordmark itself always stays the original AutoHaus logo.
 */
export function SigLine({
  className,
  glow = true,
}: {
  className?: string;
  glow?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <div className={cn("relative h-px w-full", className)} aria-hidden>
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(201,207,214,0.55) 32%, rgba(245,247,249,0.95) 50%, rgba(201,207,214,0.55) 68%, transparent)",
        }}
        initial={reduce ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.18 }}
        whileInView={{ opacity: 1, scaleX: 1 }}
        viewport={{ once: true, amount: "all" }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />
      {glow && (
        <div
          className="absolute inset-x-0 -top-2 h-5 blur-md"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 0%, rgba(201,207,214,0.4), transparent 70%)",
          }}
        />
      )}
    </div>
  );
}
