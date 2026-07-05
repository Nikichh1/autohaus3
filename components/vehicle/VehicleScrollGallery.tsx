"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { ease } from "@/lib/motion";
import { BlurImage } from "@/components/motion/BlurImage";

/**
 * Horizontal scroll gallery (landonorris-style). The section is taller than the
 * viewport; its inner rail is pinned (sticky) and the image strip translates left
 * as you scroll down — driven by scroll progress (GPU transform). Falls back to a
 * native horizontal swipe strip under reduced motion. Click any frame → lightbox.
 */
export function VehicleScrollGallery({ images, alt }: { images: string[]; alt: string }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [maxX, setMaxX] = useState(0);

  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);

  // Measure how far the rail must travel horizontally. The track sizes to its
  // content, so compare its full width against the viewport (the visible window).
  useEffect(() => {
    const measure = () => {
      const el = trackRef.current;
      if (!el) return;
      setMaxX(Math.max(0, el.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    // Re-measure after fonts/images settle.
    const t = setTimeout(measure, 400);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); clearTimeout(t); };
  }, [images.length]);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -maxX]);
  const progress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

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

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; swiped.current = false; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 44) { swiped.current = true; if (dx < 0) next(); else prev(); }
    touchStartX.current = null;
  };

  function frame(src: string, i: number) {
    return (
      <button
        key={i}
        type="button"
        onClick={() => { setActive(i); setOpen(true); }}
        aria-label={`Снимка ${i + 1}`}
        className="group/frame relative h-[58vh] w-[82vw] shrink-0 snap-center overflow-hidden rounded-[1.4rem] border border-white/10 bg-elevated shadow-cinema sm:h-[64vh] md:h-[70vh] md:w-[46vw] xl:w-[38vw]"
      >
        <BlurImage src={src} alt={`${alt} — снимка ${i + 1}`} fill sizes="(min-width:768px) 46vw, 82vw" className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/frame:scale-[1.04]" />
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/frame:opacity-100" />
        <span className="absolute left-5 top-5 font-mega text-2xl text-white/85 mix-blend-difference">{String(i + 1).padStart(2, "0")}</span>
        <span aria-hidden className="absolute bottom-5 right-5 flex size-10 translate-y-2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover/frame:translate-y-0 group-hover/frame:opacity-100">
          <Plus className="size-4" />
        </span>
      </button>
    );
  }

  return (
    <>
      {reduce ? (
        <div className="no-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 md:px-8 xl:px-12">
          {images.map((src, i) => frame(src, i))}
        </div>
      ) : (
        <div ref={sectionRef} style={{ height: `calc(100svh + ${maxX}px)` }} className="relative">
          <div className="sticky top-0 flex h-svh items-center overflow-hidden">
            <motion.div ref={trackRef} style={{ x }} className="flex gap-5 px-4 will-change-transform md:gap-7 md:px-8 xl:px-12">
              {images.map((src, i) => frame(src, i))}
            </motion.div>
          </div>
          {/* scroll progress rail */}
          <div className="pointer-events-none sticky bottom-8 left-0 mx-auto h-px w-[40vw] max-w-sm overflow-hidden bg-fg/15">
            <motion.div style={{ width: progress }} className="h-full bg-accent" />
          </div>
        </div>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
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
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tabular-nums text-white/70">{active + 1} / {images.length}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
