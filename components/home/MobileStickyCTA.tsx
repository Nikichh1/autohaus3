"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Phone, ArrowRight } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { contactInfo } from "@/lib/nav";

/**
 * Mobile sticky CTA — the thumb-reach conversion rail. Surfaces only after the
 * cinematic opening (intro + hero) has played, retires before the finale so it
 * never doubles the closing CTAs, and stays out of the film the rest of the
 * time: one glass pill — "Колекцията" plus a direct call button. Phones and
 * tablets only; desktop keeps the in-scene CTAs.
 */
export function MobileStickyCTA() {
  const reduce = useReducedMotion();
  const [show, setShow] = useState(false);

  useEffect(() => {
    let ticking = false;
    const update = () => {
      ticking = false;
      const vh = window.innerHeight;
      const y = window.scrollY;
      const remaining = document.documentElement.scrollHeight - (y + vh);
      // Past the opening film + hero stage; retire BEFORE the finale enters —
      // it carries the same CTA, and the pill doubling it reads as clutter.
      setShow(y > vh * 1.4 && remaining > vh * 2.6);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: 84, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { y: 84, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed inset-x-4 z-40 lg:hidden"
          style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <div className="glass-pane edge-light relative mx-auto flex max-w-sm items-center gap-2 rounded-full p-2 backdrop-blur-xl backdrop-saturate-150">
            <Link
              href="/avtomobili"
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-fg font-display text-sm font-bold tracking-tight text-ink transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Разгледай колекцията
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
              aria-label={`Обадете се: ${contactInfo.phone}`}
              className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line-strong text-fg transition-colors active:bg-white/10"
            >
              <Phone className="size-[1.15rem]" strokeWidth={1.7} />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
