"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useScroll, useTransform, useReducedMotion, type MotionStyle } from "framer-motion";
import { cn } from "@/lib/utils";

type ParallaxProps = {
  children: ReactNode;
  className?: string;
  distance?: number;
  axis?: "x" | "y";
  /** Also fade in/out at the travel extremes for added depth. */
  opacity?: boolean;
};

/**
 * Scroll-driven parallax. As the element travels through the viewport its content
 * translates by ±`distance` px (GPU transform only → cheap, 60fps). Positive
 * `distance` moves slower than scroll (recedes); negative moves faster (leads).
 *
 * The scroll subscription + `will-change` compositor layer live in an inner
 * component that ONLY mounts on a fine pointer (desktop). Touch devices render
 * the plain child — no listener, no extra layer — so scrolling stays fluid on
 * older phones. Every parallax target on the product page sits below the fold,
 * so switching to static at mount is invisible (they're never on screen mid-
 * transition). Desktop is unchanged: it renders the motion path from the start.
 */
export function Parallax({ children, className, distance = 60, axis = "y", opacity = false }: ParallaxProps) {
  const reduce = useReducedMotion();
  // Assume the motion path (desktop-identical) for SSR + first paint; drop to
  // static after mount on touch devices.
  const [motionOn, setMotionOn] = useState(true);
  useEffect(() => {
    // Mount-time capability check — mirrors the site's other isMobile gates.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOn(window.matchMedia("(pointer: fine)").matches);
  }, []);

  if (reduce || !motionOn) {
    return <div className={className}>{children}</div>;
  }
  return (
    <ParallaxMotion className={className} distance={distance} axis={axis} opacity={opacity}>
      {children}
    </ParallaxMotion>
  );
}

function ParallaxMotion({ children, className, distance = 60, axis = "y", opacity = false }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const move = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const fade = useTransform(scrollYProgress, [0, 0.18, 0.82, 1], [0.4, 1, 1, 0.4]);

  const style: MotionStyle = axis === "y" ? { y: move } : { x: move };
  if (opacity) style.opacity = fade;

  return (
    <motion.div ref={ref} style={style} className={cn("will-change-transform", className)}>
      {children}
    </motion.div>
  );
}
