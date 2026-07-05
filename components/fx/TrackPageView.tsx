"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Site-wide page-view beacon. Fires once per pathname change with a stable
 * per-session id (privacy-friendly — no IP, no cross-session identity), the
 * referrer host and a coarse device class. Powers the admin analytics.
 * Mounted in the public site layout only, so /admin is never tracked.
 */
function sessionId(): string {
  try {
    let id = sessionStorage.getItem("ah-sid");
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem("ah-sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function TrackPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    let referrer: string | null = null;
    try {
      // Only the referrer HOST, and only for external referrers.
      if (document.referrer && !document.referrer.includes(location.host)) {
        referrer = new URL(document.referrer).hostname.replace(/^www\./, "");
      }
    } catch {
      referrer = null;
    }
    const device = window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";

    // Defer to idle so it never competes with paint/interaction.
    const send = () =>
      fetch("/api/track/page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, sessionId: sessionId(), referrer, device }),
        keepalive: true,
      }).catch(() => {});
    const w = window as unknown as { requestIdleCallback?: (cb: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(send);
    else setTimeout(send, 400);
  }, [pathname]);

  return null;
}
