"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Bespoke cursor v3 — precision dot + adaptive halo.
 *
 * The pointer itself is a small titanium dot (white core, hairline dark ring —
 * readable on any background, no blend modes). Interaction is communicated by
 * a separate halo layer that *adopts the element*: hover a button or link and
 * the halo glides to it, wraps its exact bounds and border-radius, and settles
 * as a subtle glowing outline — the "AI OS" affordance. It re-tracks per frame,
 * so magnetic buttons carry their halo with them. Media keeps the refraction
 * lens ("Виж"/"Скрол"). Text fields hand back the native caret. Touch, small
 * screens and reduced-motion users never mount any of this.
 */
export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const haloRef = useRef<HTMLDivElement>(null);

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
    const halo = haloRef.current;
    if (!el || !halo) return;
    const label = el.querySelector<HTMLElement>(".ah-cursor-label");
    const html = document.documentElement;
    html.classList.add("has-cursor");

    let visible = false;
    let locked: HTMLElement | null = null;
    let lockedRadius = "12px";

    const LABELS: Record<string, string> = { view: "Виж", scroll: "Скрол" };
    const PAD = 4;

    const placeHalo = () => {
      if (!locked || !locked.isConnected) return;
      const r = locked.getBoundingClientRect();
      halo.style.transform = `translate3d(${r.left - PAD}px, ${r.top - PAD}px, 0)`;
      halo.style.width = `${r.width + PAD * 2}px`;
      halo.style.height = `${r.height + PAD * 2}px`;
      halo.style.borderRadius = lockedRadius;
    };

    const lock = (target: HTMLElement) => {
      locked = target;
      const br = getComputedStyle(target).borderRadius;
      // Grow simple radii by the padding so the outline hugs the shape;
      // multi-value radii fall back to a soft default.
      lockedRadius =
        br && !br.includes(" ") && br !== "0px" ? `calc(${br} + ${PAD}px)` : "12px";
      placeHalo();
      halo.dataset.on = "";
    };
    const unlock = () => {
      locked = null;
      delete halo.dataset.on;
    };

    const setMode = (target: EventTarget | null) => {
      let mode = "default";
      if (target instanceof Element) {
        if (target.closest("input, textarea, select, iframe, [contenteditable='true']")) {
          mode = "hidden";
          unlock();
        } else {
          const tagged = target.closest<HTMLElement>("[data-cursor]");
          const kind = tagged?.dataset.cursor;
          if (kind === "view" || (kind === "scroll" && !target.closest("a, button"))) {
            mode = kind;
            unlock();
            if (label) label.textContent = tagged?.dataset.cursorLabel ?? LABELS[kind];
          } else {
            const interactive = target.closest<HTMLElement>(
              "a, button, [role='button'], label, summary",
            );
            if (interactive) {
              mode = "link";
              if (locked !== interactive) lock(interactive);
            } else {
              unlock();
            }
          }
        }
      }
      el.dataset.mode = visible ? mode : "hidden";
    };

    const onMove = (e: PointerEvent) => {
      el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      // Magnetic buttons drift under the pointer — keep the halo glued.
      if (locked) placeHalo();
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
      unlock();
    };
    const onScroll = () => {
      if (locked) placeHalo();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      html.classList.remove("has-cursor");
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      {/* halo — adopts the hovered control */}
      <div
        ref={haloRef}
        aria-hidden
        className="ah-halo pointer-events-none fixed left-0 top-0 z-[79]"
      />
      {/* dot — the pointer itself */}
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
    </>
  );
}
