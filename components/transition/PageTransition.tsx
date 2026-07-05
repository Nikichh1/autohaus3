"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";

type TransitionContextValue = {
  /**
   * Navigate to `href` as a true page-to-page slide (View Transitions API):
   * the current page slides out to the right while the destination slides in
   * from the left, both visible the whole time — no overlay, no loading screen.
   */
  navigate: (href: string) => void;
  isTransitioning: boolean;
};

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function usePageTransition(): TransitionContextValue {
  return (
    useContext(TransitionContext) ?? { navigate: () => {}, isTransitioning: false }
  );
}

/** Document augmented with the View Transitions API (not yet in all TS libs). */
type ViewTransition = { finished: Promise<void> };
type VTDocument = Document & {
  startViewTransition?: (cb: () => Promise<void> | void) => ViewTransition;
};

/** Compare routes ignoring a trailing slash (this app uses trailingSlash). */
const samePath = (a: string, b: string) =>
  a.replace(/\/+$/, "") === b.replace(/\/+$/, "");

/**
 * True page transition — both pages exist in the same space and move together.
 *
 * Uses the browser's View Transitions API, which snapshots the outgoing page and
 * the incoming page so they can be animated against each other. CSS (in
 * globals.css, scoped to `html[data-vt="slide"]`) slides the Home panel out to
 * the right and the Vehicles panel in from the left simultaneously, with blur +
 * brightness depth. There is no overlay and the interface is visible throughout.
 *
 * The destination is pushed via the Next router; the browser is told to capture
 * the "new" snapshot only once that route has actually mounted (the pathname
 * effect resolves the update promise). Progressive enhancement: browsers without
 * the API — or users who prefer reduced motion — get a plain push.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [active, setActive] = useState(false);
  const target = useRef<string | null>(null);
  const resolveDom = useRef<(() => void) | null>(null);

  const navigate = useCallback(
    (href: string) => {
      if (samePath(href, pathname) || resolveDom.current) return;

      const doc = (typeof document !== "undefined" ? document : null) as VTDocument | null;
      if (reduce || !doc || typeof doc.startViewTransition !== "function") {
        router.push(href);
        return;
      }

      target.current = href;
      doc.documentElement.dataset.vt = "slide";
      setActive(true);
      router.prefetch?.(href);

      const vt = doc.startViewTransition(
        () => new Promise<void>((res) => (resolveDom.current = res)),
      );
      vt.finished.finally(() => {
        delete doc.documentElement.dataset.vt;
        resolveDom.current = null;
        target.current = null;
        setActive(false);
      });

      router.push(href);
    },
    [pathname, reduce, router],
  );

  // The destination route has mounted (pathname changed) — release the snapshot
  // so the browser captures the new page and runs the slide.
  //
  // IMPORTANT: resolve directly here, NOT via requestAnimationFrame. While a view
  // transition is capturing, rAF callbacks are paused — using rAF deadlocks the
  // transition until the safety timeout fires (the ~2s "freeze" before the slide
  // started). Microtasks/timeouts still run during the capture, and by the time
  // this effect fires React has already committed the new DOM, so it's safe to
  // resolve immediately.
  useEffect(() => {
    if (resolveDom.current && target.current && samePath(pathname, target.current)) {
      const r = resolveDom.current;
      resolveDom.current = null;
      r();
    }
  }, [pathname]);

  // Safety — never leave the snapshot pending if navigation stalls.
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => resolveDom.current?.(), 1200);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <TransitionContext.Provider value={{ navigate, isTransitioning: active }}>
      {children}
    </TransitionContext.Provider>
  );
}
