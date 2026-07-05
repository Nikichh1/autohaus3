"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionStyle } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Scroll-driven parallax. As the element travels through the viewport its content
 * translates by ±`distance` px (GPU transform only → cheap, 60fps). Positive
 * `distance` moves slower than scroll (recedes); negative moves faster (leads).
 * No spring — kept tight to avoid lag. No-op under reduced motion.
 */
export function Parallax({
  children,
  className,
  distance = 60,
  axis = "y",
  opacity = false,
}: {
  children: ReactNode;
  className?: string;
  distance?: number;
  axis?: "x" | "y";
  /** Also fade in/out at the travel extremes for added depth. */
  opacity?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const move = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const fade = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.4, 1, 1, 0.4]);

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const style: MotionStyle =
    axis === "y" ? { y: move } : { x: move };
  if (opacity) style.opacity = fade;

  return (
    <motion.div ref={ref} style={style} className={cn("will-change-transform", className)}>
      {children}
    </motion.div>
  );
}
