"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      );
      if (prefersReduced.matches) return;
      // Allow disabling smooth scroll (e.g. for headless screenshot capture)
      if (new URLSearchParams(window.location.search).has("nosmooth")) return;
      // Touch devices keep their NATIVE momentum scroll — it's GPU-driven, feels
      // right under the thumb, and doesn't fight the pinned scroll-scrubbed
      // sections. JS smooth-scroll is a desktop-only refinement here.
      if (!window.matchMedia("(pointer: fine)").matches) return;
    }

    // lerp-based momentum scroll — smooth, slightly heavy (Rivian/Porsche feel)
    const lenis = new Lenis({
      lerp: 0.09,
      smoothWheel: true,
      wheelMultiplier: 0.95,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Jump to the top on every route change. Lenis owns the scroll position, so a
  // plain router navigation left users wherever they'd scrolled the previous
  // page (e.g. landing at the BOTTOM of /avtomobili after scrolling the home
  // page). Reset Lenis directly — or native scroll when Lenis isn't running.
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true, force: true });
    } else if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return <>{children}</>;
}
