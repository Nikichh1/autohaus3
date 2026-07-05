"use client";

import { useRef, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Subtle scroll-driven 3D depth for editorial imagery: the element tilts on X
 * (and lifts/scales a touch) as it travels through the viewport, settling flat
 * at centre. Cinematic without being a gimmick. No-op under reduced motion.
 */
export function ScrollTilt({
  children,
  className,
  tilt = 6,
}: {
  children: ReactNode;
  className?: string;
  tilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const rotateX = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduce ? [0, 0, 0] : [tilt, 0, -tilt],
  );
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["5%", "-5%"]);
  const scale = useTransform(
    scrollYProgress,
    [0, 0.5, 1],
    reduce ? [1, 1, 1] : [1.03, 1.06, 1.03],
  );

  return (
    <div ref={ref} className={cn("[perspective:1400px]", className)}>
      <motion.div
        style={{ rotateX, y, scale }}
        className="h-full w-full [transform-style:preserve-3d]"
      >
        {children}
      </motion.div>
    </div>
  );
}
