"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Premium image reveal — loads slightly blurred + scaled, then resolves to
 * sharp on load (the "expensive" deblur, not a flashy fade). Use for
 * below-the-fold imagery (cards, galleries). For LCP/hero images keep the
 * dedicated entrance animation instead so first paint isn't delayed.
 */
export function BlurImage({ className, alt, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      {...props}
      alt={alt}
      onLoad={() => setLoaded(true)}
      className={cn(
        "transition-[filter,transform,opacity] duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[filter,transform]",
        loaded
          ? "scale-100 opacity-100 blur-0"
          : "scale-[1.06] opacity-0 blur-2xl",
        className,
      )}
    />
  );
}
