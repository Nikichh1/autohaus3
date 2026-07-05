"use client";

import { useRef } from "react";
import {
  motion,
  useScroll,
  useVelocity,
  useSpring,
  useTransform,
  useMotionValue,
  useAnimationFrame,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

/** Wrap a value into [min, max) — keeps the marquee track looping seamlessly. */
function wrap(min: number, max: number, v: number): number {
  const range = max - min;
  return ((((v - min) % range) + range) % range) + min;
}

/**
 * Scroll-velocity marquee. The track drifts continuously at `baseVelocity` and
 * accelerates / reverses with scroll speed (framer's classic velocity parallax).
 * Falls back to a plain CSS marquee under reduced motion.
 */
export function VelocityMarquee({
  text,
  baseVelocity = -2.5,
  className,
  separator = "—",
}: {
  text: string;
  baseVelocity?: number;
  className?: string;
  separator?: string;
}) {
  const reduce = useReducedMotion();
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smooth = useSpring(scrollVelocity, { damping: 50, stiffness: 380 });
  const velocityFactor = useTransform(smooth, [0, 1000], [0, 4], { clamp: false });
  // 6 copies → wrap across one-sixth of the track width.
  const x = useTransform(baseX, (v) => `${wrap(-16.6667, 0, v)}%`);
  const dir = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    let moveBy = dir.current * baseVelocity * (delta / 1000);
    const vf = velocityFactor.get();
    if (vf < 0) dir.current = -1;
    else if (vf > 0) dir.current = 1;
    moveBy += dir.current * moveBy * Math.abs(vf);
    baseX.set(baseX.get() + moveBy);
  });

  const unit = (
    <span className="inline-flex items-center">
      <span>{text}</span>
      <span className="mx-8 opacity-30 md:mx-14">{separator}</span>
    </span>
  );

  if (reduce) {
    return (
      <div className={cn("overflow-hidden whitespace-nowrap", className)} aria-hidden>
        {unit}{unit}{unit}
      </div>
    );
  }

  return (
    <div className={cn("overflow-hidden", className)} aria-hidden>
      <motion.div className="inline-flex flex-nowrap whitespace-nowrap will-change-transform" style={{ x }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="inline-flex shrink-0">{unit}</span>
        ))}
      </motion.div>
    </div>
  );
}
