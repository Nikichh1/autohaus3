"use client";

import { useEffect, useState } from "react";

type Chapter = { num: string; label: string; el: HTMLElement };

/**
 * Chapter rail — the film's spine, fixed on the left edge (desktop only).
 * Discovers every `[data-chapter]` section, marks the one on screen and lets
 * the viewer jump between scenes. Rendered in mix-blend-difference so it reads
 * over both the dark film beats and the light editorial paper. One of the
 * signature custom elements of the AutoHaus experience.
 */
export function ChapterRail() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-chapter]"),
    );
    const found = els.map((el) => ({
      num: el.dataset.chapter ?? "",
      label: el.dataset.chapterLabel ?? "",
      el,
    }));
    // The chapter list only exists in the DOM — discovered after mount by design.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setChapters(found);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = els.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      // A thin band across the viewport centre decides the current chapter.
      { rootMargin: "-46% 0px -46% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  if (!chapters.length) return null;

  return (
    <nav
      aria-label="Глави"
      data-chapter-rail
      className="fixed left-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 mix-blend-difference xl:flex"
    >
      {chapters.map((c, i) => {
        const isActive = i === active;
        return (
          <button
            key={c.num}
            type="button"
            onClick={() =>
              c.el.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            aria-label={`Глава ${c.num} — ${c.label}`}
            aria-current={isActive ? "true" : undefined}
            className="group flex h-5 cursor-pointer items-center gap-3 text-white"
          >
            <span
              className={`h-px bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive ? "w-8 opacity-100" : "w-3.5 opacity-40 group-hover:w-5 group-hover:opacity-70"
              }`}
            />
            <span
              className={`label-fine whitespace-nowrap transition-all duration-500 ${
                isActive
                  ? "translate-x-0 opacity-80"
                  : "-translate-x-1.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
              }`}
            >
              {/* number always; the wordy label only on hover, so the rail
                  never collides with section content on narrower desktops */}
              {c.num}
              <span className="hidden group-hover:inline"> · {c.label}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
