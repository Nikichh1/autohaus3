"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  motion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { ArrowRight, Phone } from "lucide-react";
import { CinematicGrade } from "@/components/fx/CinematicGrade";
import { StatCounter } from "@/components/motion/StatCounter";
import { contactInfo } from "@/lib/nav";

/**
 * The Opening Film — a scroll-driven cinematic entry into the dealership.
 *
 * The clip is pre-exploded into graded frames painted to a <canvas> per scroll
 * position (frame-accurate, no <video> seeking, no stalls). Riding the footage
 * is a sequence of story beats that live IN the space, not on it: each line
 * materialises from depth (blur + scale + rise inside a perspective stage),
 * holds while the camera moves, then flies past the lens — the same grammar a
 * title designer would use. The arc is built for psychological pull:
 *
 *   logo → "Някои коли се купуват." → "Други се заслужават." → brand hand-off
 *
 * ending in a dissolve straight into the hero stage. The site nav stays out of
 * frame while the film owns the viewport (data-intro-active).
 */

const FRAME_COUNT = 119;
const SCRUB_VH = 380;
const SCRUB_VH_MOBILE = 200; // tighter pacing under the thumb
const ASSET_VERSION = 2;
const pad = (n: number) => String(n).padStart(3, "0");

/** [enterStart, hold, releaseStart, gone] scroll windows per beat. */
type Window4 = [number, number, number, number];

const BEAT_LINE: { text: string; window: Window4; align: "center" | "left" | "right" } = {
  text: "Някои коли се купуват. Други се заслужават.",
  window: [0.3, 0.42, 0.52, 0.6],
  align: "left",
};
const W_PROOF: Window4 = [0.58, 0.68, 0.76, 0.83];
const W_WELCOME: Window4 = [0.82, 0.9, 0.97, 1];

const PROOF: [number, string, string][] = [
  [20, "+", "години на пазара"],
  [4800, "+", "доставени автомобила"],
  [35, "", "представени марки"],
];

/** Same proof, phone-length labels — they must read whole, never truncate. */
const PROOF_MOBILE: [number, string, string][] = [
  [20, "+", "години"],
  [4800, "+", "автомобила"],
  [35, "", "марки"],
];

export type IntroCopy = {
  eyebrow: string;
  line1: string;
  line2: string;
  scrollHint: string;
};

const DEFAULT_INTRO_COPY: IntroCopy = {
  eyebrow: "Пловдив · Премиум автомобили",
  line1: "Някои коли се купуват.",
  line2: "Други се заслужават.",
  scrollHint: "Продължете надолу",
};

export function IntroFilm({ copy = DEFAULT_INTRO_COPY }: { copy?: IntroCopy } = {}) {
  const reduce = useReducedMotion();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const drawnP = useRef(0);
  const lastIdx = useRef(-1);
  const activeRef = useRef(true);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(0);

  const progress = useMotionValue(0);

  // ── Beat 0: the real wordmark, standing in the doorway ──
  const logoOpacity = useTransform(progress, [0, 0.14, 0.26], [1, 1, 0]);
  const logoScale = useTransform(progress, [0, 0.26], [1, 1.9]);
  const logoBlur = useTransform(progress, [0.1, 0.26], [0, 14]);
  const logoFilter = useTransform(logoBlur, (b) => `blur(${b}px)`);
  const leftScrim = useTransform(progress, [0, 0.28], [1, 0]);
  const cover = useTransform(progress, [0.9, 1], [0, 1]);
  const hint = useTransform(progress, [0, 0.06], [1, 0]);
  // Pointer parallax — the beats hang in the space of the footage.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const bx = useSpring(useTransform(px, [-1, 1], [-9, 9]), { stiffness: 55, damping: 16 });
  const by = useSpring(useTransform(py, [-1, 1], [-6, 6]), { stiffness: 55, damping: 16 });
  const onPointer = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    px.set(((e.clientX - r.left) / r.width) * 2 - 1);
    py.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(
      !window.matchMedia("(min-width: 1024px)").matches ||
        !window.matchMedia("(pointer: fine)").matches,
    );
    setMounted(true);
  }, []);

  useEffect(() => {
    // Phones never download the frame sequence — they get the lightweight
    // title-card opening below instead.
    if (!mounted || reduce || isMobile) return;
    const dir = "frames";
    const imgs: HTMLImageElement[] = [];
    let count = 0;
    let cancelled = false;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/intro/${dir}/f${pad(i)}.webp?v=${ASSET_VERSION}`;
      const done = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
      };
      img.decode().then(done).catch(done);
      imgs[i - 1] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [mounted, isMobile, reduce]);

  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Phones paint at a capped density — the letterboxed frame hides the
    // difference and scrubbing stays fluid on mid-range GPUs.
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.3 : 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const tw = Math.round(cw * dpr);
    const th = Math.round(ch * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    // In-canvas grade — pulls the daylight source toward the graphite brand look.
    ctx.filter = "contrast(1.07) saturate(0.88) brightness(0.95)";
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
    ctx.filter = "none";
  };

  useAnimationFrame(() => {
    if (reduce || isMobile || !activeRef.current) return;
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dist = rect.height - window.innerHeight;
    const p = dist > 0 ? Math.min(Math.max(-rect.top / dist, 0), 1) : 0;
    progress.set(p);

    const html = document.documentElement;
    if (p > 0.001 && p < 0.92) html.setAttribute("data-intro-active", "1");
    else html.removeAttribute("data-intro-active");

    drawnP.current += (p - drawnP.current) * 0.2;
    if (Math.abs(p - drawnP.current) < 0.0005) drawnP.current = p;
    let idx = Math.round(drawnP.current * (FRAME_COUNT - 1));
    if (loaded < FRAME_COUNT) idx = Math.min(idx, Math.max(loaded - 1, 0));
    if (idx !== lastIdx.current) {
      draw(idx);
      lastIdx.current = idx;
    }
  });

  useEffect(() => {
    if (!mounted || reduce) return;
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
        if (!entry.isIntersecting)
          document.documentElement.removeAttribute("data-intro-active");
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted, reduce]);

  useEffect(() => {
    const onResize = () => {
      lastIdx.current = -1;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (loaded > 0) lastIdx.current = -1;
  }, [loaded]);
  useEffect(
    () => () => document.documentElement.removeAttribute("data-intro-active"),
    [],
  );

  // Reduced motion → one still, the wordmark, no pin. Phones get the
  // portrait facility shot; desktop keeps the film poster (CSS-gated).
  if (reduce) {
    return (
      <section className="relative h-[100svh] w-full overflow-hidden bg-base">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/intro/intro-poster.jpg?v=${ASSET_VERSION}`}
          alt=""
          aria-hidden
          className="film-desktop absolute inset-0 h-full w-full object-cover"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/photos/autohaus-hero-m-1080.webp"
          srcSet="/photos/autohaus-hero-m-750.webp 750w, /photos/autohaus-hero-m-1080.webp 1080w"
          sizes="100vw"
          alt=""
          aria-hidden
          className="film-mobile absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(8,9,12,0.85) 0%, rgba(8,9,12,0.45) 30%, transparent 62%)",
          }}
        />
        <div className="absolute inset-0 flex max-w-2xl flex-col justify-center pl-6 md:pl-16">
          <p className="label-fine text-accent">Пловдив · Премиум автомобили</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.svg"
            alt="AutoHaus"
            className="mt-4 w-[clamp(240px,60vw,460px)] select-none"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-base to-transparent" />
      </section>
    );
  }

  const ready = loaded >= FRAME_COUNT;

  // ── Mobile: a purpose-built, weightless opening — one graded title card,
  // letterboxed, with the brand, the line and live proof. No pin, no scrub,
  // no frame downloads: instant and fluid on any phone. Pre-hydration BOTH
  // variants are in the server HTML, CSS-gated (`.film-mobile` /
  // `.film-desktop` in globals.css mirror the JS isMobile test) — a phone
  // paints its own opening immediately instead of laying out the 380vh
  // desktop film and swapping after React mounts. The wrapper div keeps its
  // identity across hydration so the opening never remounts mid-animation.
  const showMobile = !mounted || isMobile;
  const showDesktop = !mounted || !isMobile;
  return (
    <>
    {showMobile ? (
      <div className="film-mobile">
        <MobileOpening copy={copy} />
      </div>
    ) : null}
    {showDesktop ? (
    <section
      ref={wrapperRef}
      style={{ height: `${isMobile ? SCRUB_VH_MOBILE : SCRUB_VH}vh` }}
      className={`relative bg-base ${mounted ? "" : "film-desktop"}`}
      aria-label="Въведение"
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/intro/intro-poster.jpg?v=${ASSET_VERSION}`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
        <CinematicGrade deep />

        {/* cinema letterbox — the widescreen frame that makes the footage a film */}
        <motion.div
          aria-hidden
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="absolute inset-x-0 top-0 z-20 h-[6svh] origin-top bg-black md:h-[7svh]"
        />
        <motion.div
          aria-hidden
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="absolute inset-x-0 bottom-0 z-20 h-[6svh] origin-bottom bg-black md:h-[7svh]"
        />
        {/* thin scroll-progress line along the bottom letterbox bar */}
        <motion.div
          aria-hidden
          style={{ scaleX: progress }}
          className="absolute inset-x-0 bottom-0 z-30 h-0.5 origin-left bg-accent/80"
        />

        {/* darkened left while the wordmark holds the frame */}
        <motion.div
          aria-hidden
          style={{
            opacity: leftScrim,
            background:
              "linear-gradient(90deg, rgba(8,9,12,0.88) 0%, rgba(8,9,12,0.5) 30%, transparent 62%)",
          }}
          className="pointer-events-none absolute inset-0"
        />

        {/* ── Beat 0 — the original wordmark, flying past as you enter ── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 [perspective:1100px]">
          <motion.div
            style={{ opacity: logoOpacity, scale: logoScale, filter: logoFilter }}
            className="absolute inset-0 mx-auto flex h-full w-full max-w-wide flex-col justify-center px-6 md:px-16 xl:px-24"
          >
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="label-fine text-accent"
            >
              Пловдив · Премиум автомобили
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.22 }}
              className="relative mt-4 w-[clamp(260px,44vw,600px)] max-w-full select-none"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="AutoHaus" className="w-full" />
              {/* light sweep across the wordmark glyphs only (logo-masked) */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{
                  WebkitMaskImage: "url(/brand/logo.svg)",
                  maskImage: "url(/brand/logo.svg)",
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }}
              >
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  initial={{ x: "-130%" }}
                  animate={{ x: "340%" }}
                  transition={{ duration: 1.5, delay: 1.1, ease: "easeInOut", repeat: Infinity, repeatDelay: 3.6 }}
                />
              </div>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.34 }}
              className="mt-5 max-w-sm text-white/80 md:text-lg"
            >
              Влезте в нашия свят.
            </motion.p>
          </motion.div>
        </div>

        {/* ── Story beats — elements embedded in the space of the footage ── */}
        <div onMouseMove={onPointer} className="absolute inset-0 z-10 [perspective:1100px]">
          <motion.div style={{ x: bx, y: by }} className="pointer-events-none absolute inset-0">
            <DepthBeat beat={BEAT_LINE} progress={progress} />
            <ProofBeat progress={progress} />
            <WelcomeBeat progress={progress} />
          </motion.div>
        </div>

        {/* dissolve → hero */}
        <motion.div
          aria-hidden
          style={{ opacity: cover }}
          className="pointer-events-none absolute inset-0 bg-base"
        />

        {/* loading shimmer */}
        {!ready && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <div className="h-px w-40 overflow-hidden bg-white/15">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round((loaded / FRAME_COUNT) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* scroll cue */}
        {ready && (
          <motion.div
            style={{ opacity: hint }}
            className="pointer-events-none absolute inset-x-0 bottom-[9svh] z-10 flex flex-col items-center gap-3 text-white/70 md:bottom-[10svh]"
          >
            <span className="label-fine">Скролирайте, за да влезете</span>
            <motion.span
              animate={{ scaleY: [0.35, 1, 0.35], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="h-9 w-px origin-top bg-white/50"
            />
          </motion.div>
        )}
      </div>
    </section>
    ) : null}
    </>
  );
}

/** Shared depth recipe — resolve out of blur, hold, accelerate past the lens. */
function useBeat(window4: Window4, progress: MotionValue<number>) {
  const [a, holdAt, r, gone] = window4;
  const opacity = useTransform(progress, [a, holdAt, r, gone], [0, 1, 1, 0]);
  const scale = useTransform(progress, [a, holdAt, r, gone], [0.9, 1, 1.05, 1.45]);
  const y = useTransform(progress, [a, holdAt], [44, 0]);
  const blur = useTransform(progress, [a, holdAt, r, gone], [10, 0, 0, 16]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const line = useTransform(progress, [a + 0.02, holdAt + 0.03], [0, 1]);
  return { opacity, scale, y, filter, line };
}

/**
 * One story beat, physically staged: it resolves out of depth (blur + scale +
 * rise), drifts forward with the camera while it holds, then accelerates past
 * the lens. A hairline underline draws in while the line is present — the
 * beat's anchor to the frame.
 */
function DepthBeat({
  beat,
  progress,
}: {
  beat: typeof BEAT_LINE;
  progress: MotionValue<number>;
}) {
  const { opacity, scale, y, filter, line } = useBeat(beat.window, progress);

  const alignCls =
    beat.align === "left"
      ? "items-start text-left pl-6 md:pl-[10vw]"
      : beat.align === "right"
        ? "items-end text-right pr-6 md:pr-[10vw]"
        : "items-center text-center px-6";

  return (
    <motion.div
      style={{ opacity, scale, y, filter }}
      className={`absolute inset-0 flex flex-col justify-center will-change-[transform,filter,opacity] ${alignCls}`}
    >
      <p className="flex max-w-[14ch] flex-wrap text-balance font-display text-[clamp(1.85rem,6vw,5.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.5)]">
        {beat.text.split(" ").map((w, i) => (
          <BeatWord key={i} word={w} offset={i * 0.014} window={beat.window} progress={progress} />
        ))}
      </p>
      <motion.span
        aria-hidden
        style={{ scaleX: line }}
        className={`mt-6 h-px w-40 bg-gradient-to-r from-transparent via-white/70 to-transparent md:w-64 ${
          beat.align === "left" ? "origin-left" : beat.align === "right" ? "origin-right" : "origin-center"
        }`}
      />
    </motion.div>
  );
}

/**
 * Beat 2 — the proof cluster: three counters that count up with your scroll,
 * separated by machined hairlines inside a corner-ticked instrument frame.
 * Живи числа вместо изречение — the film states its case in telemetry.
 */
function ProofBeat({ progress }: { progress: MotionValue<number> }) {
  const { opacity, scale, y, filter, line } = useBeat(W_PROOF, progress);
  return (
    <motion.div
      style={{ opacity, scale, y, filter }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-[transform,filter,opacity]"
    >
      <p className="label-fine text-white/70">
        <span aria-hidden className="mr-2 text-racing">[</span>
        Доказано с годините
        <span aria-hidden className="ml-2 text-racing">]</span>
      </p>
      <div className="relative mt-7 flex flex-col items-stretch gap-6 px-8 py-7 sm:flex-row sm:gap-0 sm:px-10 md:px-14">
        {/* corner ticks */}
        <span aria-hidden className="absolute left-0 top-0 size-6 border-l border-t border-white/45" />
        <span aria-hidden className="absolute right-0 top-0 size-6 border-r border-t border-white/45" />
        <span aria-hidden className="absolute bottom-0 left-0 size-6 border-b border-l border-white/45" />
        <span aria-hidden className="absolute bottom-0 right-0 size-6 border-b border-r border-white/45" />
        {PROOF.map(([to, suffix, label], i) => (
          <div
            key={label}
            className={`flex flex-col items-center px-2 sm:px-8 md:px-12 ${
              i > 0 ? "sm:border-l sm:border-white/20" : ""
            }`}
          >
            <ScrollCounter to={to} suffix={suffix} window4={W_PROOF} progress={progress} />
            <span className="label-fine mt-2.5 max-w-[11rem] text-white/65">{label}</span>
          </div>
        ))}
      </div>
      <motion.span
        aria-hidden
        style={{ scaleX: line }}
        className="mt-7 h-px w-48 origin-center bg-gradient-to-r from-transparent via-white/60 to-transparent md:w-72"
      />
    </motion.div>
  );
}

/** A number that counts up with the scrub itself — frame-accurate, no timers. */
function ScrollCounter({
  to,
  suffix,
  window4,
  progress,
}: {
  to: number;
  suffix: string;
  window4: Window4;
  progress: MotionValue<number>;
}) {
  const [a, holdAt] = window4;
  const text = useTransform(progress, [a + 0.015, holdAt + 0.01], [0, to], { clamp: true });
  const shown = useTransform(text, (v) => `${Math.round(v).toLocaleString("bg-BG")}${suffix}`);
  return (
    <motion.span className="font-display text-[clamp(2.4rem,5vw,4.2rem)] font-extrabold leading-none tracking-tight text-white tabular-nums [text-shadow:0_2px_24px_rgba(0,0,0,0.5)]">
      {shown}
    </motion.span>
  );
}

/**
 * Beat 3 — the welcome card: the film's title-card handoff into the
 * collection. Eyebrow, brand line, light signature and a live scroll cue.
 */
function WelcomeBeat({ progress }: { progress: MotionValue<number> }) {
  const { opacity, scale, y, filter, line } = useBeat(W_WELCOME, progress);
  return (
    <motion.div
      style={{ opacity, scale, y, filter }}
      className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center will-change-[transform,filter,opacity]"
    >
      <p className="label-fine text-white/70">
        <span aria-hidden className="mr-2 text-racing">[</span>
        Добре дошли
        <span aria-hidden className="ml-2 text-racing">]</span>
      </p>
      <p className="mt-5 font-display text-[clamp(2rem,5.5vw,4.6rem)] font-extrabold leading-[1] tracking-[-0.03em] text-white [text-shadow:0_2px_28px_rgba(0,0,0,0.5)]">
        Колекцията ви очаква<span className="text-accent">.</span>
      </p>
      <motion.span
        aria-hidden
        style={{ scaleX: line }}
        className="mt-7 h-px w-56 origin-center bg-gradient-to-r from-transparent via-white/70 to-transparent md:w-80"
      />
      <span className="label-fine mt-6 flex flex-col items-center gap-3 text-white/65">
        Продължете надолу
        <span className="vd-scrollcue block h-8 w-px bg-white/60" />
      </span>
    </motion.div>
  );
}

/** One word of a beat, arriving a breath after the previous — the line lands
 *  like a title card being set, not stamped. */
function BeatWord({
  word,
  offset,
  window: w,
  progress,
}: {
  word: string;
  offset: number;
  window: Window4;
  progress: MotionValue<number>;
}) {
  const [a, holdAt] = w;
  const opacity = useTransform(progress, [a + offset, holdAt + offset], [0, 1]);
  const y = useTransform(progress, [a + offset, holdAt + offset], [26, 0]);
  return (
    <motion.span style={{ opacity, y }} className="mr-[0.28em] inline-block">
      {word}
    </motion.span>
  );
}

/**
 * The mobile opening — a poster, not a film. One still, composed frame of the
 * house at golden hour that paints instantly (no zoom, no scrub, no frame
 * downloads), with the full hero grammar: the line, a real CTA pair and the
 * live proof strip. Everything a first-time visitor needs is one thumb away.
 */
function MobileOpening({ copy = DEFAULT_INTRO_COPY }: { copy?: IntroCopy }) {
  const rise = (delay: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const, delay },
  });
  return (
    <section className="relative flex h-[100svh] flex-col justify-end overflow-hidden bg-black" aria-label="Въведение">
      {/* The house at golden hour — a purpose-cut portrait crop of the
          facility (no runtime pano-cropping, no upscaling). Static: the
          photograph carries the drama, the paint is instant. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/photos/autohaus-hero-m-1080.webp"
        srcSet="/photos/autohaus-hero-m-750.webp 750w, /photos/autohaus-hero-m-1080.webp 1080w"
        sizes="100vw"
        alt=""
        aria-hidden
        // The phone LCP — fetch it at highest priority, before anything else.
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <CinematicGrade deep />
      {/* static letterbox + legibility base */}
      <div aria-hidden className="absolute inset-x-0 top-0 z-10 h-[4.5svh] bg-black" />
      <div aria-hidden className="absolute inset-x-0 bottom-0 z-10 h-[4.5svh] bg-black" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/45" />

      <div className="relative z-20 px-6 pb-[9svh]">
        {/* The nav already carries the wordmark — the opening leads with the
            place and the line, never a second logo in the same frame. */}
        <motion.p {...rise(0.1)} className="label-fine flex items-center gap-3 text-accent">
          <span aria-hidden className="h-px w-8 bg-accent/50" />
          {copy.eyebrow}
        </motion.p>
        <motion.p
          {...rise(0.22)}
          className="mt-4 max-w-[16ch] font-display text-[clamp(2rem,8.4vw,2.5rem)] font-extrabold leading-[1.06] tracking-[-0.025em] text-white"
        >
          {copy.line1}{" "}
          <span className="text-white/60">{copy.line2}</span>
        </motion.p>

        {/* The hero's ask — browse the collection, or one tap to call */}
        <motion.div {...rise(0.36)} className="mt-7 flex items-center gap-3">
          <Link
            href="/avtomobili"
            className="flex h-[3.25rem] flex-1 items-center justify-center gap-2 rounded-full bg-white font-display text-[15px] font-bold tracking-tight text-[#08090c] transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Разгледай колекцията
            <ArrowRight className="size-4" />
          </Link>
          <a
            href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
            aria-label={`Обадете се: ${contactInfo.phone}`}
            className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-full border border-white/30 bg-white/[0.06] text-white backdrop-blur-md transition-transform duration-150 active:scale-90"
          >
            <Phone className="size-[1.15rem]" strokeWidth={1.7} />
          </a>
        </motion.div>

        {/* live proof — the trust footer of the poster */}
        <motion.div {...rise(0.5)} className="mt-7 flex items-center gap-6 border-t border-white/15 pt-4">
          {PROOF_MOBILE.map(([to, suffix, label]) => (
            <div key={label} className="min-w-0">
              <p className="font-display text-xl font-extrabold leading-none text-white">
                <StatCounter to={to} suffix={suffix} duration={1.8} />
              </p>
              <p className="label-fine mt-1.5 text-white/55">{label}</p>
            </div>
          ))}
        </motion.div>
        <motion.p {...rise(0.62)} className="label-fine mt-6 flex items-center gap-3 text-white/60">
          {copy.scrollHint}
          <span className="vd-scrollcue block h-6 w-px bg-white/60" />
        </motion.p>
      </div>
    </section>
  );
}
