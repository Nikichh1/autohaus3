"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Direction = "up" | "down" | "left" | "right";

type MaskRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** kept for API compatibility; reveal is a uniform scale-settle */
  direction?: Direction;
  /** scale the content settles from (default 1.08 → 1.0) */
  scaleFrom?: number;
  once?: boolean;
};

/**
 * Image reveal: content settles into its frame from a slight scale-up while
 * fading in, clipped by the rounded `overflow-hidden` frame. Uses the same
 * `whileInView` mechanism as FadeIn (reliable) — animating `clip-path` via
 * whileInView proved flaky in framer-motion 12.x, so we scale instead.
 */
export function MaskReveal({
  children,
  className,
  delay = 0,
  scaleFrom = 1.08,
  once = true,
}: MaskRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn("relative overflow-hidden", className)}>{children}</div>
    );
  }

  return (
    <motion.div
      className={cn("relative overflow-hidden", className)}
      initial={{ opacity: 0, scale: scaleFrom }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once, amount: "some" }}
      transition={{ duration: 1.1, delay, ease: ease.entrance }}
    >
      {children}
    </motion.div>
  );
}
