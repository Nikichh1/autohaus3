"use client";

import { Parallax } from "@/components/motion/Parallax";
import { BlurImage } from "@/components/motion/BlurImage";

const ASPECTS = ["aspect-[4/5]", "aspect-[16/11]", "aspect-[3/4]", "aspect-[4/3]", "aspect-[4/5]", "aspect-[3/4]"];
const SPEEDS = [30, 46, 24, 40, 28, 44];

/**
 * Editorial parallax collage — three masonry columns where each frame drifts at
 * its own scroll speed (notched corners, telemetry caption). Cream section.
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
      <figure key={globalIndex} className={`vd-cut relative m-0 overflow-hidden ${aspect} shadow-[0_30px_70px_-44px_rgba(20,20,24,0.5)]`}>
        <Parallax distance={speed} className="absolute inset-[-20%]">
          <BlurImage src={src} alt={`${alt} — ${globalIndex + 1}`} fill sizes="(min-width:760px) 33vw, 100vw" className="object-cover" />
        </Parallax>
        <figcaption className="absolute bottom-3 left-3.5 z-10 font-mega text-[10px] tracking-[0.14em] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
          {String(globalIndex + 1).padStart(2, "0")} · AutoHaus
        </figcaption>
      </figure>
    );
  };

  const gridCls = colCount === 1 ? "grid-cols-1" : colCount === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3";

  return (
    <div className={`grid gap-4 md:gap-6 ${gridCls}`}>
      {cols.map((col, ci) => (
        <div key={ci} className={`flex flex-col gap-4 md:gap-6 ${ci === 1 ? "md:mt-16" : ci === 2 ? "md:mt-7" : ""}`}>
          {col.map((src) => figure(src, n++))}
        </div>
      ))}
    </div>
  );
}
