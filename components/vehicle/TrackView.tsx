"use client";

import { useEffect } from "react";

/** Records one vehicle view per browser session (fire-and-forget). */
export function TrackView({ slug }: { slug: string }) {
  useEffect(() => {
    try {
      const key = `vh-view:${slug}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // sessionStorage unavailable — still record the view
    }
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    }).catch(() => {});
  }, [slug]);

  return null;
}
