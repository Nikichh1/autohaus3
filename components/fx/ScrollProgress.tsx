"use client";

import { motion, useScroll, useSpring } from "framer-motion";

/**
 * Hairline scroll-progress bar pinned to the very top of the viewport, above the
 * nav. Driven by window scroll (Lenis updates native scroll, so useScroll works).
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-accent"
    />
  );
}
