"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { sound } from "@/lib/sound/engine";

const STORAGE_KEY = "ah-sound";

/**
 * The site's sound layer — opt-in, off by default, desktop only (phones keep
 * their speakers out of it). One toggle in the corner arms a synthesized
 * instrument (see lib/sound/engine.ts):
 *
 *   • a precise switch click on every button / link press,
 *   • a faint tick when the pointer crosses something interactive,
 *   • a cinematic air whoosh as each film chapter arrives under the scroll,
 *   • a sub-bass swell on the finale,
 *   • the engine idle already living under the Machine scene.
 *
 * Sound is unlocked by the enabling gesture (browsers require one), and the
 * preference persists. Everything is guarded so audio can never crash the UI.
 */
export function SoundSystem() {
  const [available, setAvailable] = useState(false);
  const [on, setOn] = useState(false);

  // Desktop-only availability.
  useEffect(() => {
    const gate = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const apply = () => setAvailable(gate.matches);
    apply();
    gate.addEventListener("change", apply);
    return () => gate.removeEventListener("change", apply);
  }, []);

  // Restore the saved preference. The context stays suspended until the first
  // gesture, so no audio plays before the user interacts — no autoplay fight.
  useEffect(() => {
    let saved = false;
    try {
      saved = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      /* storage blocked */
    }
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOn(true);
      sound.setEnabled(true);
      sound.startRumble();
    }
  }, []);

  // Delegated UI sounds — one pair of listeners, active only while enabled.
  useEffect(() => {
    if (!on) return;
    const interactive = (t: EventTarget | null): HTMLElement | null =>
      t instanceof Element
        ? (t.closest("a, button, [role='button'], summary, label") as HTMLElement | null)
        : null;
    const onDown = (e: PointerEvent) => {
      const el = interactive(e.target);
      if (!el || el.closest("input, select, textarea")) return;
      if (el.getAttribute("data-sound") === "thunk" || el.closest("[data-sound='thunk']")) sound.thunk();
      else sound.click();
    };
    const onOver = (e: PointerEvent) => {
      const el = interactive(e.target);
      if (el && !el.closest("input, select, textarea")) sound.hover();
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointerover", onOver, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointerover", onOver);
    };
  }, [on]);

  // Chapter whoosh + finale swell — fires as a new film chapter takes the
  // centre band of the viewport. Gracefully no-ops off the homepage.
  useEffect(() => {
    if (!on) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-chapter]"));
    if (!els.length) return;
    let current = -1;
    let armed = false;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const idx = els.indexOf(e.target as HTMLElement);
          if (idx === current) continue;
          current = idx;
          if (!armed) {
            armed = true;
            continue;
          } // skip the first (on-load) hit
          const label = (e.target as HTMLElement).getAttribute("data-chapter-label");
          if (label === "Покана") sound.swell();
          else sound.whoosh();
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [on]);

  if (!available) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    sound.setEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* storage blocked */
    }
    if (next) {
      sound.ignition();
      sound.startRumble();
    } else {
      sound.stopRumble();
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Изключете звука" : "Включете звука"}
      className="panel-glass edge-light fixed bottom-6 right-6 z-40 flex h-11 cursor-pointer items-center gap-2.5 rounded-full px-4 text-fg/80 backdrop-blur-xl transition-colors hover:text-fg"
    >
      {on ? <Volume2 className="size-4" strokeWidth={1.7} /> : <VolumeX className="size-4" strokeWidth={1.7} />}
      <span className="label-fine">Звук</span>
      {on && (
        <span aria-hidden className="flex items-end gap-0.5">
          {[0.5, 0.9, 0.65].map((d, i) => (
            <span
              key={i}
              className="eq-bar w-0.5 rounded-full bg-accent"
              style={{ height: 10, animationDelay: `${i * 0.18}s`, animationDuration: `${d + 0.5}s` }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
