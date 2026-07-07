"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";
import { openGallery } from "@/components/vehicle/gallery/Lightbox";

/**
 * Hero image stage — a notched carousel with a REC telemetry tag and a thumb
 * strip. Clicking the frame opens the shared immersive Lightbox (zoom /
 * inspect) at the current image; the inline carousel is for quick browsing.
 */
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
  const reduce = useReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const next = useCallback(() => setActive((i) => (i + 1) % images.length), [images.length]);
  const prev = useCallback(() => setActive((i) => (i - 1 + images.length) % images.length), [images.length]);

  // Keep the neighbours decoded so an arrow press paints instantly — the
  // "slow" feel was never the animation alone, it was the next frame still
  // downloading when it started to fade in.
  useEffect(() => {
    if (images.length < 2) return;
    [1, -1, 2].forEach((d) => {
      const img = new window.Image();
      img.src = images[(active + d + images.length) % images.length];
    });
  }, [active, images]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    swiped.current = false;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length < 2) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 44) {
      swiped.current = true;
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  const counter = `${String(active + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`;

  return (
    <div>
      {/* Stage */}
      <div
        className="ah-zoom vd-cut group relative aspect-[4/3] cursor-zoom-in overflow-hidden border border-line-strong bg-black"
        onClick={() => {
          if (!swiped.current) openGallery(active);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Fast crossfade — the incoming frame fades OVER the outgoing one
            (no mode="wait" dead time), settling from a hair of scale. Quick
            enough to feel instant, soft enough to stay premium. */}
        <AnimatePresence initial={false}>
          <motion.div
            key={active}
            initial={reduce ? false : { opacity: 0, scale: 1.015 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeOut" } }}
            transition={{ duration: 0.22, ease: ease.entrance }}
            className="absolute inset-0"
          >
            <Image
              src={images[active]}
              alt={alt}
              fill
              priority
              sizes="(min-width:980px) 50vw, 100vw"
              className="object-cover object-[center_44%]"
            />
          </motion.div>
        </AnimatePresence>
        <span className="absolute left-4 top-3.5 z-10 font-mega text-[10.5px] tracking-[0.16em] text-accent">{recLabel}</span>
        <span className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2 rounded-[2px] bg-black/50 px-3 py-1.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-md">
          <Expand className="size-3.5 opacity-70" />
          {counter}
        </span>
        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Предишна"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
              className="absolute left-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:border-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Следваща"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
              className="absolute right-3 top-1/2 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-300 hover:border-white group-hover:opacity-100 [@media(hover:none)]:opacity-100"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        )}
      </div>

      {/* Thumbs */}
      {images.length > 1 && (
        <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto overscroll-x-contain pb-0.5">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Снимка ${i + 1}`}
              className={cn(
                "relative h-[64px] w-24 shrink-0 overflow-hidden rounded-[2px] bg-elevated transition-all duration-300 md:h-[68px] md:w-28",
                i === active ? "opacity-100 ring-2 ring-accent" : "opacity-45 hover:opacity-100",
              )}
            >
              <Image src={img} alt="" fill sizes="112px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
