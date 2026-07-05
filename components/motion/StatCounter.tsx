"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "framer-motion";

type StatCounterProps = {
  to: number;
  duration?: number;
  /** Decimal places to format with — default 0 */
  decimals?: number;
  /** Suffix appended after the number (e.g. "+", "k", "%") */
  suffix?: string;
  className?: string;
};

export function StatCounter({
  to,
  duration = 2,
  decimals = 0,
  suffix = "",
  className,
}: StatCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: "some" });
  const reduce = useReducedMotion();
  const count = useMotionValue(reduce ? to : 0);
  const rounded = useTransform(count, (v) =>
    new Intl.NumberFormat("bg-BG", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(v),
  );

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(count, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, count, to, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
