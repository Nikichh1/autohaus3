"use client";

import { useState } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";

type MapEmbedProps = {
  /** Exact latitude of the AutoHaus showroom. */
  lat: number;
  /** Exact longitude of the AutoHaus showroom. */
  lng: number;
  /** Human-readable label shown on the facade and used as the pin caption. */
  label: string;
  title: string;
  /** Zoom level for the embedded map. Higher = closer. */
  zoom?: number;
};

/**
 * Map facade — renders a lightweight placeholder and only loads the heavy
 * Google Maps iframe on user intent. Keeps the page's initial load fast.
 *
 * The pin is placed on exact coordinates (not an address string), so it always
 * lands on the building regardless of how Google geocodes the street. Uses the
 * keyless `maps.google.com/maps?q=…&output=embed` endpoint — no API key, no
 * build-time config, nothing for Vercel to trip over.
 */
export function MapEmbed({ lat, lng, label, title, zoom = 16 }: MapEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  const embedSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
  const directionsHref = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  if (loaded) {
    return (
      <div className="relative h-full w-full">
        <iframe
          title={title}
          src={embedSrc}
          width="100%"
          height="100%"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="h-full w-full grayscale"
          style={{ border: 0 }}
        />
        <a
          href={directionsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full border border-line-strong bg-base/90 px-5 py-2.5 text-sm font-medium text-fg backdrop-blur transition-colors hover:border-accent hover:text-accent"
        >
          Упътване
          <ArrowUpRight className="size-4" />
        </a>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className="group relative flex h-full w-full items-center justify-center overflow-hidden bg-surface"
    >
      {/* Decorative grid backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-fg) 1px, transparent 1px), linear-gradient(90deg, var(--color-fg) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="relative flex flex-col items-center gap-4 text-center">
        <span className="flex size-14 items-center justify-center rounded-full border border-line-strong text-accent transition-colors group-hover:border-accent">
          <MapPin className="size-6" />
        </span>
        <span className="max-w-xs font-display text-lg font-semibold text-fg">
          {label}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2 text-sm text-fg transition-colors group-hover:border-accent group-hover:text-accent">
          Зареди картата
        </span>
      </div>
    </button>
  );
}
