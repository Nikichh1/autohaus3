"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

/**
 * Share the vehicle — the native share sheet where available (phones), a
 * copy-link with a brief "Копирано" confirmation everywhere else. Quiet,
 * premium, and genuinely useful for someone sending a car to a partner.
 */
export function ShareButton({ title, text }: { title: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  const onShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title, text: text ?? title, url });
        return;
      } catch {
        /* cancelled — fall through to copy */
      }
    }
    try {
      await nav?.clipboard?.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — no-op */
    }
  };

  return (
    <button
      type="button"
      onClick={onShare}
      aria-label="Споделете този автомобил"
      className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-[2px] border border-line-strong text-fg transition-colors hover:border-accent"
    >
      {copied ? <Check className="size-4 text-accent" /> : <Share2 className="size-[18px]" strokeWidth={1.7} />}
    </button>
  );
}
