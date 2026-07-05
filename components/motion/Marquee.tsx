"use client";

import { cn } from "@/lib/utils";

/**
 * Seamless oversized marquee. The track is duplicated and translated -50% so the
 * loop is gapless; pure CSS transform → cheap and 60fps. Pauses on hover, stops
 * under reduced motion. Use for editorial brand/model bands between sections.
 */
export function Marquee({
  text,
  className,
  durationSec = 38,
  reverse = false,
  separator = "—",
}: {
  text: string;
  className?: string;
  durationSec?: number;
  reverse?: boolean;
  separator?: string;
}) {
  const unit = (
    <span className="inline-flex items-center">
      <span>{text}</span>
      <span className="mx-8 opacity-30 md:mx-14">{separator}</span>
    </span>
  );

  return (
    <div className={cn("vd-marquee overflow-hidden", className)} aria-hidden>
      <div
        className={cn("vd-marquee-track", reverse && "reverse")}
        style={{ "--vd-marquee-dur": `${durationSec}s` } as React.CSSProperties}
      >
        {/* two identical halves → -50% translate loops seamlessly */}
        <span className="inline-flex shrink-0">{unit}{unit}{unit}{unit}</span>
        <span className="inline-flex shrink-0">{unit}{unit}{unit}{unit}</span>
      </div>
    </div>
  );
}
