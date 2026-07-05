"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { CinematicGrade } from "@/components/fx/CinematicGrade";

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

const BEATS: { text: string; sub?: string; window: Window4; align: "center" | "left" | "right" }[] = [
  {
    text: "Някои коли се купуват.",
    window: [0.3, 0.4, 0.5, 0.58],
    align: "left",
  },
  {
    text: "Други се заслужават.",
    window: [0.56, 0.66, 0.76, 0.83],
    align: "right",
  },
  {
    text: "Добре дошли в AutoHaus.",
    sub: "Пловдив · Премиум автомобили от 2004",
    window: [0.82, 0.9, 0.96, 1],
    align: "center",
  },
];

export function IntroFilm() {
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
  // Film HUD: running timecode (24 fps grammar) + reel progress.
  const timecode = useTransform(progress, (p) => {
    const t = p * (FRAME_COUNT / 24);
    return `00:0${Math.floor(t)}:${String(Math.floor((t % 1) * 24)).padStart(2, "0")}`;
  });
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
    if (!mounted || reduce) return;
    const dir = isMobile ? "frames-m" : "frames";
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
    if (reduce || !activeRef.current) return;
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

  // Reduced motion → one still, the wordmark, no pin.
  if (reduce) {
    return (
      <section className="relative h-[100svh] w-full overflow-hidden bg-base">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/intro/intro-poster.jpg?v=${ASSET_VERSION}`}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
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

  return (
    <section
      ref={wrapperRef}
      style={{ height: `${isMobile ? SCRUB_VH_MOBILE : SCRUB_VH}vh` }}
      className="relative bg-base"
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
        {/* film HUD riding the bottom bar: reel label · timecode · progress */}
        <div className="absolute inset-x-0 bottom-0 z-30 flex h-[6svh] items-center justify-center gap-6 px-5 md:h-[7svh] md:justify-start md:px-10">
          <span className="label-fine text-white/45">Reel 01 · AutoHaus</span>
          <motion.span className="label-fine tabular-nums text-white/60">{timecode}</motion.span>
        </div>
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

        {/* ── Story beats — lines embedded in the space of the footage ── */}
        <div onMouseMove={onPointer} className="absolute inset-0 z-10 [perspective:1100px]">
          <motion.div style={{ x: bx, y: by }} className="pointer-events-none absolute inset-0">
            {BEATS.map((b) => (
              <DepthBeat key={b.text} beat={b} progress={progress} />
            ))}
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
  );
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
  beat: (typeof BEATS)[number];
  progress: MotionValue<number>;
}) {
  const [a, holdAt, r, gone] = beat.window;
  const opacity = useTransform(progress, [a, holdAt, r, gone], [0, 1, 1, 0]);
  const scale = useTransform(progress, [a, holdAt, r, gone], [0.9, 1, 1.05, 1.45]);
  const y = useTransform(progress, [a, holdAt], [44, 0]);
  const blur = useTransform(progress, [a, holdAt, r, gone], [10, 0, 0, 16]);
  const filter = useTransform(blur, (b) => `blur(${b}px)`);
  const line = useTransform(progress, [a + 0.02, holdAt + 0.03], [0, 1]);

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
      {beat.sub && (
        <p className="label-fine mt-5 text-white/70">{beat.sub}</p>
      )}
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
