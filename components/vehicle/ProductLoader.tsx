"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ease } from "@/lib/motion";

/**
 * Premium intro curtain — a brief count-up over a full-screen graphite field that
 * wipes up to reveal the page. Shows once per session per vehicle (sessionStorage),
 * and not at all under reduced motion. Pure transform/clip-path → no layout cost.
 */
export function ProductLoader({ slug, brand, model }: { slug: string; brand: string; model: string }) {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (reduce) return;
    let key = "";
    try {
      key = `vh-loaded:${slug}`;
      if (sessionStorage.getItem(key)) return;
    } catch {
      /* sessionStorage unavailable — still show once */
    }

    const dur = 900;
    let t0 = 0;
    let raf = 0;
    let to = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / dur);
      setCount(Math.round((1 - Math.pow(1 - p, 3)) * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        try { if (key) sessionStorage.setItem(key, "1"); } catch { /* ignore */ }
        to = window.setTimeout(() => setShow(false), 240);
      }
    };
    // Defer the first setState out of the synchronous effect body (one frame).
    raf = requestAnimationFrame(() => {
      setShow(true);
      document.documentElement.style.overflow = "hidden";
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(to);
      document.documentElement.style.overflow = "";
    };
  }, [slug, reduce]);

  return (
    <AnimatePresence onExitComplete={() => { document.documentElement.style.overflow = ""; }}>
      {show && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-base"
          initial={{ clipPath: "inset(0 0 0% 0)" }}
          exit={{ clipPath: "inset(0 0 100% 0)" }}
          transition={{ duration: 0.9, ease: ease.entrance }}
        >
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: ease.out }}
            className="flex flex-col items-center"
          >
            <span className="text-[11px] font-semibold uppercase tracking-[0.4em] text-accent">
              {brand}
            </span>
            <span className="mt-3 font-display text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
              {model}
            </span>
          </motion.div>

          {/* progress line */}
          <div className="relative mt-8 h-px w-48 overflow-hidden bg-black/10">
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{ width: `${count}%`, background: "linear-gradient(90deg,var(--va),var(--va-bright))" }}
            />
          </div>
          <span className="mt-4 font-display text-sm font-bold tabular-nums text-fg-subtle">
            {count.toString().padStart(3, "0")}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
