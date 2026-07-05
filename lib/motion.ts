import type { Variants } from "framer-motion";

/**
 * Standardized motion language for the whole site.
 * Entrances use a strong ease-out; movements use a symmetric ease-in-out.
 * Durations: micro-interactions, content reveals, cinematic reveals.
 */
export const ease = {
  /** Entrances — strong, weighty ease-out (Koenigsegg/Rivian feel) */
  entrance: [0.16, 1, 0.3, 1] as const,
  /** Movements / parallax — symmetric ease-in-out */
  movement: [0.7, 0, 0.3, 1] as const,
  /** Gentle ease-out for micro-interactions */
  out: [0.25, 1, 0.5, 1] as const,
};

export const duration = {
  micro: 0.35,
  content: 0.7,
  cinematic: 1.2,
};

/** Viewport config for whileInView one-shot reveals */
export const viewportOnce = { once: true, amount: "some" } as const;

/** Reusable variants for staggered groups */
export const staggerContainer = (stagger = 0.07, delayChildren = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.content, ease: ease.entrance },
  },
};
