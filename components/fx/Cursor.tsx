"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bespoke cursor — final form: a small precision dot (white core, hairline
 * dark ring — readable on any background, no blend modes) that quiets over
 * interactive elements and becomes a refraction lens ("Виж"/"Скрол") over
 * media. Nothing else — buttons keep their own hover states. Text fields hand
 * back the native caret. Touch devices, small screens and reduced-motion
 * users never mount any of this.
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
        if (target.closest("input, textarea, select, iframe, [contenteditable='true']")) {
          mode = "hidden";
        } else {
          const tagged = target.closest<HTMLElement>("[data-cursor]");
          const kind = tagged?.dataset.cursor;
          if (kind === "view" || (kind === "scroll" && !target.closest("a, button"))) {
            mode = kind;
            if (label) label.textContent = tagged?.dataset.cursorLabel ?? LABELS[kind];
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
      className="ah-cursor pointer-events-none fixed left-0 top-0 z-[130]"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    >
      <div className="ah-cursor-mark">
        <span className="ah-cursor-label label-fine">Виж</span>
      </div>
    </div>
  );
}
