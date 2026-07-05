"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { BlurImage } from "@/components/motion/BlurImage";

/** Per-index bento spans → a dynamic, non-uniform mosaic with depth. */
function tileClass(i: number, total: number): string {
  if (i === 0) return "col-span-2 md:col-span-7 md:row-span-2 aspect-[16/10] md:aspect-auto";
  const pattern = [
    "md:col-span-5 aspect-[4/3] md:aspect-[16/11]",
    "md:col-span-5 aspect-[4/3]",
    "md:col-span-4 aspect-[4/3]",
    "md:col-span-4 aspect-[4/3]",
    "md:col-span-4 aspect-[4/3]",
  ];
  const cls = pattern[(i - 1) % pattern.length];
  // a lone trailing tile spans wider so the grid never looks orphaned
  if (i === total - 1 && (total - 1) % 3 === 1) return "md:col-span-12 aspect-[16/7] " + cls.replace(/md:col-span-\d+/, "");
  return "col-span-1 " + cls;
}

export function VehicleGalleryMosaic({ images, alt }: { images: string[]; alt: string }) {
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

  function openAt(i: number) { setActive(i); setOpen(true); }

  return (
    <>
      <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-3 md:grid-cols-12 md:gap-4">
        {images.map((src, i) => (
          <motion.button
            key={i}
            type="button"
            onClick={() => openAt(i)}
            aria-label={`Снимка ${i + 1}`}
            initial={reduce ? false : { opacity: 0, y: 26 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, delay: Math.min(i, 4) * 0.06, ease: ease.entrance }}
            className={cn(
              "group/tile vd-card vd-card-hover relative overflow-hidden rounded-[1.25rem] p-0",
              tileClass(i, images.length),
            )}
          >
            <BlurImage
              src={src}
              alt={`${alt} — снимка ${i + 1}`}
              fill
              sizes={i === 0 ? "(min-width:768px) 60vw, 100vw" : "(min-width:768px) 33vw, 50vw"}
              className="object-cover transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/tile:scale-[1.05]"
            />
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/tile:opacity-100" />
            <span aria-hidden className="absolute bottom-3 right-3 flex size-9 translate-y-2 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white opacity-0 backdrop-blur-md transition-all duration-500 group-hover/tile:translate-y-0 group-hover/tile:opacity-100">
              <Plus className="size-4" />
            </span>
            {i === 0 && (
              <span className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-[11px] font-medium tabular-nums text-white backdrop-blur-md">
                {images.length} снимки
              </span>
            )}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            data-lenis-prevent
            onClick={() => { if (!swiped.current) setOpen(false); }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              aria-label="Затвори"
              onClick={() => setOpen(false)}
              className="absolute right-5 top-5 z-10 flex size-12 items-center justify-center rounded-full border border-white/25 bg-black/30 text-white backdrop-blur-md transition-colors hover:border-white"
            >
              <X className="size-5" />
            </button>

            <motion.div
              key={active}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: ease.entrance }}
              className="relative h-[80vh] w-[92vw] max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={images[active]} alt={alt} fill sizes="92vw" className="object-contain" />
            </motion.div>

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Предишна"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  className="absolute left-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-white"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label="Следваща"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  className="absolute right-5 top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-white"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tabular-nums text-white/70">
              {active + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
