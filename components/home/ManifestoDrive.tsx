"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  cubicBezier,
  type MotionValue,
} from "framer-motion";
import { useThemeMorph } from "@/components/fx/ScrollThemeMorph";
const REVEAL_EASE = cubicBezier(0.45, 0, 0.55, 1);
const ENTRANCE_EASE = cubicBezier(0.16, 1, 0.3, 1);

const DEFAULT_STATEMENT =
  "Не просто автосалон — дом за машини с характер. Всяка е подбрана, проверена и готова за пътя.";

/**
 * Chapter 02 — The Philosophy. A pinned statement scene: each word emerges
 * from depth — blur resolving to focus, rising and settling into place — as if
 * the sentence is being machined out of the dark. Behind it, wind-tunnel
 * streamlines draw across the graphite: the aerodynamic signature of a car
 * that isn't there. Architectural, precise, no ornament.
 *
 * The statement is admin-editable; both the phone still and the desktop
 * word-by-word reveal derive from the same string, so they never diverge.
 */
export function ManifestoDrive({ statement = DEFAULT_STATEMENT }: { statement?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // Inside the scroll-morph zone the background is owned by the wrapper's
  // GPU-composited pane, so we shed the section's own `field-graphite` fill and
  // the `.sheet` seam (which would draw a hard line mid-morph) and go
  // transparent — the pane behind arrives fully dark exactly as the light
  // section above finishes darkening, with zero per-frame repaint here.
  const morph = useThemeMorph()?.active ?? false;
  const WORDS = statement.trim().split(/\s+/);
  // Phones keep the true blur-to-focus, but words share a focus group of three
  // so the scene animates ~6 filter layers instead of 17 — cinematic on a
  // mid-range GPU. Desktop resolves word by word.
  const [lite, setLite] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLite(
      !window.matchMedia("(min-width: 1024px)").matches ||
        !window.matchMedia("(pointer: fine)").matches,
    );
  }, []);
  const chunkSize = lite ? 3 : 1;
  const chunks: { text: string; start: number }[] = [];
  for (let i = 0; i < WORDS.length; i += chunkSize)
    chunks.push({ text: WORDS.slice(i, i + chunkSize).join(" "), start: i });

  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  return (
    <>
    {/* ── Phones: the manifesto plays as ONE cinematic beat when it scrolls
        into view — the same machined blur-to-focus, word-by-word grammar as
        desktop, but triggered once (never scrubbed, never SSR'd mid-blur) and
        the wind-tunnel streamlines draw in beneath it. */}
    {/* No data-chapter here — the chapter rail is desktop-only and must keep
        exactly one owner of "02" (the pinned section below). */}
    <MobilePhilosophy words={WORDS} reduce={!!reduce} morph={morph} />

    <section
      ref={ref}
      data-chapter="02"
      data-chapter-label="Философия"
      className={`relative -mt-[8vh] hidden h-[150vh] md:block md:h-[170vh] ${
        morph ? "" : "sheet field-graphite"
      }`}
    >
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        {/* atmosphere */}
        <div aria-hidden className="brushed pointer-events-none absolute inset-0 opacity-[0.05]" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(245,247,249,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,247,249,0.6) 1px, transparent 1px)",
            backgroundSize: "84px 84px",
            maskImage: "radial-gradient(85% 80% at 40% 50%, #000 25%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(85% 80% at 40% 50%, #000 25%, transparent 80%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(44% 54% at 86% 20%, rgba(201,207,214,0.12), transparent 64%)",
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-2%] top-[6%] select-none font-display text-[20vw] font-extrabold leading-none tracking-tighter text-white/[0.025] lg:text-[14vw]"
        >
          02
        </span>

        {/* ── Aerodynamic streamlines — airflow over an unseen machine ── */}
        <Streamlines progress={p} reduce={!!reduce} />

        <div className="relative z-10 mx-auto w-full max-w-wide px-5 sm:px-8 md:px-12">
          <p className="label-fine mb-8 text-fg-subtle md:mb-10">
            <span aria-hidden className="mr-2 text-racing">[</span>
            02 · Философията на AutoHaus
            <span aria-hidden className="ml-2 text-racing">]</span>
          </p>
          <p className="flex max-w-4xl flex-wrap font-display text-[1.6rem] font-extrabold leading-[1.2] tracking-tight sm:text-[2rem] md:text-[clamp(2.1rem,3.4vw,3.2rem)] md:leading-[1.12]">
            {chunks.map((c) => (
              <FocusGroup
                key={c.start}
                text={c.text}
                index={c.start}
                span={chunkSize + 1.4}
                total={WORDS.length}
                progress={p}
                reduce={!!reduce}
                maxBlur={reduce || lite ? 0 : 10}
              />
            ))}
          </p>
        </div>
      </div>
    </section>
    </>
  );
}

/**
 * The mobile Philosophy — the desktop scene's cinema, freed from the scroll
 * pin. A full-height immersive beat: the same engineering atmosphere (brushed
 * metal, a masked measurement grid, a titanium glow and the oversized "02"),
 * the statement machining itself into focus word-group by word-group, and the
 * wind-tunnel streamlines drawing across the floor — all fired once when the
 * section enters (no scrub, no SSR smear). Reads like the PC, runs like a phone.
 */
function MobilePhilosophy({
  words,
  reduce,
  morph,
}: {
  words: string[];
  reduce: boolean;
  morph: boolean;
}) {
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += 3)
    chunks.push(words.slice(i, i + 3).join(" "));

  return (
    <section
      aria-label="Философия"
      className={`relative -mt-[8vh] flex min-h-[88svh] flex-col justify-center overflow-hidden md:hidden ${
        morph ? "" : "sheet field-graphite"
      }`}
    >
      {/* atmosphere — brushed metal + masked measurement grid + titanium glow */}
      <div aria-hidden className="brushed pointer-events-none absolute inset-0 opacity-[0.05]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,247,249,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,247,249,0.6) 1px, transparent 1px)",
          backgroundSize: "62px 62px",
          maskImage: "radial-gradient(90% 70% at 35% 42%, #000 25%, transparent 82%)",
          WebkitMaskImage: "radial-gradient(90% 70% at 35% 42%, #000 25%, transparent 82%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(58% 42% at 84% 12%, rgba(201,207,214,0.14), transparent 62%)",
        }}
      />
      {/* the oversized "02" watermark — drifts in as the beat lands */}
      <motion.span
        aria-hidden
        initial={reduce ? false : { opacity: 0, x: 48 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.2, ease: ENTRANCE_EASE }}
        className="pointer-events-none absolute right-[-4%] top-[7%] select-none font-display text-[40vw] font-extrabold leading-none tracking-tighter text-white/[0.035]"
      >
        02
      </motion.span>

      {/* wind-tunnel streamlines — airflow over an unseen machine, drawn across
          the lower half as a full-bleed background element (like the PC scene) */}
      <motion.div
        aria-hidden
        initial={reduce ? false : { x: -24 }}
        whileInView={{ x: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.6, ease: ENTRANCE_EASE }}
        className="pointer-events-none absolute inset-x-[-6%] bottom-0 h-[54%] opacity-60"
      >
        <motion.svg
          viewBox="0 0 1440 520"
          preserveAspectRatio="xMidYMax slice"
          fill="none"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="h-full w-full text-accent/35"
        >
          {LINES.map((d, i) => (
            <motion.path
              key={d}
              d={d}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              variants={{
                hidden: { pathLength: reduce ? 1 : 0, opacity: 0.12 },
                show: {
                  pathLength: 1,
                  opacity: 1,
                  transition: { duration: 1.4, delay: 0.2 + i * 0.14, ease: ENTRANCE_EASE },
                },
              }}
            />
          ))}
          {/* measurement ticks along the floor — the wind-tunnel scale */}
          {Array.from({ length: 24 }, (_, i) => (
            <line
              key={i}
              x1={i * 62 + 10}
              y1={506}
              x2={i * 62 + 10}
              y2={i % 4 === 0 ? 494 : 500}
              stroke="currentColor"
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ))}
        </motion.svg>
      </motion.div>

      {/* the statement — centred, machined into focus three words at a time */}
      <div className="relative z-10 px-5 py-24">
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, ease: ENTRANCE_EASE }}
          className="label-fine mb-8 text-fg-subtle"
        >
          <span aria-hidden className="mr-2 text-racing">[</span>
          02 · Философията на AutoHaus
          <span aria-hidden className="ml-2 text-racing">]</span>
        </motion.p>

        <motion.p
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ show: { transition: { staggerChildren: 0.13, delayChildren: 0.16 } } }}
          className="flex flex-wrap font-display text-[clamp(2rem,8.4vw,2.5rem)] font-extrabold leading-[1.14] tracking-tight"
        >
          {chunks.map((c, i) => (
            <motion.span
              key={i}
              variants={{
                hidden: {
                  opacity: 0.22,
                  y: reduce ? 0 : 16,
                  filter: reduce ? "blur(0px)" : "blur(10px)",
                },
                show: {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: { duration: 0.85, ease: REVEAL_EASE },
                },
              }}
              className="text-titanium mr-[0.28em] inline-block will-change-[filter,transform]"
            >
              {c}
            </motion.span>
          ))}
        </motion.p>
      </div>
    </section>
  );
}

/**
 * One word of the statement, staged in depth: it resolves from a soft blur
 * (its own compositor layer, desktop only), rises and scales into place — the
 * blur-to-focus grammar of a lens pulling the line into the plane of the page.
 */
function FocusGroup({
  text,
  index,
  span,
  total,
  progress,
  reduce,
  maxBlur,
}: {
  text: string;
  index: number;
  span: number;
  total: number;
  progress: MotionValue<number>;
  reduce: boolean;
  maxBlur: number;
}) {
  const START = 0.1;
  const SPAN = 0.42;
  const a = START + (index / total) * SPAN;
  const b = START + ((index + span) / total) * SPAN;
  const opacity = useTransform(progress, [a, b], [0.3, 1], { ease: REVEAL_EASE });
  const y = useTransform(progress, [a, b], reduce ? [0, 0] : [16, 0], { ease: REVEAL_EASE });
  const scale = useTransform(progress, [a, b], reduce ? [1, 1] : [0.94, 1], { ease: REVEAL_EASE });
  const blurN = useTransform(progress, [a, b], [maxBlur, 0], { ease: REVEAL_EASE });
  const filter = useTransform(blurN, (v) => `blur(${v}px)`);
  const blurred = maxBlur > 0;

  return (
    // Outer span owns layout + rise; inner span owns the focus pull so the
    // blur halo never clips against the word gap.
    <motion.span style={{ opacity, y, scale }} className="mr-[0.26em] inline-block">
      <motion.span
        style={blurred ? { filter } : undefined}
        className={`text-titanium inline-block px-[0.14em] py-[0.3em] -mx-[0.14em] -my-[0.3em] ${blurred ? "will-change-[filter]" : ""}`}
      >
        {text}
      </motion.span>
    </motion.span>
  );
}

/* Wind-tunnel lines: long curves compressing over an implied cabin, drawn in
   staggered with the scroll and drifting laterally — engineering as ornament. */
const LINES = [
  "M-40,470 C300,470 520,466 700,428 C880,390 1120,378 1480,390",
  "M-40,428 C280,428 500,418 660,368 C820,318 1090,328 1480,342",
  "M-40,386 C260,386 480,370 640,310 C790,256 1070,278 1480,296",
  "M-40,344 C240,344 460,326 620,264 C760,210 1050,232 1480,252",
  "M-40,302 C220,302 440,284 600,226 C740,178 1030,194 1480,208",
];

function Streamlines({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) {
  const drift = useTransform(progress, [0, 1], [-30, 30]);
  return (
    <motion.div
      aria-hidden
      style={reduce ? undefined : { x: drift }}
      className="pointer-events-none absolute inset-x-[-4%] bottom-0 top-auto h-[62%] opacity-[0.5]"
    >
      <svg viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" fill="none" className="h-full w-full text-accent/35">
        {LINES.map((d, i) => (
          <StreamPath key={d} d={d} index={i} progress={progress} reduce={reduce} />
        ))}
        {/* measure ticks along the floor — the wind-tunnel scale */}
        {Array.from({ length: 24 }, (_, i) => (
          <line
            key={i}
            x1={i * 62 + 10}
            y1={506}
            x2={i * 62 + 10}
            y2={i % 4 === 0 ? 494 : 500}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={1}
          />
        ))}
      </svg>
    </motion.div>
  );
}

function StreamPath({
  d,
  index,
  progress,
  reduce,
}: {
  d: string;
  index: number;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const a = 0.04 + index * 0.05;
  const draw = useTransform(progress, [a, a + 0.34], [0, 1]);
  return (
    <motion.path
      d={d}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      style={reduce ? undefined : { pathLength: draw }}
    />
  );
}
