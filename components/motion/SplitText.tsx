"use client";

import { motion, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Heading reveal — splits text into words inside overflow-clipped spans and
 * slides each up into view, staggered, when the heading scrolls into view.
 * Use `\n` to force line breaks. Inherits font/size from the parent heading.
 * No-op under reduced motion.
 */
export function SplitText({
  text,
  delay = 0,
  stagger = 0.055,
  once = true,
}: {
  text: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const lines = text.split("\n");

  if (reduce) {
    return (
      <>
        {lines.map((line, i) => (
          <span key={i} className="block">{line}</span>
        ))}
      </>
    );
  }

  let idx = 0;
  return (
    <>
      {lines.map((line, li) => (
        <span key={li} className="block">
          {line.split(" ").map((word, wi) => {
            const d = delay + idx++ * stagger;
            return (
              <span key={wi} className="vd-word mr-[0.22em]">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  whileInView={{ y: 0 }}
                  viewport={{ once, amount: 0.4 }}
                  transition={{ duration: 0.8, delay: d, ease: EASE }}
                >
                  {word}
                </motion.span>
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}
