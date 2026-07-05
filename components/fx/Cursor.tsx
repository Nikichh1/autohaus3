"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bespoke cursor v2 — one element, zero lag, zero jitter.
 *
 * The previous dot + lagging-halo pair read as two disagreeing pointers; this
 * is a single mark that rides the exact pointer position (no spring on
 * position — precision is the luxury) and morphs by *state*, with the morphs
 * carried by CSS transitions so they are butter-smooth and never re-render
 * React on movement:
 *
 *   default      → 8px titanium dot (mix-blend-difference, works on any beat)
 *   interactive  → opens into a 44px ring that brackets the target
 *   media "view" → 84px glass lens labelled "Виж"
 *   pressed      → compresses 15%
 *   text fields  → hands back the native caret entirely
 *
 * Position is written directly to the DOM in a pointermove handler
 * (translate3d — compositor only). Mode changes are className swaps driven by
 * pointerover, which fires only on target changes. Touch devices, screens
 * under 1024px and reduced-motion users never mount any of this.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const gate = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );
    const apply = () => setEnabled(gate.matches);
    apply();
    gate.addEventListener("change", apply);
    return () => gate.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const el = rootRef.current;
    if (!el) return;
    const label = el.querySelector<HTMLElement>(".ah-cursor-label");
    const html = document.documentElement;
    html.classList.add("has-cursor");

    let visible = false;

    const LABELS: Record<string, string> = { view: "Виж", scroll: "Скрол" };

    const setMode = (target: EventTarget | null) => {
      let mode = "default";
      if (target instanceof Element) {
        if (
          target.closest(
            "input, textarea, select, iframe, [contenteditable='true']",
          )
        ) {
          mode = "hidden";
        } else {
          // Contextual: the nearest tagged ancestor decides the lens; media
          // ("view") wins over region hints ("scroll"); plain interactives ring.
          const tagged = target.closest<HTMLElement>("[data-cursor]");
          const kind = tagged?.dataset.cursor;
          if (kind === "view" || (kind === "scroll" && !target.closest("a, button"))) {
            mode = kind;
            if (label)
              label.textContent = tagged?.dataset.cursorLabel ?? LABELS[kind];
          } else if (target.closest("a, button, [role='button'], label, summary")) {
            mode = "link";
          }
        }
      }
      el.dataset.mode = visible ? mode : "hidden";
    };

    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      if (!visible) {
        visible = true;
        setMode(e.target);
      }
    };
    const onOver = (e: PointerEvent) => setMode(e.target);
    const onDown = () => el.setAttribute("data-pressed", "");
    const onUp = () => el.removeAttribute("data-pressed");
    const onLeave = () => {
      visible = false;
      el.dataset.mode = "hidden";
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-mode="hidden"
      className="ah-cursor pointer-events-none fixed left-0 top-0 z-[80]"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    >
      <div className="ah-cursor-mark">
        <span className="ah-cursor-label label-fine">Виж</span>
      </div>
    </div>
  );
}
