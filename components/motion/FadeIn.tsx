"use client";

import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

type FadeInProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  once?: boolean;
};

export function FadeIn({
  delay = 0,
  duration = 0.8,
  y = 24,
  once = true,
  children,
  ...props
}: FadeInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      // Crisp blur-rise — content lifts and resolves from a soft blur to sharp.
      // Deliberately tight (no scale push-in): refined, a touch sharper, not floaty.
      initial={reduce ? false : { opacity: 0, y, filter: "blur(10px)" }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once, amount: "some" }}
      transition={{
        duration,
        delay,
        ease: [0.25, 1, 0.5, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
