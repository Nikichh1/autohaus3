"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAnimationFrame, useReducedMotion } from "framer-motion";

/**
 * ScrollThemeMorph — a Porsche-grade, scroll-scrubbed light→dark transition.
 *
 * The whole design system is CSS-variable driven (`--color-base`, `--color-fg`,
 * `--color-line`, `--color-accent`…). Rather than fading a stack of independent
 * elements, this component interpolates THE TOKENS THEMSELVES against scroll
 * progress and writes them to its wrapper. Because every child paints from those
 * tokens (`bg-base`, `text-fg`, `border-line`, icon `currentColor`, card
 * surfaces…), the background, text, icons, buttons, dividers and cards all move
 * together as ONE continuous transition — not a pile of separate animations.
 *
 * Properties this buys us for free:
 *   • Reversible — the theme is a pure function of scroll position, so scrolling
 *     back up runs the morph backwards, frame-for-frame.
 *   • No layout shift — only colour tokens change; never a layout property.
 *   • 60fps — one eased read of the boundary rect per frame, tokens written only
 *     when they actually changed; the heavy work is a handful of colour paints.
 *   • No flash — at rest the tokens equal the light theme (identical to the
 *     Collection today); the morph only departs from light near the seam.
 *
 * The band is deliberately concentrated at the END of the first (light) section
 * so the darkening resolves exactly as the following dark section takes over —
 * the two read as one handoff, never a hard cut.
 */

type Ctx = {
  active: boolean;
  boundaryRef: React.RefObject<HTMLDivElement | null>;
};

const ThemeMorphCtx = createContext<Ctx | null>(null);

/** Children read this to swap their static theme for the morphing tokens. */
export function useThemeMorph(): Ctx | null {
  return useContext(ThemeMorphCtx);
}

/* ── Token ramp: [cssVar, lightValue, darkValue] ────────────────────────────
   Light end is true white per the brief; dark end is deep black melting into
   the site's graphite surfaces so cards keep their depth. */
const TOKENS: readonly (readonly [string, string, string])[] = [
  ["--color-base", "#ffffff", "#050505"],
  ["--color-ink", "#ffffff", "#050505"],
  ["--color-surface", "#ffffff", "#101216"],
  ["--color-elevated", "#e6e8eb", "#181b21"],
  ["--color-fg", "#0a0c0f", "#f5f7f9"],
  ["--color-fg-muted", "#51585f", "#969ea8"],
  ["--color-fg-subtle", "#767c84", "#6a727c"],
  ["--color-accent", "#565d66", "#c9cfd6"],
  ["--color-accent-warm", "#444a52", "#dee2e7"],
  ["--color-accent-deep", "#33383f", "#8e959d"],
  ["--color-line", "rgb(10 12 15 / 0.09)", "rgb(245 247 249 / 0.09)"],
  ["--color-line-strong", "rgb(10 12 15 / 0.16)", "rgb(245 247 249 / 0.18)"],
  ["--color-overlay", "rgb(255 255 255 / 0.62)", "rgb(5 5 5 / 0.62)"],
] as const;

type RGBA = [number, number, number, number];

function parse(c: string): RGBA {
  if (c[0] === "#") {
    const h = c.slice(1);
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  }
  const n = (c.match(/[\d.]+/g) ?? []).map(Number);
  return [n[0] ?? 0, n[1] ?? 0, n[2] ?? 0, n[3] ?? 1];
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function mix(a: RGBA, b: RGBA, t: number): string {
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  const al = lerp(a[3], b[3], t);
  return al >= 0.999
    ? `rgb(${r} ${g} ${bl})`
    : `rgb(${r} ${g} ${bl} / ${al.toFixed(3)})`;
}

const RAMP = TOKENS.map(
  ([v, l, d]) => [v, parse(l), parse(d)] as const,
);

/** Light token map for the resting (SSR + progress 0) inline style. */
const LIGHT_VARS = Object.fromEntries(
  TOKENS.map(([v, l]) => [v, l]),
) as Record<string, string>;

/* Base-colour endpoints for the composited background layer. Alpha-compositing
   the dark fill over the light fill at opacity p is IDENTICAL to lerping the two
   (5·p + 255·(1−p) = 255 − 250p), so the layer matches the token ramp exactly —
   but it morphs via `opacity` (GPU compositor, zero repaint) instead of painting
   a full-viewport background-color every frame. This is what keeps it perfectly
   fluid on phones during momentum scroll. */
const BASE_LIGHT = "#ffffff";
const BASE_DARK = "#050505";

/** Perlin smootherstep — a soft S-curve so the morph eases in and settles. */
const ease = (p: number) => {
  const t = Math.min(1, Math.max(0, p));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/* Default band, in viewport-height fractions of the boundary marker's top edge:
   morph starts when the seam sits near the bottom of the viewport (the light
   section's tail is filling the screen) and completes as it nears the top (the
   dark section has taken over). When bandStart + bandEnd ≈ 1, the midpoint
   (where bg and text pass through mid-grey together) lands on the seam itself —
   ideal when real text sits on both sides, so the crossover falls on the gap. */
const DEFAULT_BAND_START = 0.92;
const DEFAULT_BAND_END = 0.24;

export function ScrollThemeMorph({
  children,
  restLight = false,
  bandStart = DEFAULT_BAND_START,
  bandEnd = DEFAULT_BAND_END,
  bgLayer = false,
}: {
  children: React.ReactNode;
  /**
   * When the wrapped content has no static theme of its own (it paints purely
   * from tokens, e.g. the service pages), set this so the wrapper renders the
   * LIGHT token set from the very first server paint — the page opens light with
   * no dark flash, and stays light as a graceful reduced-motion fallback. Leave
   * it off (default) when the children carry their own rest theme (the homepage
   * Collection/Manifesto), so their light/dark classes aren't overridden.
   */
  restLight?: boolean;
  /** Viewport-height fraction of the boundary's top where the morph begins. */
  bandStart?: number;
  /** …and where it completes. */
  bandEnd?: number;
  /**
   * Render the background as a GPU-composited crossfade layer (opacity, no
   * repaint) instead of relying on the sections' own `bg-base`. Use when the
   * wrapped content is made transparent so the layer shows through — this is
   * what makes the morph flawless on phones. Pairs with `restLight`.
   */
  bgLayer?: boolean;
}) {
  const reduce = useReducedMotion();
  const wrapRef = useRef<HTMLDivElement>(null);
  const boundaryRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const enabled = useRef(false);
  const lastP = useRef(-1);

  const [active, setActive] = useState(false);

  // Activate after mount (never under reduced motion). At SSR/first paint the
  // sections keep their static themes, so there is no hydration mismatch; the
  // swap to token-driven backgrounds happens while the seam is off-screen.
  useEffect(() => {
    if (reduce) return;
    setActive(true);
  }, [reduce]);

  // Only run the per-frame math while the zone is anywhere near the viewport.
  useEffect(() => {
    if (!active) return;
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        enabled.current = e.isIntersecting;
      },
      { rootMargin: "40% 0px 40% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  useAnimationFrame(() => {
    if (!active || !enabled.current) return;
    const b = boundaryRef.current;
    const w = wrapRef.current;
    if (!b || !w) return;
    const vh = window.innerHeight || 1;
    const top = b.getBoundingClientRect().top;
    const raw = (bandStart * vh - top) / ((bandStart - bandEnd) * vh);
    const p = ease(raw);
    if (Math.abs(p - lastP.current) < 0.001) return;
    lastP.current = p;
    // Background: composited opacity (cheap). Foreground tokens: text/borders/
    // small card surfaces (a light paint). The heavy full-viewport background
    // paint is eliminated when bgLayer is on and the sections are transparent.
    if (overlayRef.current) overlayRef.current.style.opacity = p.toFixed(3);
    for (const [v, l, d] of RAMP) {
      w.style.setProperty(v, mix(l, d, p));
    }
  });

  const style = useMemo(
    () =>
      active || restLight ? (LIGHT_VARS as React.CSSProperties) : undefined,
    [active, restLight],
  );

  const ctx = useMemo<Ctx>(() => ({ active, boundaryRef }), [active]);

  if (bgLayer) {
    return (
      <ThemeMorphCtx.Provider value={ctx}>
        <div ref={wrapRef} style={style} className="relative isolate">
          {/* Composited background — an absolute box the exact size of the
              wrapped content is the sticky pane's CONTAINING BLOCK, so the pane
              is spec-constrained to it and can never bleed over the footer or the
              nav. No `overflow` here: that would turn the box into a (non-
              scrolling) scroll container and kill the pinning. The pane morphs
              via opacity (GPU, no repaint); layout is untouched (absolute box). */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-0"
          >
            <div className="sticky top-0 h-screen w-full">
              <div className="absolute inset-0" style={{ backgroundColor: BASE_LIGHT }} />
              <div
                ref={overlayRef}
                className="absolute inset-0"
                style={{ backgroundColor: BASE_DARK, opacity: 0, willChange: "opacity" }}
              />
            </div>
          </div>
          <div className="relative z-10">{children}</div>
        </div>
      </ThemeMorphCtx.Provider>
    );
  }

  return (
    <ThemeMorphCtx.Provider value={ctx}>
      <div ref={wrapRef} style={style} className="relative">
        {children}
      </div>
    </ThemeMorphCtx.Provider>
  );
}

/**
 * Zero-height marker placed at the seam between the two sections. Its position
 * defines the scroll band; drop it in the tree exactly where light should have
 * fully become dark.
 */
export function ThemeMorphBoundary() {
  const ctx = useThemeMorph();
  return <div ref={ctx?.boundaryRef} aria-hidden className="h-0 w-full" />;
}
