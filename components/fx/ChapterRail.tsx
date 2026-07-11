"use client";

import { useEffect, useRef, useState } from "react";

type Chapter = { num: string; label: string; el: HTMLElement };

/** Is the section a light one? The Collection used to be sniffed via `.light`,
 *  but inside the scroll-morph zone it sheds that class (the theme is driven by
 *  interpolated tokens instead), so it advertises `data-rail-theme="light"`. */
function isLightSection(el: HTMLElement): boolean {
  return (
    el.dataset.railTheme === "light" ||
    el.classList.contains("light") ||
    !!el.closest(".light")
  );
}

/**
 * Chapter rail — the film's spine, fixed on the left edge (desktop only).
 *
 * Each tick colours ITSELF to contrast with the section directly behind it:
 * titanium over the dark film beats, graphite over the light editorial paper.
 * Because the rail spans several sections at once, the ticks are coloured
 * INDIVIDUALLY — when the viewport straddles a seam, the upper ticks and lower
 * ticks can be different colours, each contrasting with its own backdrop.
 *
 * It is driven by scroll position (not an IntersectionObserver), so the colour
 * tracks continuously and never gets "stuck" between sections. Performance: the
 * section boundaries and the (fixed) tick positions are measured ONCE per
 * layout; each scroll frame only does arithmetic + a couple of attribute writes
 * (no getBoundingClientRect, no React re-render). Idle = nothing.
 */
export function ChapterRail() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sections = useRef<{ top: number; light: boolean }[]>([]);
  const tickY = useRef<number[]>([]);

  // discover the chapters once
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChapters(els.map((el) => ({ num: el.dataset.chapter ?? "", label: el.dataset.chapterLabel ?? "", el })));
  }, []);

  // measure + drive (once chapters + buttons are in the DOM)
  useEffect(() => {
    if (!chapters.length) return;

    const measure = () => {
      const sy = window.scrollY;
      sections.current = chapters.map((c) => {
        const r = c.el.getBoundingClientRect();
        return { top: r.top + sy, light: isLightSection(c.el) };
      });
      tickY.current = btnRefs.current.map((b) => {
        if (!b) return window.innerHeight / 2;
        const r = b.getBoundingClientRect();
        return r.top + r.height / 2;
      });
    };

    const compute = () => {
      const secs = sections.current;
      const tY = tickY.current;
      const btns = btnRefs.current;
      if (!secs.length) return;
      const sy = window.scrollY;
      const vh = window.innerHeight;
      // active = the chapter covering the viewport centre
      const center = sy + vh / 2;
      let activeIdx = 0;
      for (let i = 0; i < secs.length; i++) if (secs[i].top <= center) activeIdx = i;
      // colour each tick by the section directly behind it
      for (let i = 0; i < btns.length; i++) {
        const b = btns[i];
        if (!b) continue;
        const dy = sy + (tY[i] ?? vh / 2);
        let s = 0;
        for (let j = 0; j < secs.length; j++) if (secs[j].top <= dy) s = j;
        const lit = secs[s].light ? "true" : "false";
        if (b.dataset.lit !== lit) b.dataset.lit = lit;
        const act = i === activeIdx ? "true" : "false";
        if (b.dataset.active !== act) b.dataset.active = act;
      }
    };

    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; compute(); }); };
    const remeasure = () => { measure(); schedule(); };

    measure();
    compute();
    const t1 = setTimeout(remeasure, 400);
    const t2 = setTimeout(remeasure, 1400);

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", remeasure);
    const ro = new ResizeObserver(remeasure);
    ro.observe(document.body);

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", remeasure);
      ro.disconnect();
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [chapters]);

  if (!chapters.length) return null;

  return (
    <div
      data-chapter-rail
      className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 xl:flex"
    >
      {chapters.map((c, i) => (
        <button
          key={c.num}
          ref={(el) => { btnRefs.current[i] = el; }}
          type="button"
          data-lit="false"
          data-active="false"
          onClick={() => c.el.scrollIntoView({ behavior: "smooth", block: "start" })}
          aria-label={`Глава ${c.num} — ${c.label}`}
          className="group flex h-5 cursor-pointer items-center gap-3"
        >
          <span className="rail-mark" />
          <span className="rail-label label-fine">
            {c.num}
            <span className="hidden group-hover:inline"> · {c.label}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
