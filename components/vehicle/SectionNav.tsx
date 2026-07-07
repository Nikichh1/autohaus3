"use client";

import { useEffect, useState } from "react";

type Item = { id: string; label: string; el: HTMLElement };

/**
 * Product-page scroll-spy — a quiet dot rail on the right edge (desktop) that
 * tracks the section in view and lets the viewer jump anywhere in the story.
 * Discovers every `[data-section]` element; rendered in mix-blend-difference
 * so it reads over both the dark bands and the cream paper.
 */
export function SectionNav() {
  const [items, setItems] = useState<Item[]>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    if (!els.length) return;
    const found = els.map((el) => ({
      id: el.dataset.section ?? "",
      label: el.dataset.sectionLabel ?? "",
      el,
    }));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(found);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = els.indexOf(entry.target as HTMLElement);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Секции"
      className="fixed right-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-end gap-4 mix-blend-difference xl:flex"
    >
      {items.map((it, i) => {
        const isActive = i === active;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => it.el.scrollIntoView({ behavior: "smooth", block: "start" })}
            aria-current={isActive ? "true" : undefined}
            aria-label={it.label}
            className="group flex h-5 items-center gap-3 text-white"
          >
            <span
              className={`label-fine whitespace-nowrap transition-all duration-500 ${
                isActive
                  ? "translate-x-0 opacity-80"
                  : "translate-x-1.5 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
              }`}
            >
              {it.label}
            </span>
            <span
              className={`h-px bg-white transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isActive ? "w-8 opacity-100" : "w-3.5 opacity-40 group-hover:w-5 group-hover:opacity-70"
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}
