"use client";

import { useState } from "react";
import { MapPin } from "lucide-react";

type MapEmbedProps = {
  query: string;
  title: string;
};

/**
 * Map facade — renders a lightweight placeholder and only loads the heavy
 * Google Maps iframe on user intent. Keeps the page's initial load fast.
 */
export function MapEmbed({ query, title }: MapEmbedProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=12&output=embed`}
        width="100%"
        height="100%"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="h-full w-full grayscale"
        style={{ border: 0 }}
      />
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
        <span className="font-display text-lg font-semibold text-fg">
          {query}
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2 text-sm text-fg transition-colors group-hover:border-accent group-hover:text-accent">
          Зареди картата
        </span>
      </div>
    </button>
  );
}
