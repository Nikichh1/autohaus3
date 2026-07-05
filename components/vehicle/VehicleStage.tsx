"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

/** Hero image stage — notched main frame + REC telemetry tag + thumb strip + lightbox. */
export function VehicleStage({
  images,
  alt,
  recLabel,
}: {
  images: string[];
  alt: string;
  recLabel: string;
}) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; swiped.current = false; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 44) { swiped.current = true; if (dx < 0) next(); else prev(); }
    touchStartX.current = null;
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, next, prev]);

  const counter = `${String(active + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;

  return (
    <div>
      {/* Stage */}
      <div
        className="ah-zoom vd-cut group relative aspect-[4/3] cursor-zoom-in overflow-hidden border border-line-strong bg-black"
        onClick={() => { if (!swiped.current) setOpen(true); }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: ease.entrance }}
            className="absolute inset-0"
          >
            <Image src={images[active]} alt={alt} fill priority sizes="(min-width:980px) 50vw, 100vw" className="object-cover object-[center_44%]" />
          </motion.div>
        </AnimatePresence>
        <span className="absolute left-4 top-3.5 z-10 font-mega text-[10.5px] tracking-[0.16em] text-accent">{recLabel}</span>
        <span className="absolute bottom-3.5 right-3.5 z-10 rounded-[2px] bg-black/50 px-3 py-1.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">{counter}</span>
        {images.length > 1 && (
          <>
            <button type="button" aria-label="Предишна" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:border-white group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <ChevronLeft className="size-4" />
            </button>
            <button type="button" aria-label="Следваща" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:border-white group-hover:opacity-100 [@media(hover:none)]:opacity-100">
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbs */}
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-0.5">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Снимка ${i + 1}`}
              className={cn(
                "relative h-[68px] w-28 shrink-0 overflow-hidden rounded-[2px] bg-elevated transition-all duration-300",
                i === active ? "opacity-100 ring-2 ring-accent" : "opacity-45 hover:opacity-100",
              )}
            >
              <Image src={img} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#06070a]/97 backdrop-blur-sm"
            data-lenis-prevent
            onClick={() => { if (!swiped.current) setOpen(false); }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button type="button" aria-label="Затвори" onClick={() => setOpen(false)} className="absolute right-5 top-5 z-10 flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white">
              <X className="size-5" />
            </button>
            <motion.div key={active} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, ease: ease.entrance }} className="relative h-[80vh] w-[92vw] max-w-6xl" onClick={(e) => e.stopPropagation()}>
              <Image src={images[active]} alt={alt} fill sizes="92vw" className="object-contain" />
            </motion.div>
            {images.length > 1 && (
              <>
                <button type="button" aria-label="Предишна" onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-white">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" aria-label="Следваща" onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-white">
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tabular-nums text-white/70">{counter}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
