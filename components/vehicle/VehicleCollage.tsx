"use client";

import { Expand } from "lucide-react";
import { Parallax } from "@/components/motion/Parallax";
import { BlurImage } from "@/components/motion/BlurImage";
import { openGallery } from "@/components/vehicle/gallery/Lightbox";

const ASPECTS = ["aspect-[4/5]", "aspect-[16/11]", "aspect-[3/4]", "aspect-[4/3]", "aspect-[4/5]", "aspect-[3/4]"];
const SPEEDS = [30, 46, 24, 40, 28, 44];

/**
 * Editorial parallax collage — three masonry columns where each frame drifts at
 * its own scroll speed. Every frame opens the shared immersive Lightbox at its
 * index (zoom + inspect); a hover cue signals it. Cream section.
 */
export function VehicleCollage({ images, alt }: { images: string[]; alt: string }) {
  // Round-robin the photos into up to three staggered columns (fewer if sparse).
  const colCount = Math.min(3, Math.max(1, images.length));
  const cols: string[][] = Array.from({ length: colCount }, () => []);
  images.forEach((src, i) => cols[i % colCount].push(src));

  let n = 0;
  const figure = (src: string, globalIndex: number) => {
    const aspect = ASPECTS[globalIndex % ASPECTS.length];
    const speed = SPEEDS[globalIndex % SPEEDS.length];
    return (
      <button
        key={globalIndex}
        type="button"
        onClick={() => openGallery(globalIndex)}
        aria-label={`Отвори снимка ${globalIndex + 1}`}
        className={`group vd-cut relative block w-full cursor-zoom-in overflow-hidden ${aspect} shadow-[0_30px_70px_-44px_rgba(20,20,24,0.5)]`}
      >
        <Parallax distance={speed} className="absolute inset-[-20%]">
          <BlurImage src={src} alt={`${alt} — ${globalIndex + 1}`} fill sizes="(min-width:760px) 33vw, 100vw" className="object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]" />
        </Parallax>
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/15" />
        <span aria-hidden className="pointer-events-none absolute right-3 top-3 z-10 flex size-9 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:opacity-100">
          <Expand className="size-4" />
        </span>
        <span className="absolute bottom-3 left-3.5 z-10 font-mega text-[10px] tracking-[0.14em] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
          {String(globalIndex + 1).padStart(2, "0")} · AutoHaus
        </span>
      </button>
    );
  };

  const gridCls = colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <>
      {/* ── Phones: a swipeable film strip — one frame at a time with the next
          peeking in. Tap a frame to open it full-screen for inspection. */}
      <div className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-6 pb-2 sm:hidden">
        {images.map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => openGallery(i)}
            aria-label={`Отвори снимка ${i + 1}`}
            className="vd-cut relative m-0 block aspect-[4/3] w-[80vw] shrink-0 snap-center overflow-hidden bg-elevated shadow-[0_24px_50px_-34px_rgba(20,20,24,0.5)]"
          >
            <BlurImage src={src} alt={`${alt} — ${i + 1}`} fill sizes="80vw" className="object-cover" />
            <span aria-hidden className="pointer-events-none absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md">
              <Expand className="size-3.5" />
            </span>
            <span className="absolute bottom-3 left-3.5 z-10 font-mega text-[10px] tracking-[0.14em] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
              {String(i + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")} · AutoHaus
            </span>
          </button>
        ))}
      </div>

      {/* ── sm+ keeps the editorial parallax masonry. */}
      <div className={`hidden gap-4 sm:grid md:gap-6 ${gridCls}`}>
        {cols.map((col, ci) => (
          <div key={ci} className={`flex flex-col gap-4 md:gap-6 ${ci === 1 ? "md:mt-16" : ci === 2 ? "md:mt-7" : ""}`}>
            {col.map((src) => figure(src, n++))}
          </div>
        ))}
      </div>
    </>
  );
}
