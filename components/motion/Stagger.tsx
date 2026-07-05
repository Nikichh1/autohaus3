"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { staggerContainer, staggerItem, viewportOnce } from "@/lib/motion";

type StaggerProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
  stagger?: number;
  delayChildren?: number;
};

/** Wrap a group; direct <StaggerItem> children reveal one after another. */
export function Stagger({
  children,
  stagger = 0.07,
  delayChildren = 0,
  ...props
}: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as object)}>{children}</div>;
  return (
    <motion.div
      variants={staggerContainer(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type StaggerItemProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children: ReactNode;
};

export function StaggerItem({ children, ...props }: StaggerItemProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div {...(props as object)}>{children}</div>;
  return (
    <motion.div variants={staggerItem} {...props}>
      {children}
    </motion.div>
  );
}
