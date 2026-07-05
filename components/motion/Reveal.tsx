"use client";

import { useRef, type ReactNode, type HTMLAttributes } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

type RevealProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
  delay?: number;
  duration?: number;
  once?: boolean;
};

/**
 * Reveal — content slides up from behind an overflow:hidden mask.
 * The visibility trigger is on the OUTER (clip) div, not the inner (translated)
 * div — the inner one starts off-screen below its parent and would never enter
 * the viewport on its own.
 */
export function Reveal({
  delay = 0,
  duration = 1,
  once = true,
  children,
  className,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { once, amount: "some" });

  if (reduce) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={`overflow-hidden ${className ?? ""}`}
      {...props}
    >
      <motion.div
        initial={{ y: "110%", filter: "blur(6px)" }}
        animate={inView ? { y: 0, filter: "blur(0px)" } : { y: "110%", filter: "blur(6px)" }}
        transition={{
          duration,
          delay,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
