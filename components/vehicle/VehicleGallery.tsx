"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { ease } from "@/lib/motion";

type VehicleGalleryProps = {
  images: string[];
  alt: string;
  /** `sizes` for the main (LCP) image. Defaults to full-bleed; pass the real
   *  rendered width when the stage sits in a column so phones fetch fewer bytes. */
  sizes?: string;
  /** Horsepower — when set, renders an accent "X К.С." badge over the stage. */
  power?: number;
};

export function VehicleGallery({ images, alt, sizes = "100vw", power }: VehicleGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const next = useCallback(
    () => setActive((i) => (i + 1) % images.length),
    [images.length],
  );
  const prev = useCallback(
    () => setActive((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );

  // Touch swipe — the expected gesture on phones for paging through photos.
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

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [lightbox, next, prev]);

  return (
    <div>
      {/* Main stage — Koenigsegg fade-up-from-dark + settle */}
      <motion.div
        initial={{ opacity: 0, scale: 1.08 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: ease.entrance }}
        className="vignette edge-light group relative aspect-[16/10] w-full cursor-zoom-in overflow-hidden rounded-[1.25rem] border border-line-strong bg-black shadow-cinema md:aspect-[16/9]"
        onClick={() => {
          if (!swiped.current) setLightbox(true);
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: ease.entrance }}
            className="absolute inset-0"
          >
            <Image
              src={images[active]}
              alt={alt}
              fill
              priority
              sizes={sizes}
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>

        {/* Power badge — accent, top-left */}
        {power ? (
          <div
            className="absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-white"
            style={{ background: "var(--va, var(--color-accent))", boxShadow: "0 6px 18px -4px rgb(var(--va-glow, 0 0 0) / 0.7)" }}
          >
            <span className="size-1.5 rounded-full bg-white" />
            {power} К.С.
          </div>
        ) : null}

        {/* Expand hint */}
        <div className="absolute right-5 top-5 z-10 flex size-10 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover:opacity-100">
          <Expand className="size-4" />
        </div>

        {/* Counter */}
        <div className="absolute bottom-5 right-5 z-10 rounded-full bg-black/50 px-3 py-1 text-xs tabular-nums text-white backdrop-blur-md">
          {active + 1} / {images.length}
        </div>

        {images.length > 1 && (
          <>
            <GalleryArrow
              dir="left"
              onClick={(e) => {
                e.stopPropagation();
                prev();
              }}
            />
            <GalleryArrow
              dir="right"
              onClick={(e) => {
                e.stopPropagation();
                next();
              }}
            />
          </>
        )}
      </motion.div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="no-scrollbar mt-4 flex gap-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Снимка ${i + 1}`}
              className={cn(
                "relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-elevated transition-all duration-300 md:w-32",
                i === active
                  ? "ring-1 ring-accent ring-offset-2 ring-offset-base"
                  : "opacity-45 hover:opacity-100",
              )}
            >
              <Image
                src={img}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/95 backdrop-blur-sm"
            data-lenis-prevent
            onClick={() => {
              if (!swiped.current) setLightbox(false);
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <button
              type="button"
              aria-label="Затвори"
              onClick={() => setLightbox(false)}
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
              <Image
                src={images[active]}
                alt={alt}
                fill
                sizes="92vw"
                className="object-contain"
              />
            </motion.div>

            {images.length > 1 && (
              <>
                <GalleryArrow
                  dir="left"
                  lightbox
                  onClick={(e) => {
                    e.stopPropagation();
                    prev();
                  }}
                />
                <GalleryArrow
                  dir="right"
                  lightbox
                  onClick={(e) => {
                    e.stopPropagation();
                    next();
                  }}
                />
              </>
            )}

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm tabular-nums text-white/70">
              {active + 1} / {images.length}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function GalleryArrow({
  dir,
  onClick,
  lightbox,
}: {
  dir: "left" | "right";
  onClick: (e: React.MouseEvent) => void;
  lightbox?: boolean;
}) {
  const Icon = dir === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={dir === "left" ? "Предишна" : "Следваща"}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:border-white hover:bg-black/60",
        dir === "left" ? "left-5" : "right-5",
        // Hidden until hover on desktop; always visible on touch (no hover state).
        !lightbox && "opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100",
      )}
    >
      <Icon className="size-5" />
    </button>
  );
}
