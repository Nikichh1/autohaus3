"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  /** max tilt in degrees (kept small — premium = restrained) */
  max?: number;
};

/**
 * Very subtle 3D hover physics. Tilts toward the pointer with a spring, then
 * settles flat on leave. "Expensive engineering precision", not a party trick —
 * keep `max` ≤ 6.
 *
 * The spring machinery lives in an inner component that only mounts on a fine
 * pointer (desktop). Touch devices can never hover to tilt, so on a 82-card
 * listing they would otherwise initialise 82 idle spring rigs for nothing —
 * pure hydration/memory cost on the phones we're optimising for. At rest the
 * card is visually identical either way (transform is identity until hover).
 */
export function TiltCard({ children, className, max = 5 }: TiltCardProps) {
  const reduce = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(window.matchMedia("(pointer: fine)").matches);
  }, []);

  if (reduce || !enabled) return <div className={className}>{children}</div>;
  return (
    <TiltInner className={className} max={max}>
      {children}
    </TiltInner>
  );
}

function TiltInner({ children, className, max = 5 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, { stiffness: 160, damping: 18, mass: 0.4 });
  const sy = useSpring(py, { stiffness: 160, damping: 18, mass: 0.4 });
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);

  return (
    <motion.div
      ref={ref}
      onPointerMove={(e) => {
        if (e.pointerType === "touch") return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
      style={{ rotateX, rotateY, transformPerspective: 1100 }}
      className={cn("tilt-3d [transform-style:preserve-3d]", className)}
    >
      {children}
    </motion.div>
  );
}
